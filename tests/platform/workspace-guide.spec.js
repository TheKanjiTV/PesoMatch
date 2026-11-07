import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

async function workspace(
  context,

  { role = "jobseeker", newUser = false, hold = false } = {},
) {
  const state = {
    role,

    complete: !newUser,

    hold,

    holdPaths: ["/api/platform/vacancies"],

    pending: [],

    writes: [],

    failed: false,

    enrollmentStatus: "requested",
  }

  const list = (data) => ({
    data,

    total: data.length,

    current_page: 1,

    last_page: 1,
  })

  const user = () => ({
    id: 960001,

    first_name: "Guide",

    name: "Isolated Guide User",

    email: "guide@browser.example.test",

    role: state.role,

    dashboard_tour_completed_at: state.complete ? "2026-11-07T00:00:00Z" : null,
  })

  await context.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  )

  await context.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname

    if (req.method() !== "GET") {
      state.writes.push({
        path,

        method: req.method(),

        body: req.postDataJSON(),
      })

      if (path === "/api/auth/preferences") state.complete = true

      if (path === "/api/platform/enrollments/960002")
        state.enrollmentStatus = req.postDataJSON().status

      return route.fulfill({
        json: { user: user(), data: { status: state.enrollmentStatus } },
      })
    }

    if (path === "/api/auth/user")
      return route.fulfill({
        json: {
          user: user(),

          onboarding: { completed: true, current_step: 5 },
        },
      })

    if (state.holdPaths.includes(path) && state.hold)
      await new Promise((resolve) => state.pending.push(resolve))

    if (path === "/api/platform/vacancies" && state.failed)
      return route.fulfill({
        status: 503,

        json: { message: "Isolated source failure" },
      })

    if (path === "/api/platform/summary")
      return route.fulfill({
        json: {
          saved: [],

          referrals: 0,

          enrollments: 1,

          placements: 0,

          services: 0,
        },
      })

    if (path === "/api/public/source-coverage")
      return route.fulfill({ json: { review_date: "2026-11-07", sources: [] } })

    if (path === "/api/jobseeker/profile")
      return route.fulfill({
        json: {
          data: {
            personal: {},

            education: {},

            skills: { skills: [], certifications: [], languages: [] },

            work_experience: { experiences: [] },

            preferences: {
              occupations: [],

              employment_types: [],

              work_arrangements: [],
            },
          },
        },
      })

    if (path === "/api/jobseeker/resume")
      return route.fulfill({ json: { data: null } })

    if (path === "/api/platform/matches")
      return route.fulfill({
        json: {
          matches: [],

          training: [],

          training_total: 0,

          total: 0,

          current_page: 1,

          last_page: 1,
        },
      })

    if (path === "/api/platform/labor-market")
      return route.fulfill({
        json: {
          industries: [],

          skills: {},

          outcomes: [],

          follow_ups: [],

          official_reports: [],

          as_of: "2026-11-07",

          active_vacancies: 0,

          open_positions: 0,

          source_listed_vacancies: 0,

          sample_vacancies: 0,

          training_completions: 0,
        },
      })

    if (path === "/api/platform/enrollments")
      return route.fulfill({
        json: list([
          {
            id: 960002,

            status: state.enrollmentStatus,

            created_at: "2026-11-07",

            user: user(),

            program: {
              id: 960003,

              title: "Isolated training request",

              provider: "Browser fixture provider",

              skills: [],

              external_enrollment: true,

              is_sample: true,
            },
          },
        ]),
      })

    return route.fulfill({ json: list([]) })
  })

  return state
}

