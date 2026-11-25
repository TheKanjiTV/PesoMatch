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
  expect((await apiCall(account.request, "/api/v1/auth/user")).status()).toBe(401)
  expect(
    (
      await apiCall(account.request, "/api/v1/auth/login", "POST", {
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
  autoDismissAiPrivacy: [true, { option: true }],

  page: async ({ page, autoDismissAiPrivacy }, use) => {
    if (autoDismissAiPrivacy) {
      // Routine page checks explicitly continue without external AI. Dedicated
      // consent tests use their own base fixture and inspect the notice itself.
      await page.addLocatorHandler(
        page.getByRole("dialog", { name: "AI privacy & response preferences" }),
        async (dialog) =>
          dialog.getByRole("button", { name: "Done" }).click(),
      )
    }
    await use(page)
  },

  account: async ({ playwright, tourComplete, completeProfile }, use) => {
    const request = await playwright.request.newContext({
      baseURL: "http://127.0.0.1:8443",
    })

    const email = `platform.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`,
      password = `Local-Test-${Date.now()}-Secure!`

    expect(
      (
        await apiCall(request, "/api/v1/auth/register", "POST", {
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
        await apiCall(request, "/api/v1/auth/login", "POST", { email, password })
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

              `/api/v1/jobseeker/onboarding/${section}`,

              "PATCH",

              data,
            )
          ).status(),
        ).toBe(200)

      expect(
        (
          await apiCall(request, "/api/v1/jobseeker/onboarding/complete", "POST")
        ).status(),
      ).toBe(200)
    }

    if (tourComplete && completeProfile)
      expect(
        (
          await apiCall(request, "/api/v1/auth/preferences", "PATCH", {
            dashboard_tour_completed: true,
          })
        ).status(),
      ).toBe(200)

    const user = (await (await apiCall(request, "/api/v1/auth/user")).json()).user

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

  workflowCatalog: async ({ account, page }, use) => {
    let vacancy, program
    try {
      await provisionAndSignIn(account, page, "peso_staff")
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      })
      const description = "Disposable local browser workflow fixture."
      const vacancyResponse = await apiCall(
        account.request,
        "/api/v1/platform/vacancies",
        "POST",
        {
          title: `Browser workflow vacancy ${account.user.id}`,
          organization: "Synthetic local employer",
          location: "Mansalay",
          industry: "Services",
          employment_type: "Full-time",
          description,
          skills: ["Computer Literacy"],
          slots: 2,
          deadline: today,
          status: "published",
        },
      )
      expect(vacancyResponse.status()).toBe(200)
      vacancy = (await vacancyResponse.json()).data
      const programResponse = await apiCall(
        account.request,
        "/api/v1/platform/training",
        "POST",
        {
          title: `Browser workflow training ${account.user.id}`,
          provider: "Synthetic local provider",
          location: "Mansalay",
          mode: "In person",
          description,
          requirements: "Review the synthetic participant's consent.",
          skills: ["Computer Literacy"],
          capacity: 2,
          starts_on: today,
          ends_on: today,
          schedule: "Local test schedule",
          fee: 0,
          status: "published",
        },
      )
      expect(programResponse.status()).toBe(200)
      program = (await programResponse.json()).data
      await provisionAndSignIn(account, page, "jobseeker")
      await use({ vacancy, program })
    } finally {
      if (vacancy || program)
        execFileSync(
          "php",
          [
            fileURLToPath(
              new URL("./cleanup-workflow-catalog.php", import.meta.url),
            ),
            String(account.user.id),
            account.email,
            String(vacancy?.id || 0),
            String(program?.id || 0),
          ],
          { cwd: backend, windowsHide: true, stdio: "pipe" },
        )
    }
  },
})
