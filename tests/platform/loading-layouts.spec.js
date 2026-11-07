import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

const folder = "artifacts/loading-layouts"

const user = (role) => ({
  id: 900001,

  name: "Loading Review",

  first_name: "Loading",

  last_name: "Review",

  email: "loading.review@example.test",

  role,

  dashboard_tour_completed_at: "2026-11-06T00:00:00Z",
})

const summary = {
  referrals: 1,

  enrollments: 1,

  placements: 0,

  services: 0,

  saved: [],
}

const events = {
  data: [1, 2, 3].map((id) => ({
    id,

    title: "Loading layout review event",

    type: "Job fair",

    status: "published",

    location: "PESO office",

    starts_at: "2026-12-01T08:00:00Z",

    is_sample: true,
  })),

  last_page: 1,

  current_page: 1,

  total: 3,
}

test.beforeEach(async ({ page }) => {
  await fs.mkdir(folder, { recursive: true })

  await page.emulateMedia({ reducedMotion: "reduce" })
})

test("sign-in shows the PESO loader until authentication, then the dashboard uses only skeletons", async ({
  page,
}) => {
  let finishLogin

  let releaseData = false

  const pending = []

  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  )

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname

    if (path === "/api/auth/user")
      return route.fulfill({
        status: 401,

        json: { message: "Unauthenticated." },
      })

    if (path === "/api/auth/login") {
      await new Promise((resolve) => {
        finishLogin = resolve
      })

      return route.fulfill({
        json: {
          user: user("admin"),

          onboarding: { completed: true, current_step: 5 },
        },
      })
    }

    if (!releaseData) await new Promise((resolve) => pending.push(resolve))

    return route

      .fulfill({
        status: 503,

        json: { message: "Temporary loading review failure." },
      })

      .catch(() => {})
  })

  await page.goto("/login")

  await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

  await page.getByLabel("Email Address").fill("signin.review@example.test")

  await page

    .locator('input[autocomplete="current-password"]')

    .fill("Not-A-Real-Password-123!")

  await page.getByRole("button", { name: "Log In", exact: true }).click()

  await expect(
    page.getByRole("status", { name: "PESO Signing in…" }),
  ).toBeVisible()

  await page.screenshot({ path: `${folder}/sign-in-logo.png` })

  await expect.poll(() => typeof finishLogin).toBe("function")

  finishLogin()

  await expect(page).toHaveURL(/\/dashboard$/)

  await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

  await expect(page.locator('[data-skeleton-layout="overview"]')).toBeVisible()

  releaseData = true

  pending.forEach((resolve) => resolve())

  await expect(page.locator('[data-skeleton="screen"]')).toHaveCount(0)

  await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)
})

test("home, login and registration use the PESO logo and never generic card skeletons", async ({
  page,
}) => {
  await page.route("**/api/auth/user", (route) =>
    route.fulfill({ status: 401, json: { message: "Unauthenticated." } }),
  )

  for (const [path, name] of [
    ["/login", "login"],

    ["/register", "register"],

    ["/", "home"],
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" })

    await expect(
      page.locator('[data-logo-loading="true"]').first(),
    ).toBeVisible()

    expect(await page.locator('[data-skeleton="screen"]').count()).toBe(0)

    await page.screenshot({ path: `${folder}/${name}-logo.png` })

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

    expect(await page.locator('[data-skeleton="screen"]').count()).toBe(0)
  }
})

test("every workspace resource uses its own layout through a slow request and error recovery", async ({
  page,
}) => {
  let role = "admin"

  let pending = []

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname

    if (path === "/api/auth/user")
      return route.fulfill({
        json: {
          user: user(role),

          onboarding: { completed: true, current_step: 5 },
        },
      })

    await new Promise((resolve) => pending.push(resolve))

    await route

      .fulfill({
        status: 503,

        json: { message: "Temporary loading review failure." },
      })

      .catch(() => {})
  })

  await page.addInitScript(() => {
    window.__workspaceLogoSeen = false

    new MutationObserver(() => {
      if (document.querySelector('[data-logo-loading="true"]'))
        window.__workspaceLogoSeen = true
    }).observe(document, { childList: true, subtree: true })
  })

  const failures = []

  page.on("pageerror", (error) => failures.push(error.message))

  const cases = [
    ["/jobs", "vacancy-catalog"],

    ["/jobs/987654", "vacancy-detail"],

    ["/training", "training-catalog"],

    ["/training/987654", "training-detail"],

    ["/referrals", "referrals"],

    ["/enrollments", "enrollments"],

    ["/placements", "placements"],

    ["/outcomes", "outcomes"],

    ["/services", "services"],

    ["/events", "events"],

    ["/labor-market", "labor-market"],

    ["/jobseekers", "registry"],

    ["/users", "access"],

    ["/audit", "audit"],

    ["/matches", "vacancy-matches", "jobseeker"],

    ["/profile", "profile", "jobseeker"],

    ["/settings", "settings", "jobseeker"],

    ...[1, 2, 3, 4, 5].map((step) => [
      `/jobseeker/onboarding/${step}`,

      `onboarding-step-${step}`,

      "jobseeker",
    ]),
  ]

  for (const [path, layout, nextRole = "admin"] of cases) {
    role = nextRole

    pending = []

    await page.setViewportSize({ width: 1440, height: 1000 })

    await page.goto(path, { waitUntil: "domcontentloaded" })

    await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

    if (path.startsWith("/jobseeker/onboarding"))
      await expect(
        page.locator('[aria-label="Profile setup steps"]'),
      ).toBeVisible()
    else await expect(page.locator("#service-drawer")).toBeAttached()

    const skeleton = page.locator(`[data-skeleton-layout="${layout}"]`)

    await expect(skeleton).toBeVisible()

    await expect(skeleton).toHaveAttribute("aria-busy", "true")

    await page.screenshot({
      path: `${folder}/${layout}-desktop.png`,

      fullPage: true,
    })

    await page.setViewportSize({ width: 390, height: 844 })

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),

      layout,
    ).toBe(true)

    await page.screenshot({
      path: `${folder}/${layout}-mobile.png`,

      fullPage: true,
    })

    pending.forEach((resolve) => resolve())

    await expect(page.locator('[data-skeleton="screen"]')).toHaveCount(0)

    expect(await page.evaluate(() => window.__workspaceLogoSeen), path).toBe(
      false,
    )
  }

  expect(failures).toEqual([])
})