test("initial shell includes identity and actions, then navigation stays usable during retry", async ({
  context,

  page,
}) => {
  const state = await workspace(context, { hold: true })

  await page.emulateMedia({ reducedMotion: "reduce" })

  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto("/jobs")

  const skeleton = page.locator('#service-drawer [data-skeleton="sidebar"]')

  await expect(skeleton).toBeVisible()

  await expect(
    page.getByRole("status", { name: "Loading workspace header" }),
  ).toBeVisible()
  await expect(
    page.getByText("Isolated Guide User", { exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Install", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Public home", exact: true }),
  ).toHaveCount(0)

  await expect(page.locator("#service-drawer .sidebar-link")).toHaveCount(0)

  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toBeVisible()

  await fs.mkdir("artifacts/workspace-guide", { recursive: true })

  await page.screenshot({
    path: "artifacts/workspace-guide/sidebar-loading.png",

    fullPage: false,
  })

  await page.setViewportSize({ width: 390, height: 844 })

  await expect(
    page.locator('[data-skeleton="mobile-navigation"]'),
  ).toBeVisible()

  await page.screenshot({
    path: "artifacts/workspace-guide/initial-shell-mobile.png",
  })
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(accessibility.violations).toEqual([])

  await page

    .getByRole("button", { name: "Toggle service navigation", exact: true })

    .click()

  await expect(skeleton).toBeVisible()

  await page

    .getByRole("button", { name: "Close service navigation", exact: true })

    .click()

  state.failed = true

  state.hold = false

  state.pending.splice(0).forEach((resolve) => resolve())

  await expect(page.locator('[data-skeleton="sidebar"]')).toHaveCount(0)

  await expect(
    page.getByRole("button", { name: "Retry loading", exact: true }),
  ).toBeVisible()

  state.failed = false
  state.hold = true

  await page.getByRole("button", { name: "Retry loading", exact: true }).click()

  await expect.poll(() => state.pending.length).toBeGreaterThan(0)
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toBeVisible()
  await expect(page.locator('[data-skeleton="workspace-header"]')).toHaveCount(
    0,
  )
  await expect(page.locator(".workspace-identity")).toContainText(
    "Isolated Guide User",
  )
  await expect(
    page.locator(".workspace-topbar").getByText("Install", { exact: true }),
  ).toBeAttached()
  await expect(
    page.getByRole("link", { name: "Public home", exact: true }),
  ).toBeHidden()
  await expect(
    page.getByRole("button", { name: "Open all services" }),
  ).toBeEnabled()
  await expect(page.locator('[data-skeleton="sidebar"]')).toHaveCount(0)
  await expect(page.locator('[data-skeleton="mobile-navigation"]')).toHaveCount(
    0,
  )
  await page.screenshot({
    path: "artifacts/workspace-guide/content-only-mobile.png",
  })
  state.hold = false
  state.pending.splice(0).forEach((resolve) => resolve())

  await expect(
    page.getByRole("button", { name: "Retry loading", exact: true }),
  ).toHaveCount(0)

  await expect(page.locator('[data-skeleton="mobile-navigation"]')).toHaveCount(
    0,
  )

  await page.setViewportSize({ width: 1440, height: 1000 })

  await expect(
    page

      .getByRole("navigation", { name: "Employment services", exact: true })

      .getByRole("link"),
  ).toHaveCount(11)

  await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)
})

test("loaded shell stays stable across module navigation, searches and cancelled requests", async ({
  context,
  page,
}) => {
  const state = await workspace(context)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/jobs")
  await expect(page.locator("#service-drawer .sidebar-link")).toHaveCount(11)
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toHaveCount(0)

  // Record transient regressions too, even if they disappear before assertions.
  await page.evaluate(() => {
    window.shellRegressions = []
    const selector =
      '[data-skeleton="sidebar"], [data-skeleton="workspace-header"], [data-skeleton="mobile-navigation"]'
    new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (
            node.nodeType === 1 &&
            (node.matches(selector) || node.querySelector(selector))
          )
            window.shellRegressions.push(node.outerHTML.slice(0, 150))
        }
    }).observe(document.querySelector(".platform-shell"), {
      childList: true,
      subtree: true,
    })
  })

  state.holdPaths = ["/api/platform/training", "/api/platform/vacancies"]
  state.hold = true
  await page
    .getByRole("navigation", { name: "Employment services", exact: true })
    .getByRole("link", { name: "Training & Skills Development", exact: true })
    .click()
  await expect(page).toHaveURL(/\/training$/)
  await expect.poll(() => state.pending.length).toBeGreaterThan(0)
  await expect(
    page.locator('[data-skeleton-layout="training-catalog"]'),
  ).toBeVisible()
  await expect(page.locator(".workspace-identity")).toContainText(
    "Isolated Guide User",
  )
  await expect(
    page.getByRole("link", { name: "Public home", exact: true }),
  ).toBeVisible()
  await expect(page.locator("#service-drawer .sidebar-link")).toHaveCount(11)
  await page.screenshot({
    path: "artifacts/workspace-guide/content-only-desktop.png",
  })

  // A pending destination must not trap the user in that module.
  await page
    .getByRole("navigation", { name: "Employment services", exact: true })
    .getByRole("link", { name: "Vacancy Management", exact: true })
    .click()
  await expect(page).toHaveURL(/\/jobs$/)
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toBeVisible()
  state.hold = false
  state.pending.splice(0).forEach((resolve) => resolve())
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toHaveCount(0)

  state.hold = true
  const search = page.getByRole("combobox", {
    name: "Search vacancies",
    exact: true,
  })
  await search.fill("office")
  await expect.poll(() => state.pending.length).toBeGreaterThan(0)
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toBeVisible()
  await expect(search).toBeFocused()
  await expect(search).toHaveValue("office")
  await expect(
    page.locator(".workspace-topbar").getByText("Install", { exact: true }),
  ).toBeVisible()
  state.hold = false
  state.pending.splice(0).forEach((resolve) => resolve())
  await expect(
    page.locator('[data-skeleton-layout="vacancy-catalog"]'),
  ).toHaveCount(0)
  expect(await page.evaluate(() => window.shellRegressions)).toEqual([])
  expect(state.writes).toEqual([])
})

