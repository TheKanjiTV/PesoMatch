import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import fs from "node:fs/promises"

const folder = "artifacts/employer-workspace"
const employer = {
  id: 81,
  name: "Employer workflow fixture",
  role: "employer",
  dashboard_tour_completed_at: "2026-11-10T00:00:00Z",
}
const shared = {
  id: 91,
  owner_id: 82,
  title: "Public office vacancy",
  organization: "Published organization",
  industry: "Services",
  location: "Calapan",
  employment_type: "Full-time",
  status: "published",
  description: "Office support and filing.",
  skills: ["Communication"],
  slots: 1,
  deadline: "2099-12-01",
  updated_at: "2026-11-10",
}
const list = (data) => ({
  data,
  total: data.length,
  current_page: 1,
  last_page: 1,
})

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await fs.mkdir(folder, { recursive: true })
})

test("employer can browse published listings, manage their own postings, and respond to referrals", async ({
  page,
}) => {
  let own = null
  const referredVacancy = {
    ...shared,
    id: 92,
    owner_id: employer.id,
    title: "Referred vacancy",
  }
  const referral = {
    id: 94,
    status: "referred",
    vacancy: referredVacancy,
    user: { id: 95, name: "Candidate fixture" },
    created_at: "2026-11-10",
  }
  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  )
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request()
    const { pathname, searchParams } = new URL(request.url())
    const method = request.method()
    if (pathname === "/api/v1/auth/user")
      return route.fulfill({ json: { user: employer } })
    if (pathname === "/api/v1/platform/summary")
      return route.fulfill({
        json: {
          saved: [],
          vacancies: own ? 1 : 0,
          referrals: 1,
          placements: 0,
        },
      })
    if (pathname === "/api/v1/platform/employers")
      return route.fulfill({
        json: list([{ organization: shared.organization, vacancy_count: 1 }]),
      })
    if (pathname === "/api/v1/platform/vacancies" && method === "POST") {
      own = {
        ...request.postDataJSON(),
        id: 93,
        owner_id: employer.id,
        updated_at: "2026-11-10",
      }
      return route.fulfill({ json: { data: own } })
    }
    if (pathname === "/api/v1/platform/vacancies/93" && method === "PATCH") {
      own = { ...own, ...request.postDataJSON() }
      return route.fulfill({ json: { data: own } })
    }
    if (pathname === "/api/v1/platform/vacancies") {
      if (searchParams.has("id"))
        return route.fulfill({
          json: list(
            [own, shared].filter(
              (row) => row && String(row.id) === searchParams.get("id"),
            ),
          ),
        })
      return route.fulfill({
        json: list(
          searchParams.get("scope") === "all" ? [shared] : own ? [own] : [],
        ),
      })
    }
    if (pathname === "/api/v1/platform/delete-intents") {
      expect(request.postDataJSON()).toEqual({ type: "vacancy", id: 93 })
      return route.fulfill({
        json: { token: "fixture-confirmation", wait_seconds: 5 },
      })
    }
    if (pathname === "/api/v1/platform/remove/vacancy/93" && method === "DELETE") {
      own = null
      return route.fulfill({ json: { message: "Removed" } })
    }
    if (pathname === "/api/v1/platform/referrals/94" && method === "PATCH") {
      Object.assign(referral, request.postDataJSON())
      return route.fulfill({ json: { data: referral } })
    }
    if (pathname === "/api/v1/platform/referrals")
      return route.fulfill({ json: list([referral]) })
    return route.fulfill({ json: list([]) })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/jobs")
  await expect(
    page.getByRole("heading", { name: "No vacancies yet" }),
  ).toBeVisible()
  await page.getByRole("link", { name: "All vacancies", exact: true }).click()
  await expect(
    page.getByRole("row").filter({ hasText: shared.title }),
  ).toContainText("Active")
  await page.getByRole("link", { name: "View vacancy", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: shared.title, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /edit vacancy|delete vacancy/i }),
  ).toHaveCount(0)
  await page.getByRole("link", { name: /back to catalog/i }).click()
  await page.getByRole("link", { name: "Employers", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Employer directory" }),
  ).toBeVisible()
  await page
    .getByRole("link", { name: /View vacancies at Published organization/ })
    .click()
  await expect(page).toHaveURL(/organization=Published\+organization/)
  await page.getByRole("link", { name: "My vacancies", exact: true }).click()
  await page.getByRole("button", { name: "Add vacancy", exact: true }).click()
  await page.getByLabel("Vacancy title").fill("My employer posting")
  await page.getByLabel("Employer / organization").fill("Own organization")
  await page.getByLabel("Work location").fill("Bansud")
  await page.getByLabel("Industry").fill("Services")
  await page
    .locator("#record-editor")
    .getByLabel("Employment type")
    .selectOption("Full-time")
  await page.getByLabel("Application deadline").fill("2099-12-01")
  await page
    .getByLabel("Required skills (comma separated)")
    .fill("Communication")
  await page
    .getByLabel("Responsibilities & requirements")
    .fill("Support the office and organize documents.")
  await page.getByRole("button", { name: "Save record", exact: true }).click()
  const row = page.getByRole("row").filter({ hasText: "My employer posting" })
  await expect(row.locator(".status-pending")).toHaveText("Pending PESO review")
  await row.getByRole("button", { name: "Edit vacancy" }).click()
  await page
    .locator("#record-editor")
    .getByLabel("Publication status")
    .selectOption("on_hold")
  await page.getByRole("button", { name: "Save record", exact: true }).click()
  await expect(row.locator(".status-pending")).toHaveText("On hold")
  await row.getByRole("button", { name: "Edit vacancy" }).click()
  await page
    .locator("#record-editor")
    .getByLabel("Publication status")
    .selectOption("cancelled")
  await page.getByRole("button", { name: "Save record", exact: true }).click()
  await expect(row.locator(".status-error")).toHaveText("Cancelled")
  await page.screenshot({ path: `${folder}/my-vacancies.png` })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await row.getByRole("button", { name: "Archive vacancy" }).click()
  const confirmation = page.getByRole("dialog")
  await expect(
    confirmation.getByRole("button", { name: /Archive \(\d+\)/ }),
  ).toBeDisabled()
  await confirmation.getByRole("button", { name: "Archive item" }).click()
  await expect(
    page.getByRole("heading", { name: "No vacancies yet" }),
  ).toBeVisible()

  await page.goto("/referrals")
  await page.getByRole("button", { name: "Review referral" }).click()
  await page
    .getByLabel("Next referral status")
    .selectOption({ label: "Accept for review" })
  await page
    .getByLabel("Notes / reason")
    .fill("Candidate accepted for employer review.")
  await page.getByRole("button", { name: "Save record", exact: true }).click()
  await expect(page.locator(".status-success")).toHaveText("Accepted")
  expect(referral.status).toBe("accepted")
})