test("Overview mirrors its banner, pathway, four counters and two content columns in both themes", async ({
  page,
}) => {
  let pending = []

  let hold = true

  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname

    if (path === "/api/auth/user")
      return route.fulfill({
        json: {
          user: user("admin"),

          onboarding: { completed: true, current_step: 5 },
        },
      })

    if (hold) await new Promise((resolve) => pending.push(resolve))

    await route

      .fulfill({
        json: path.endsWith("/summary")
          ? summary
          : path.endsWith("/events")
            ? events
            : { data: [], last_page: 1, current_page: 1, total: 0 },
      })

      .catch(() => {})
  })

  for (const theme of ["hc1", "hc2"]) {
    await page.addInitScript(
      (theme) =>
        localStorage.setItem(
          "peso-appearance",

          JSON.stringify({ theme, reduceMotion: true }),
        ),

      theme,
    )

    await page.setViewportSize({ width: 1920, height: 1080 })

    pending = []

    hold = true

    await page.goto("/jobs", { waitUntil: "domcontentloaded" })

    // The menu itself is a skeleton until the current page settles. Release

    // that page before using its real navigation, then hold the destination.

    await expect(
      page.locator('#service-drawer [data-skeleton="sidebar"]'),
    ).toBeVisible()

    hold = false

    pending.splice(0).forEach((resolve) => resolve())

    await expect(page.locator('[data-skeleton="sidebar"]')).toHaveCount(0)

    hold = true

    await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

    await page

      .getByRole("navigation", { name: "Employment services", exact: true })

      .getByRole("link", { name: "Overview", exact: true })

      .click()

    await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

    expect(
      await page

        .locator("#service-drawer")

        .evaluate((node) => Boolean(node.closest("[inert]"))),
    ).toBe(false)

    await page.screenshot({
      path: `${folder}/workspace-navigation-skeleton-${theme}.png`,
    })

    await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

    const skeleton = page.locator('[data-skeleton-layout="overview"]')

    await expect(skeleton).toBeVisible()

    await expect(skeleton.locator(".overview-stats > div")).toHaveCount(4)

    const before = await skeleton.locator(".overview-banner").boundingBox()

    await page.screenshot({
      path: `${folder}/overview-skeleton-${theme}.png`,

      fullPage: true,
    })

    const accessibility = await new AxeBuilder({ page })

      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

      .analyze()

    expect(
      accessibility.violations.map((v) => ({
        id: v.id,

        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([])

    await page.setViewportSize({ width: 390, height: 844 })

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)

    await page.screenshot({
      path: `${folder}/overview-skeleton-mobile-${theme}.png`,

      fullPage: true,
    })

    await page.setViewportSize({ width: 1920, height: 1080 })

    hold = false

    pending.forEach((resolve) => resolve())

    await expect(skeleton).toHaveCount(0)

    await expect(
      page.getByRole("heading", { name: "Employment services, connected." }),
    ).toBeVisible()

    const after = await page.locator(".overview-banner").boundingBox()

    expect(Math.abs(before.x - after.x)).toBeLessThan(2)

    expect(Math.abs(before.width - after.width)).toBeLessThan(2)

    expect(Math.abs(before.y - after.y)).toBeLessThan(24)

    expect(Math.abs(before.height - after.height)).toBeLessThan(24)

    await page.screenshot({
      path: `${folder}/overview-loaded-${theme}.png`,

      fullPage: true,
    })

    if (theme === "hc1") {
      hold = true

      pending = []

      await page.setViewportSize({ width: 390, height: 844 })

      await page

        .getByRole("button", { name: "Toggle service navigation" })

        .click()

      await page

        .getByRole("navigation", { name: "Employment services", exact: true })

        .getByRole("link", {
          name: "Training & Skills Development",

          exact: true,
        })

        .click()

      await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

      await expect(
        page.locator('[data-skeleton-layout="training-catalog"]'),
      ).toBeVisible()

      hold = false

      pending.forEach((resolve) => resolve())

      await expect(page.locator('[data-skeleton="screen"]')).toHaveCount(0)

      expect(
        await page.evaluate(() => document.documentElement.style.overflow),
      ).toBe("")

      expect(await page.evaluate(() => document.body.style.overflow)).toBe("")
    }
  }
})