test("guide counter follows Back and Previous while a destination request is still pending", async ({
  context,
  page,
}) => {
  const state = await workspace(context, {
    role: "admin",
    newUser: true,
    hold: true,
  })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/dashboard")
  const dialog = page.getByRole("dialog")
  const next = dialog.getByRole("button", { name: "Next", exact: true })
  const previous = dialog.getByRole("button", {
    name: "Previous tutorial step",
    exact: true,
  })
  await expect(next).toBeEnabled()
  await next.click()
  await expect(page).toHaveURL(/\/jobseekers$/)
  await expect(next).toBeEnabled()

  for (const back of ["previous", "browser", "previous"]) {
    await next.click()
    await expect(page).toHaveURL(/\/jobs$/)
    await expect(
      dialog.getByText("Workspace guide · 3 of 14", { exact: true }),
    ).toBeVisible()
    await expect.poll(() => state.pending.length).toBeGreaterThan(0)
    await expect(next).toBeDisabled()
    if (back === "browser") await page.goBack()
    else await previous.click()
    await expect(page).toHaveURL(/\/jobseekers$/)
    await expect(
      dialog.getByText("Workspace guide · 2 of 14", { exact: true }),
    ).toBeVisible()
    state.pending.splice(0).forEach((resolve) => resolve())
    await expect(next).toBeEnabled()
    await expect(
      dialog.getByText("Workspace guide · 2 of 14", { exact: true }),
    ).toBeVisible()
  }
  expect(state.writes).toEqual([])
  await dialog
    .getByRole("button", { name: "Close tutorial", exact: true })
    .click()
})

const seekerPaths = [
  "/dashboard",

  "/profile",

  "/jobs",

  "/matches",

  "/referrals",

  "/training",

  "/enrollments",

  "/placements",

  "/outcomes",

  "/services",

  "/events",

  "/labor-market",

  "/settings",
]

const adminPaths = [
  "/dashboard",

  "/jobseekers",

  "/jobs",

  "/referrals",

  "/training",

  "/enrollments",

  "/placements",

  "/outcomes",

  "/services",

  "/events",

  "/labor-market",

  "/users",

  "/audit",

  "/settings",
]

