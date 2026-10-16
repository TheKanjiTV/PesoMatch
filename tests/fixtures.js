import { test as base, expect } from "@playwright/test"

export const personal = (firstName = "Browser") => ({
  first_name: firstName,

  middle_name: "",

  last_name: "Check",

  birth_date: "2000-01-02",

  sex: "",

  mobile_number: "+639171234567",

  address_line: "Test address",

  province: "Oriental Mindoro",

  municipality: "Bansud",

  barangay: "Poblacion",
})

export const education = {
  highest_attainment: "College Graduate",

  school_name: "Test College",

  course_program: "Information Technology",

  year_graduated: 2024,

  educational_status: "Graduated",
}

export const preferences = {
  occupations: ["Customer Service", "Office Assistant"],

  preferred_industry: "Services",

  preferred_location: "Oriental Mindoro",

  employment_types: ["Full-time"],

  work_arrangements: ["On-site", "Hybrid"],

  willing_to_relocate: false,
}

export async function apiCall(request, path, method = "GET", data) {
  if (method !== "GET") {
    const csrf = await request.get("/sanctum/csrf-cookie")

    expect(csrf.status(), "Sanctum CSRF endpoint").toBe(204)
  }

  const cookies = (await request.storageState()).cookies

  const token = cookies.find((cookie) => cookie.name === "XSRF-TOKEN")?.value

  return request.fetch(path, {
    method,

    ...(data === undefined ? {} : { data }),

    headers: {
      Accept: "application/json",

      "X-Requested-With": "XMLHttpRequest",

      Origin: "http://127.0.0.1:8443",

      Referer: "http://127.0.0.1:8443/",

      ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
    },
  })
}

export const test = base.extend({
  workspaceSession: [
    async ({ playwright }, use) => {
      const request = await playwright.request.newContext({
        baseURL: "http://127.0.0.1:8443",
      })

      const password = `Browser-${Date.now()}-Check!`

      const email = `ui.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`

      const registered = await apiCall(request, "/api/auth/register", "POST", {
        first_name: "Browser",

        last_name: "Check",

        email,

        password,

        terms_accepted: true,
        password_confirmation: password,
      })

      expect(registered.status(), "Create isolated browser account").toBe(201)

      expect(
        (
          await apiCall(request, "/api/auth/login", "POST", { email, password })
        ).status(),
      ).toBe(200)

      for (const [section, values] of [
        ["personal", personal()],

        ["education", education],

        [
          "skills",

          {
            skills: [1, 2, 3],

            certifications: [],

            languages: [],

            licenses: [],
          },
        ],

        ["work-experience", { has_experience: false, experiences: [] }],

        ["preferences", preferences],
      ]) {
        const response = await apiCall(
          request,

          `/api/jobseeker/onboarding/${section}`,

          "PATCH",

          values,
        )

        expect(response.status(), `Save ${section}`).toBe(200)
      }

      expect(
        (
          await apiCall(request, "/api/jobseeker/onboarding/complete", "POST")
        ).status(),
      ).toBe(200)

      expect(
        (
          await apiCall(request, "/api/auth/preferences", "PATCH", {
            dashboard_tour_completed: true,
          })
        ).status(),
      ).toBe(200)

      await use(await request.storageState())

      await request.dispose()
    },

    { scope: "worker" },
  ],

  storageState: async ({ workspaceSession }, use) => use(workspaceSession),
})

export { expect }
