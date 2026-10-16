import { test as publicTest, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import { test, apiCall, provision, provisionAndSignIn } from "./helpers.js"

import fs from "node:fs/promises"

async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function axe(page) {
  const result = await new AxeBuilder({ page })

    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

    .analyze()

  expect(
    result.violations.map((v) => ({
      id: v.id,

      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
}

publicTest(
  "new public pages are responsive and accessible",

  async ({ page }) => {
    const errors = []

    page.on("pageerror", (e) => errors.push(e.message))

    await fs.mkdir("artifacts/facilitation", { recursive: true })

    await page.setViewportSize({ width: 1440, height: 1000 })

    await page.goto("/")

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Good work starts with a clear path.",
    )

    await expect(page.getByText("Loading opportunities…")).toHaveCount(0)

    await page.screenshot({
      path: "artifacts/facilitation/landing-desktop.png",

      fullPage: true,
    })

    await axe(page)

    await noOverflow(page)

    await page.setViewportSize({ width: 390, height: 844 })

    await page.screenshot({
      path: "artifacts/facilitation/landing-mobile.png",

      fullPage: true,
    })

    await noOverflow(page)

    await axe(page)

    await page.getByRole("button", { name: "Toggle navigation" }).click()

    await expect(
      page.getByRole("navigation", { name: "Mobile public navigation" }),
    ).toBeVisible()

    for (const route of [
      "/login",

      "/register",

      "/privacy",

      "/terms",

      "/forgot-password",
    ]) {
      await page.goto(route)

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

      await noOverflow(page)

      await axe(page)
    }

    expect(errors).toEqual([])
  },
)

test("jobseeker routes load real service screens at desktop and mobile", async ({
  page,
}) => {
  const errors = []

  page.on("pageerror", (e) => errors.push(e.message))

  await page.setViewportSize({ width: 1440, height: 1000 })

  for (const route of [
    "/dashboard",

    "/jobs",

    "/training",

    "/matches",

    "/referrals",

    "/enrollments",

    "/placements",

    "/outcomes",

    "/services",

    "/events",

    "/labor-market",

    "/profile",

    "/settings",
  ]) {
    await page.goto(route)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(
      page.getByRole("status").filter({ hasText: "Loading" }),
    ).toHaveCount(0)

    await noOverflow(page)

    if (
      ["/dashboard", "/jobs", "/training", "/profile", "/settings"].includes(
        route,
      )
    )
      await axe(page)
  }

  await page.goto("/dashboard")

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

  await expect(
    page.getByRole("status").filter({ hasText: "Loading" }),
  ).toHaveCount(0)

  await page.screenshot({
    path: "artifacts/facilitation/workspace-desktop.png",

    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })

  await page.screenshot({
    path: "artifacts/facilitation/workspace-mobile.png",

    fullPage: true,
  })

  await noOverflow(page)

  await axe(page)

  await page.getByRole("button", { name: "Toggle service navigation" }).click()

  await expect(
    page.getByRole("navigation", { name: "Employment services" }),
  ).toBeVisible()

  await page

    .getByRole("link", { name: "Training Enrollment", exact: true })

    .click()

  await expect(
    page.getByRole("heading", { level: 1, name: "Training Enrollment" }),
  ).toBeVisible()

  expect(errors).toEqual([])
})

test("referral, enrollment, PESO review, placement and outcome persist end to end", async ({
  page,

  account,
}) => {
  test.setTimeout(180000)

  // Use opt-in fictional catalog, not real employer records.

  const catalog = await (await apiCall(account.request, "/api/public/catalog"))

    .json()

  const vacancy = (
      await (
        await apiCall(
          account.request,
          "/api/platform/vacancies?include_samples=1",
        )
      ).json()
    ).data.find((v) => v.is_sample),
    program = (
      await (
        await apiCall(
          account.request,
          "/api/platform/training?include_samples=1",
        )
      ).json()
    ).data.find((p) => p.is_sample)

  expect(vacancy).toBeTruthy()

  expect(program).toBeTruthy()

  const record = (id) =>
    page

      .getByRole("article")

      .filter({ hasText: `Record #${String(id).padStart(5, "0")} ·` })

  await page.goto(`/jobs/${vacancy.id}`)

  await page.getByRole("button", { name: "Save vacancy", exact: true }).click()

  await expect(page.getByRole("status")).toContainText("Vacancy saved")

  await page

    .getByRole("button", { name: "Request PESO referral", exact: true })

    .click()

  await expect(page.getByRole("status")).toContainText("Referral requested")

  const referralId = (
    await (await apiCall(account.request, "/api/platform/referrals")).json()
  ).data.find((r) => r.vacancy_id === vacancy.id).id

  await page.goto("/referrals")

  await expect(
    page.getByRole("heading", { level: 2, name: vacancy.title }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole("heading", { level: 2, name: vacancy.title }),
  ).toBeVisible()

  await page.goto(`/training/${program.id}`)

  await page.getByRole("checkbox").check()

  await page

    .getByRole("button", { name: "Request enrollment", exact: true })

    .click()

  await expect(
    page.getByRole("status").filter({ hasText: "Enrollment requested" }),
  ).toBeVisible()

  const enrollmentId = (
    await (await apiCall(account.request, "/api/platform/enrollments")).json()
  ).data.find((r) => r.training_program_id === program.id)?.id

  await page.goto("/services")

  await page

    .getByRole("button", { name: "Request PESO assistance", exact: true })

    .click()

  await page

    .getByLabel("PESO service")

    .selectOption("Career guidance & counseling")

  await page

    .getByLabel("Tell PESO what support you need")

    .fill("I would like help improving my employment readiness.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    page.getByRole("heading", {
      level: 2,

      name: "Career guidance & counseling",
    }),
  ).toBeVisible()

  await provisionAndSignIn(account, page, "peso_staff")

  await page.goto("/referrals")

  await record(referralId)

    .getByRole("button", { name: "Update status", exact: true })

    .click()

  await page

    .getByLabel("Notes / reason")

    .fill(
      "Profile reviewed. Referred to the sample employer for workflow evaluation.",
    )

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(referralId).getByText("Referred", { exact: true }),
  ).toBeVisible()

  await record(referralId)

    .getByRole("button", { name: "Update status", exact: true })

    .click()

  await page.getByLabel("Next referral status").selectOption("offered")

  await page

    .getByLabel("Notes / reason")

    .fill("Fictional employer offer for local workflow testing.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await record(referralId)

    .getByRole("button", { name: "Verify placement", exact: true })

    .click()

  await page

    .getByLabel("Employment start date")

    .fill(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }))

  await page.getByLabel("Employment type").selectOption("Full-time")

  const future = new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10)

  await page.getByLabel("Follow-up date").fill(future)

  await page

    .getByLabel("Verification evidence / source")

    .fill("Fictional evidence for a disposable local test account.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(referralId).getByText("Placed", { exact: true }),
  ).toBeVisible()

  await page.goto("/enrollments")

  await record(enrollmentId)

    .getByRole("button", { name: "Update status", exact: true })

    .click()

  await page

    .getByLabel("Notes / reason")

    .fill("Enrollment requirements checked in local test.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(enrollmentId).getByText("Confirmed", { exact: true }),
  ).toBeVisible()

  await record(enrollmentId)

    .getByRole("button", { name: "Update status", exact: true })

    .click()

  await page

    .getByLabel("Notes / reason")

    .fill("Training started in local test.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(enrollmentId).getByText("In Progress", { exact: true }),
  ).toBeVisible()

  await record(enrollmentId)

    .getByRole("button", { name: "Update status", exact: true })

    .click()

  await page

    .getByLabel("Provider completion reference")

    .fill("TEST-COMPLETION-001")

  await page

    .getByLabel("Notes / reason")

    .fill("Training completed in local test.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(enrollmentId).getByText("Completed", { exact: true }),
  ).toBeVisible()

  await provisionAndSignIn(account, page, "jobseeker")

  await page.goto("/outcomes")

  await page

    .getByRole("button", { name: "Report employment status", exact: true })

    .click()

  await page

    .getByRole("combobox", { name: /Employment status/ })

    .selectOption("employed")

  await page

    .getByLabel("Notes / reason")

    .fill("Fictional employment status for local end-to-end test.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    page.getByText("Reported · not verified", { exact: true }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByText("Reported · not verified", { exact: true }),
  ).toBeVisible()

  const outcomeId = (
    await (await apiCall(account.request, "/api/platform/outcomes")).json()
  ).data[0].id

  await provisionAndSignIn(account, page, "peso_staff")

  await page.reload()

  await record(outcomeId)

    .getByRole("button", { name: "Verify report", exact: true })

    .click()

  await page

    .getByLabel("Evidence / verification source")

    .fill("Verified fictional report during local workflow evaluation.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    record(outcomeId).getByText("PESO verified", { exact: true }),
  ).toBeVisible()
})