for (const [role, paths] of [
  ["jobseeker", seekerPaths],

  ["admin", adminPaths],

  [
    "peso_staff",

    adminPaths.filter((path) => !["/users", "/audit"].includes(path)),
  ],

  [
    "employer",

    [
      "/dashboard",

      "/jobs",

      "/referrals",

      "/training",

      "/placements",

      "/events",

      "/labor-market",

      "/settings",
    ],
  ],

  [
    "training_provider",

    [
      "/dashboard",

      "/jobs",

      "/training",

      "/enrollments",

      "/events",

      "/labor-market",

      "/settings",
    ],
  ],
]) {
  test(`${role} guide visits its real modules, waits for pages and preserves records`, async ({
    context,

    page,
  }) => {
    const state = await workspace(context, { role, newUser: true })

    const errors = []

    page.on("pageerror", (error) => errors.push(error.message))

    await page.emulateMedia({ reducedMotion: "reduce" })

    if (role === "jobseeker")
      await page.setViewportSize({ width: 390, height: 844 })

    await page.goto("/dashboard")

    const dialog = page.getByRole("dialog")

    await expect(dialog).toBeVisible()

    for (let index = 0; index < paths.length; index++) {
      await expect(page).toHaveURL(new RegExp(`${paths[index]}$`))

      await expect(
        dialog.getByText(`Workspace guide · ${index + 1} of ${paths.length}`, {
          exact: true,
        }),
      ).toBeVisible()

      const next = dialog.getByRole("button", {
        name: index === paths.length - 1 ? "Finish" : "Next",

        exact: true,
      })

      await expect(next).toBeEnabled()

      await expect(page.locator("#workspace-main h1")).toBeVisible()

      await expect(
        page.getByText("Your account does not have access to this service.", {
          exact: true,
        }),
      ).toHaveCount(0)

      if (index === 2) {
        await dialog

          .getByRole("button", { name: "Previous tutorial step", exact: true })

          .click()

        await expect(page).toHaveURL(new RegExp(`${paths[index - 1]}$`))

        await expect(
          dialog.getByRole("button", { name: "Next", exact: true }),
        ).toBeEnabled()

        await dialog.getByRole("button", { name: "Next", exact: true }).click()

        await expect(page).toHaveURL(new RegExp(`${paths[index]}$`))

        await expect(next).toBeEnabled()

        await page.goBack()

        await expect(page).toHaveURL(new RegExp(`${paths[index - 1]}$`))

        await expect(
          dialog.getByText(`Workspace guide · ${index} of ${paths.length}`, {
            exact: true,
          }),
        ).toBeVisible()

        await expect(
          dialog.getByRole("button", { name: "Next", exact: true }),
        ).toBeEnabled()

        await dialog.getByRole("button", { name: "Next", exact: true }).click()

        await expect(page).toHaveURL(new RegExp(`${paths[index]}$`))

        await expect(next).toBeEnabled()
      }

      if (role === "jobseeker" && paths[index] === "/training") {
        expect(
          (
            await new AxeBuilder({ page })

              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

              .analyze()
          ).violations,
        ).toEqual([])

        await fs.mkdir("artifacts/workspace-guide", { recursive: true })

        await page.screenshot({
          path: "artifacts/workspace-guide/training-tour-mobile.png",

          fullPage: true,
        })
      }

      await next.click()
    }

    await expect(dialog).toHaveCount(0)

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect.poll(() => state.writes.length).toBe(1)

    expect(state.writes[0]).toMatchObject({
      path: "/api/auth/preferences",

      method: "PATCH",

      body: { dashboard_tour_completed: true },
    })

    expect(errors).toEqual([])

    await page.reload()

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(page.getByRole("dialog")).toHaveCount(0)

    await page.goto("/settings")

    await page

      .getByRole("button", { name: "Replay workspace tutorial", exact: true })

      .click()

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect(page.getByRole("dialog")).toBeVisible()

    await page

      .getByRole("button", { name: "Close tutorial", exact: true })

      .click()

    await expect(page.getByRole("dialog")).toHaveCount(0)
  })
}

test("training enrollment offers withdrawal without a duplicate delete action", async ({
  context,

  page,
}) => {
  const state = await workspace(context)

  await page.goto("/enrollments")

  await expect(
    page.getByRole("button", {
      name: "Delete enrollment request",

      exact: true,
    }),
  ).toHaveCount(0)

  await page

    .getByRole("button", { name: "Withdraw request", exact: true })

    .click()

  await expect(
    page.getByRole("combobox", { name: "Enrollment status", exact: true }),
  ).toHaveValue("withdrawn")

  await page

    .getByRole("textbox", { name: "Notes / reason", exact: true })

    .fill("I no longer wish to join this intake.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(page.getByText("Withdrawn", { exact: true })).toBeVisible()

  await expect(
    page.getByRole("button", { name: "Withdraw request", exact: true }),
  ).toHaveCount(0)

  expect(state.writes).toEqual([
    {
      path: "/api/platform/enrollments/960002",

      method: "PATCH",

      body: {
        status: "withdrawn",

        notes: "I no longer wish to join this intake.",
      },
    },
  ])
})
