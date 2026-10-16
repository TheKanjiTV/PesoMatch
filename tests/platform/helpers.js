import { test as base, expect } from "@playwright/test"

import { execFileSync } from "node:child_process"

import { fileURLToPath } from "node:url"

import { apiCall, personal, education, preferences } from "../fixtures.js"

export { apiCall, expect }

const backend = fileURLToPath(new URL("../../backend", import.meta.url))

export function provision(email, role) {
  execFileSync("php", ["artisan", "peso:access", email, role], {
    cwd: backend,

    windowsHide: true,

    stdio: "pipe",
  })
}

export async function provisionAndSignIn(account, page, role) {
  provision(account.email, role)
  // Provisioning intentionally invalidates old sessions; test the new boundary.
  expect((await apiCall(account.request, "/api/auth/user")).status()).toBe(401)
  expect(
    (
      await apiCall(account.request, "/api/auth/login", "POST", {
        email: account.email,
        password: account.password,
      })
    ).status(),
  ).toBe(200)
  await page.context().clearCookies()
  await page
    .context()
    .addCookies((await account.request.storageState()).cookies)
}

export const test = base.extend({
  tourComplete: [true, { option: true }],
  completeProfile: [true, { option: true }],

  account: async ({ playwright, tourComplete, completeProfile }, use) => {
    const request = await playwright.request.newContext({
      baseURL: "http://127.0.0.1:8443",
    })

    const email = `platform.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`,
      password = `Local-Test-${Date.now()}-Secure!`

    expect(
      (
        await apiCall(request, "/api/auth/register", "POST", {
          first_name: "Platform",

          last_name: "Tester",

          email,

          password,

          terms_accepted: true,
          password_confirmation: password,
        })
      ).status(),
    ).toBe(201)

    expect(
      (
        await apiCall(request, "/api/auth/login", "POST", { email, password })
      ).status(),
    ).toBe(200)

    if (completeProfile) {
      for (const [section, data] of [
        ["personal", personal("Platform")],

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
      ])
        expect(
          (
            await apiCall(
              request,

              `/api/jobseeker/onboarding/${section}`,

              "PATCH",

              data,
            )
          ).status(),
        ).toBe(200)

      expect(
        (
          await apiCall(request, "/api/jobseeker/onboarding/complete", "POST")
        ).status(),
      ).toBe(200)
    }

    if (tourComplete && completeProfile)
      expect(
        (
          await apiCall(request, "/api/auth/preferences", "PATCH", {
            dashboard_tour_completed: true,
          })
        ).status(),
      ).toBe(200)

    const user = (await (await apiCall(request, "/api/auth/user")).json()).user

    await use({
      request,

      email,

      password,

      user,

      state: await request.storageState(),
    })

    execFileSync(
      "php",

      [
        fileURLToPath(new URL("./cleanup.php", import.meta.url)),

        String(user.id),

        email,
      ],

      { cwd: backend, windowsHide: true, stdio: "pipe" },
    )

    await request.dispose()
  },

  storageState: async ({ account }, use) => use(account.state),
})
