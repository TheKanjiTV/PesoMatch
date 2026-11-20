import { test as publicTest, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { test, apiCall, provisionAndSignIn } from "./helpers.js"
import { mkdir, writeFile } from "node:fs/promises"

const widths = [320, 375, 390, 768, 1024, 1440]
async function matrix(page, route, results) {
  await page.goto(route)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(
    page.getByRole("status").filter({ hasText: /Loading/ }),
  ).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    // Let existing route, drawer and phone transforms settle before measuring.
    await page.waitForTimeout(350)
    const measurement = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll("main *")]
        .filter((element) => {
          const r = element.getBoundingClientRect()
          return (
            r.width &&
            r.right > innerWidth + 1 &&
            getComputedStyle(element).position !== "fixed" &&
            !element.closest('[class*="overflow-x-auto"]')
          )
        })
        .slice(0, 5)
        .map((element) => ({
          tag: element.tagName,
          text: element.textContent.slice(0, 65),
        })),
    }))
    results.push({ route, width, ...measurement })
    expect
      .soft(
        measurement.content,
        `${route} at ${width}: ${JSON.stringify(measurement.overflowing)}`,
      )
      .toBeLessThanOrEqual(width + 1)
    if (
      [320, 1440].includes(width) &&
      [
        "/",
        "/app",
        "/register",
        "/dashboard",
        "/profile",
        "/jobseeker/onboarding/1?review=1",
      ].includes(route)
    ) {
      await mkdir("artifacts/ui-mobile", { recursive: true })
      await page.screenshot({
        path: `artifacts/ui-mobile/${
          route === "/"
            ? "landing"
            : route.split("?")[0].replaceAll("/", "-").slice(1)
        }-${width}.png`,
        fullPage: true,
      })
    }
  }
  expect(
    await page.locator('meta[name="robots"]').getAttribute("content"),
  ).toContain("noindex")
}
async function save(name, results) {
  await mkdir("artifacts/ui-mobile", { recursive: true })
  await writeFile(
    `artifacts/ui-mobile/${name}.json`,
    JSON.stringify(results, null, 2),
  )
}

publicTest(
  "public route titles, metadata, links and six responsive widths",
  async ({ page, request }) => {
    publicTest.setTimeout(180000)
    const results = [],
      titles = new Set(),
      descriptions = new Set(),
      errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const route of [
      "/",
      "/app",
      "/login",
      "/staff/login",
      "/register",
      "/help",
      "/privacy",
      "/terms",
      "/cookies",
      "/home",
      "/forgot-password",
      "/reset-password",
      "/password-updated",
      "/verify-email",
      "/missing-audit-page",
    ]) {
      await matrix(page, route, results)
      titles.add(await page.title())
      descriptions.add(
        await page.locator('meta[name="description"]').getAttribute("content"),
      )
      const links = await page
        .locator("a[href]")
        .evaluateAll((elements) => elements.map((a) => a.getAttribute("href")))
      for (const href of links) {
        expect(href).not.toBe("")
        expect(href).not.toMatch(/^javascript:/i)
        if (href.startsWith("#"))
          expect(
            await page.locator(`[id="${href.slice(1)}"]`).count(),
            `${route}: ${href}`,
          ).toBeGreaterThan(0)
      }
    }
    expect(titles.size).toBe(12)
    expect(descriptions.size).toBeGreaterThanOrEqual(12)
    await page.goto("/login")
    await expect(
      page.getByText(`© ${new Date().getFullYear()} PesoMatch`, {
        exact: true,
      }),
    ).toBeVisible()
    for (const path of [
      "/favicon.svg",
      "/manifest.webmanifest",
      "/icons/peso-192.png",
      "/icons/peso-512.png",
      "/images/career-portrait.webp",
    ]) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      expect(response.headers()["content-type"], path).not.toContain(
        "text/html",
      )
    }
    await page.goto("/")
    await page.setViewportSize({ width: 320, height: 900 })
    const menu = page.getByRole("button", { name: "Toggle navigation" })
    await menu.click()
    await expect(menu).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("Escape")
    await expect(menu).toBeFocused()
    await expect(menu).toHaveAttribute("aria-expanded", "false")
    expect(errors).toEqual([])
    await save("public", results)
  },
)

