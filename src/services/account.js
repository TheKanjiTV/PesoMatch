// Shared Laravel session/CSRF client for accounts, profiling and the platform API.

// Active employment services use src/platform/api.js.

const ACCOUNT_ORIGIN = (import.meta.env.VITE_ACCOUNT_API_URL || "").replace(
  /\/$/,

  "",
)

let csrfRequest
const xsrfCookie = () =>
  document.cookie.split("; ").find((cookie) => cookie.startsWith("XSRF-TOKEN="))
// Concurrent identical reads only. No settled response or private data cache.
const pendingReads = new Map()

export function accountRequest(path, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  if (!["GET", "HEAD"].includes(method)) {
    pendingReads.clear()
    return performAccountRequest(path, options).finally(() =>
      pendingReads.clear(),
    )
  }
  // A caller's AbortSignal/headers retain independent request semantics.
  const share =
    method === "GET" && Object.keys(options).every((key) => key === "method")
  if (!share) return performAccountRequest(path, options)
  if (pendingReads.has(path)) return pendingReads.get(path)
  const promise = performAccountRequest(path, options).finally(() => {
    if (pendingReads.get(path) === promise) pendingReads.delete(path)
  })
  pendingReads.set(path, promise)
  return promise
}

export class AccountError extends Error {
  constructor(message, status, errors = {}) {
    super(message)

    this.name = "AccountError"

    this.status = status

    this.errors = errors
  }
}

async function csrfCookie() {
  if (!csrfRequest) {
    csrfRequest = fetch(`${ACCOUNT_ORIGIN}/sanctum/csrf-cookie`, {
      credentials: "include",

      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok)
          throw new AccountError(
            "We couldn't connect securely. Please try again.",

            response.status,
          )
      })

      .finally(() => {
        csrfRequest = undefined
      })
  }

  await csrfRequest
}

async function performAccountRequest(
  path,

  { method = "GET", body, reuseCsrf = false, ...options } = {},
) {
  const multipart = body instanceof FormData

  const mutating = !["GET", "HEAD"].includes(method.toUpperCase())

  try {
    if (mutating && !(reuseCsrf && xsrfCookie())) await csrfCookie()

    const token = xsrfCookie()?.slice(11)

    const response = await fetch(`${ACCOUNT_ORIGIN}${path}`, {
      ...options,

      method,

      credentials: "include",

      headers: {
        Accept: "application/json",

        "X-Requested-With": "XMLHttpRequest",

        ...(body !== undefined && !multipart
          ? { "Content-Type": "application/json" }
          : {}),

        ...(mutating && token
          ? { "X-XSRF-TOKEN": decodeURIComponent(token) }
          : {}),

        ...options.headers,
      },

      ...(body !== undefined
        ? { body: multipart ? body : JSON.stringify(body) }
        : {}),
    })

    const json =
      response.status === 204 ? {} : await response.json().catch(() => null)

    if (!response.ok)
      throw new AccountError(
        (response.status >= 500
          ? "PesoMatch is temporarily unavailable. Please try again. Your entries are still here."
          : json?.message) ||
          (response.status === 419
            ? "Your session expired. Sign in again to continue."
            : response.status === 429
              ? "Too many requests. Wait a moment before trying again."
              : path === "/api/auth/login"
                ? "We couldn't sign you in. Reload this page and try again."
                : mutating
                  ? "We couldn't save your changes. Please try again."
                  : "We couldn't load these records. Please try again."),

        response.status,

        response.status >= 500 ? {} : json?.errors || {},
      )

    // A followed HTML redirect is not a successful account/API response.
    if (json === null)
      throw new AccountError(
        "We couldn't read the response from PesoMatch. Reload this page and try again.",
        response.status,
      )

    return json
  } catch (error) {
    if (error instanceof AccountError || error.name === "AbortError")
      throw error

    throw new AccountError(
      "Unable to reach PesoMatch. Check your connection and try again. Your entries are still here.",

      0,
    )
  }
}

export const getAccount = () => accountRequest("/api/auth/user")

export const loginAccount = (body) =>
  accountRequest("/api/auth/login", { method: "POST", body })

export const registerAccount = (body) =>
  accountRequest("/api/auth/register", { method: "POST", body })

export const logoutAccount = () =>
  accountRequest("/api/auth/logout", { method: "POST" })

export async function updateAccountPreferences(body) {
  // This tiny explicit preference write must survive immediate page navigation.
  // Use the session's existing CSRF token; the backend still validates it.
  const options = { method: "PATCH", body, keepalive: true }
  try {
    return await accountRequest("/api/auth/preferences", {
      ...options,
      reuseCsrf: true,
    })
  } catch (error) {
    if (error.status !== 419) throw error
    // A stale token gets the normal Sanctum refresh and one retry.
    return accountRequest("/api/auth/preferences", options)
  }
}

export const getOnboarding = () => accountRequest("/api/jobseeker/onboarding")

const saveSection = (section, body) =>
  accountRequest(`/api/jobseeker/onboarding/${section}`, {
    method: "PATCH",

    body,
  })

export const savePersonalInfo = (body) => saveSection("personal", body)

export const saveEducation = (body) => saveSection("education", body)

export const saveSkillsQualifications = (body) => saveSection("skills", body)

export const saveWorkExperience = (body) => saveSection("work-experience", body)

export const saveJobPreferences = (body) => saveSection("preferences", body)

export const completeOnboarding = () =>
  accountRequest("/api/jobseeker/onboarding/complete", { method: "POST" })

export const getProfile = () => accountRequest("/api/jobseeker/profile")

export const updateProfile = (body) =>
  accountRequest("/api/jobseeker/profile", { method: "PATCH", body })

export const getSkills = () => accountRequest("/api/skills")

export const updateAccount = (body) =>
  accountRequest("/api/auth/account", { method: "PATCH", body })

export const updatePassword = (body) =>
  accountRequest("/api/auth/password", { method: "PATCH", body })

export const deleteAccount = (body) =>
  accountRequest("/api/auth/account", { method: "DELETE", body })