test("dark login and registration keep visible primary actions and legible fields", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/user", (route) =>
    route.fulfill({ status: 401, json: {} }),
  )
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/login")
  await page.getByRole("button", { name: "Switch to dark mode" }).click()
  const login = page.getByRole("button", { name: "Log In", exact: true })
  await expect(login).toHaveCSS("background-color", "rgb(36, 92, 71)")
  await expect(login).toHaveCSS("color", "rgb(255, 255, 255)")
  await expect(page.locator(".auth-shell")).toHaveCSS(
    "background-color",
    "rgb(24, 25, 26)",
  )
  await expect(page.locator(".auth-brand-panel")).toHaveCSS(
    "background-color",
    "rgb(36, 37, 38)",
  )
  await expect(page.getByLabel("Email Address")).toHaveCSS(
    "background-color",
    "rgb(36, 37, 38)",
  )
  await page.screenshot({ path: `${folder}/dark-login.png` })
  const skip = page.getByRole("link", { name: "Skip to form" })
  await skip.focus()
  await expect(skip).toHaveCSS("color", "rgb(255, 255, 255)")
  await skip.blur()
  await page.getByRole("link", { name: "Create Account", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Create your account." }),
  ).toBeVisible()
  const register = page.getByRole("button", {
    name: "Create Account",
    exact: true,
  })
  await expect(register).toBeDisabled()
  await page.getByLabel("First Name").fill("Browser")
  await page.getByLabel("Last Name").fill("Fixture")
  await page.getByLabel("Email Address").fill("theme@example.test")
  await page.getByLabel("Mobile Number").fill("9171234567")
  await page
    .getByPlaceholder("Create a password", { exact: true })
    .fill("VisualFixture123!")
  await page
    .getByPlaceholder("Re-enter your password", { exact: true })
    .fill("VisualFixture123!")
  await page.getByRole("checkbox").check()
  await expect(register).toBeEnabled()
  await expect(register).toHaveCSS("background-color", "rgb(36, 92, 71)")
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: `${folder}/dark-register-mobile.png`,
    fullPage: true,
  })
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([])
})