test("jobseeker screens, details and onboarding fit all required widths", async ({
  page,
  account,
}) => {
  test.setTimeout(240000)
  const results = [],
    errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  const jobs = (
    await (await apiCall(account.request, "/api/platform/vacancies")).json()
  ).data
  const training = (
    await (await apiCall(account.request, "/api/platform/training")).json()
  ).data
  for (const route of [
    "/dashboard",
    "/jobs",
    `/jobs/${jobs[0].id}`,
    "/training",
    `/training/${training[0].id}`,
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
    ...[1, 2, 3, 4, 5].map((step) => `/jobseeker/onboarding/${step}?review=1`),
    "/jobseeker/onboarding/complete",
  ]) {
    await matrix(page, route, results)
    if (route === "/profile") {
      await expect(
        page.locator(`a[href="mailto:${account.email}"]`),
      ).toBeVisible()
      await expect(page.locator('a[href^="tel:"]')).toBeVisible()
    }
    if (route === `/jobs/${jobs[0].id}`)
      await expect(page).toHaveTitle(
        `${jobs[0].title} | PESO Employment Services`,
      )
    if (route === `/training/${training[0].id}`)
      await expect(page).toHaveTitle(
        `${training[0].title} | PESO Employment Services`,
      )
  }
  await page.goto("/jobs/999999999")
  await expect(
    page.getByRole("heading", { name: "Record unavailable" }),
  ).toBeVisible()
  await expect(page).toHaveTitle(/Record unavailable/)
  await page.getByRole("link", { name: "Return to the catalog." }).click()
  await expect(page).toHaveURL(/\/jobs$/)
  await page.goto("/missing-audit-page")
  await page.getByRole("button", { name: "Return to your services" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page
    .getByRole("link", {
      name: "PESO employment services overview",
      exact: true,
    })
    .first()
    .click()
  await expect(page).toHaveURL(/\/dashboard$/)
  expect(errors).toEqual([])
  for (const [from, to] of [
    ["/assistance", "/services"],
    ["/peso-assistance", "/services"],
    ["/skill-analysis", "/matches"],
    ["/settings/appearance", "/settings"],
    ["/messages", "/services"],
    ["/notifications", "/dashboard"],
    ["/search", "/jobs"],
    ["/jobseeker/profile", "/profile"],
  ]) {
    await page.goto(from)
    await expect(page).toHaveURL(new RegExp(`${to}$`))
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  }
  await save("jobseeker", results)
})

test("service drawer traps focus, closes safely and retains navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/dashboard")
  const opener = page.getByRole("button", { name: "Open all services" })
  await opener.click()
  const drawer = page.getByRole("dialog", { name: "All employment services" })
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)")
  await mkdir("artifacts/ui-mobile", { recursive: true })
  await page.screenshot({ path: "artifacts/ui-mobile/services-drawer-320.png" })
  await expect(
    page.getByRole("button", { name: "Close service navigation" }),
  ).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(
    drawer.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(
    drawer.getByRole("button", { name: "Close service navigation" }),
  ).toBeFocused()
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze()
  expect(
    result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  await page.keyboard.press("Escape")
  await expect(opener).toBeFocused()
  await expect(drawer).toHaveCount(0)
  await opener.click()
  await page.locator('button[aria-label="Toggle service navigation"]').click()
  await expect(opener).toBeFocused()
  await expect(drawer).toHaveCount(0)
  await opener.click()
  await drawer
    .getByRole("link", { name: "Training Enrollment", exact: true })
    .click()
  await expect(page).toHaveURL(/\/enrollments$/)
  await expect(drawer).toHaveCount(0)
  await expect(page.locator("#workspace-main")).toBeFocused()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(
    page.getByRole("navigation", { name: "Employment services" }),
  ).toBeVisible()
})

test("partner and staff screens retain six-width layouts", async ({
  page,
  account,
}) => {
  test.setTimeout(240000)
  const results = []
  for (const [role, routes] of [
    [
      "peso_staff",
      [
        "/dashboard",
        "/jobseekers",
        "/jobs",
        "/training",
        "/services",
        "/events",
        "/labor-market",
      ],
    ],
    ["employer", ["/dashboard", "/jobs", "/referrals", "/placements"]],
    ["training_provider", ["/dashboard", "/training", "/enrollments"]],
    ["admin", ["/users", "/audit"]],
  ]) {
    await provisionAndSignIn(account, page, role)
    for (const route of routes) await matrix(page, route, results)
  }
  await save("roles", results)
})

test.describe("Controlled network failures", () => {
  test.use({ serviceWorkers: "block" })
  test("failed reads can retry and form validation is associated with the field", async ({
    page,
    account,
  }) => {
    await page.route("**/api/platform/summary*", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "SQLSTATE secret connection stack trace",
          errors: { private: ["hidden"] },
        }),
      }),
    )
    await page.goto("/dashboard")
    await expect(page.getByRole("alert")).toContainText(
      "temporarily unavailable",
    )
    await expect(page.getByText(/SQLSTATE/)).toHaveCount(0)
    await page.unroute("**/api/platform/summary*")
    await page.getByRole("button", { name: "Retry loading" }).click()
    await expect(page.getByRole("alert")).toHaveCount(0)
    await provisionAndSignIn(account, page, "peso_staff")
    await page.goto("/events")
    await page
      .getByRole("button", { name: "Add event / program", exact: true })
      .click()
    const form = page.locator("#record-editor form")
    // Exercise the server-validation rendering without submitting an incomplete record.
    await page.route("**/api/platform/events", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 422,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Check the highlighted fields.",
              errors: { title: ["Use a descriptive event title."] },
            }),
          })
        : route.continue(),
    )
    // Reach server validation with a valid client-side payload; disabling
    // native validation does not bypass the editor's own required-field guard.
    const dialog = page.getByRole("dialog")
    await dialog
      .getByLabel("Event / program title")
      .fill("Synthetic validation event")
    await dialog.getByLabel("Service type").selectOption("Job fair")
    await dialog.getByLabel("Venue / location").fill("Local browser test venue")
    await dialog
      .getByLabel("Start time (Philippine time)")
      .fill("2027-01-01T09:00")
    await dialog.getByLabel("Publication status").selectOption("draft")
    await dialog
      .getByLabel("Program details & coordination instructions")
      .fill("Synthetic client/server validation test only.")
    await form.getByRole("button", { name: "Save record", exact: true }).click()
    const title = page.getByLabel("Event / program title")
    await expect(title).toHaveAttribute("aria-invalid", "true")
    await expect(title).toBeFocused()
    const descriptionId = await title.getAttribute("aria-describedby")
    await expect(page.locator(`[id="${descriptionId}"]`)).toHaveText(
      "Use a descriptive event title.",
    )
    let failedChunks = 0
    await page.route(
      /\/assets\/Catalog-[^/]+\.js$|\/src\/platform\/Catalog\.jsx$/,
      (route) => {
        failedChunks++
        return route.abort("failed")
      },
    )
    await page.goto("/jobs")
    await expect(
      page.getByRole("heading", { name: "This page couldn't load" }),
    ).toBeVisible()
    expect(failedChunks).toBeGreaterThan(0)
    await expect(page.getByRole("button", { name: "Retry page" })).toBeVisible()
    await page.unroute(
      /\/assets\/Catalog-[^/]+\.js$|\/src\/platform\/Catalog\.jsx$/,
    )
    await page.getByRole("button", { name: "Retry page" }).click()
    await expect(
      page.getByRole("heading", { name: "Vacancy Management", exact: true }),
    ).toBeVisible()
    const reservedEmail = "platform.audit?body=example@example.test"
    await page.route("**/api/auth/user", async (route) => {
      const response = await route.fetch()
      const json = await response.json()
      json.user.email = reservedEmail
      await route.fulfill({ response, json })
    })
    await page.goto("/settings")
    await expect(
      page.getByRole("link", { name: reservedEmail, exact: true }),
    ).toHaveAttribute(
      "href",
      "mailto:platform.audit%3Fbody%3Dexample@example.test",
    )
  })
})