test("staff, employer, provider and administrator workspaces enforce role boundaries", async ({
  page,

  account,
}) => {
  test.setTimeout(150000)

  await page.goto("/users")

  await expect(page.getByRole("alert")).toContainText("does not have access")

  expect((await apiCall(account.request, "/api/platform/users")).status()).toBe(
    403,
  )

  for (const [role, routes] of [
    [
      "peso_staff",

      [
        "/jobseekers",

        "/jobs",

        "/training",

        "/referrals",

        "/enrollments",

        "/services",

        "/outcomes",

        "/labor-market",
      ],
    ],

    ["employer", ["/dashboard", "/jobs", "/referrals", "/placements"]],

    ["training_provider", ["/dashboard", "/training", "/enrollments"]],

    ["admin", ["/users", "/audit"]],
  ]) {
    await provisionAndSignIn(account, page, role)

    for (const route of routes) {
      await page.goto(route)

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

      await expect(
        page.getByRole("status").filter({ hasText: "Loading" }),
      ).toHaveCount(0)

      await noOverflow(page)
    }

    await axe(page)
  }
})

test("real login opens the jobseeker and provisioned partner workspace", async ({
  page,

  account,
}) => {
  await page.goto("/dashboard")

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

  await page.getByRole("button", { name: "Sign out", exact: true }).click()

  await expect(page).toHaveURL(/\/login$/)

  for (const role of ["jobseeker", "employer"]) {
    provision(account.email, role)

    await page.goto("/login")

    await page.getByLabel("Email Address").fill(account.email)

    await page

      .getByLabel("Password", { exact: false })

      .first()

      .fill(account.password)

    const [loginResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().endsWith("/api/auth/login"),
      ),

      page.getByRole("button", { name: "Log In", exact: true }).click(),
    ])

    expect(loginResponse.status(), `Login HTTP status for ${role}`).toBe(200)

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "Sign out", exact: true }).click()

    await expect(page).toHaveURL(/\/login$/)
  }
})

test("catalog and service forms remain usable on narrow screens", async ({
  page,

  account,
}) => {
  await provisionAndSignIn(account, page, "peso_staff")

  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto("/training")

  await page

    .getByRole("button", { name: "Add training program", exact: true })

    .click()

  await noOverflow(page)

  await axe(page)

  await page.getByRole("button", { name: "Cancel", exact: true }).click()

  await page.goto("/jobs")

  await page.getByRole("button", { name: "Add vacancy", exact: true }).click()

  await noOverflow(page)

  await axe(page)

  await page.screenshot({
    path: "artifacts/facilitation/vacancy-form-mobile.png",

    fullPage: true,
  })
})
