import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  getAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  setExpectedAccount,
} from "../services/account.js"

import { withMinimumLoading } from "../platform/loading.js"

const AuthContext = createContext(null)

export function destinationFor(onboarding, user) {
  if (user && user.role !== "jobseeker") return "/dashboard"

  return onboarding?.completed
    ? "/dashboard"
    : `/jobseeker/onboarding/${Math.min(5, Math.max(1, Number(onboarding?.current_step) || 1))}`
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, onboarding: null })

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const generation = useRef(0)

  const currentUser = useRef(null)

  const channel = useRef(null)
  const authenticating = useRef(false)

  const [sessionNotice, setSessionNotice] = useState("")

  const accept = useCallback((result) => {
    const next = result?.user || null

    if (
      currentUser.current &&
      next &&
      (next.id !== currentUser.current.id ||
        next.role !== currentUser.current.role)
    ) {
      setSessionNotice(
        "The shared browser session changed in another tab. This workspace now shows the account signed in on the server.",
      )
    }

    currentUser.current = next

    setExpectedAccount(next)

    setSession({ user: next, onboarding: result?.onboarding || null })
  }, [])

  const announce = () => {
    channel.current?.postMessage("changed")

    try {
      localStorage.setItem(
        "peso-session-event",
        `${Date.now()}:${Math.random()}`,
      )
    } catch {}
  }

  const refresh = useCallback(async () => {
    if (authenticating.current) return null
    const request = ++generation.current

    try {
      const result = await withMinimumLoading(getAccount)

      if (request === generation.current) {
        accept(result)

        setError("")
      }

      return result
    } catch (failure) {
      if (request === generation.current) {
        if (failure.status === 401) {
          accept(null)

          setError("")
        } else {
          setError(
            failure.message ||
              "We couldn't connect to your account. Please try again.",
          )
        }
      }

      if (failure.status !== 401) throw failure

      return null
    } finally {
      if (request === generation.current) setLoading(false)
    }
  }, [accept])

  useEffect(() => {
    refresh().catch(() => {})

    const profileUpdated = (event) => {
      if (event.detail?.onboarding) {
        setSession((current) => ({
          ...current,

          onboarding: event.detail.onboarding,
        }))
      }

      refresh().catch(() => {})
    }

    const recheck = () => refresh().catch(() => {})

    const visible = () => {
      if (document.visibilityState === "visible") recheck()
    }

    const stale = () => {
      setLoading(true)
      recheck()
    }

    const storage = (event) => {
      if (event.key === "peso-session-event") recheck()
    }

    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("peso-session")

      channel.current.onmessage = recheck
    }

    window.addEventListener("focus", recheck)

    document.addEventListener("visibilitychange", visible)

    window.addEventListener("storage", storage)

    window.addEventListener("pesomatch:session-stale", stale)

    window.addEventListener("pesomatch:profile-updated", profileUpdated)

    return () => {
      window.removeEventListener("focus", recheck)

      document.removeEventListener("visibilitychange", visible)

      window.removeEventListener("storage", storage)

      window.removeEventListener("pesomatch:session-stale", stale)

      window.removeEventListener("pesomatch:profile-updated", profileUpdated)

      channel.current?.close()

      channel.current = null
    }
  }, [refresh])

  const authenticate = async (action, payload) => {
    authenticating.current = true
    ++generation.current

    try {
      const result = await action(payload)

      accept(result)

      setSessionNotice("")

      announce()

      setError("")

      return result
    } finally {
      authenticating.current = false
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutAccount()
    } catch (failure) {
      if (failure.status !== 401) throw failure
    }

    ++generation.current

    accept(null)

    announce()

    setError("")

    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        ...session,

        sessionNotice,

        loading,

        error,

        refresh,

        login: (payload) => authenticate(loginAccount, payload),

        register: registerAccount,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) throw new Error("useAuth must be used within AuthProvider")

  return value
}
