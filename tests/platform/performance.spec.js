import { test, expect } from "./helpers.js"

test("dashboard loads only its feature and keeps one authoritative initial auth read", async ({
  page,
  account,
}) => {
  const requests = []
  page.on("request", (r) => requests.push(new URL(r.url()).pathname))
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/platform/events")),
    page.goto("/dashboard"),
  ])
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome")
  for (const path of [
    "/api/auth/user",
    "/api/platform/summary",
    "/api/platform/events",
  ])
    expect(requests.filter((p) => p === path)).toHaveLength(1)
  expect(
    requests.some((p) => /\/api\/(skills|jobseeker\/onboarding)/.test(p)),
  ).toBe(false)
  expect(
    requests.some((p) =>
      /(AuthPages|Landing|OnboardingPage|Catalog|Account-|Records|Operations|Tutorial-)/.test(
        p,
      ),
    ),
  ).toBe(false)
  await page
    .getByRole("navigation", { name: "Employment services" })
    .getByRole("link", { name: "Vacancy Management", exact: true })
    .click()
  await expect(page).toHaveURL(/\/jobs$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Vacancy Management",
  )
  expect(requests.some((p) => /Catalog/.test(p))).toBe(true)
  await page.goto("/messages")
  await expect(page).toHaveURL(/\/services$/)
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PESO")
  await page.goto("/notifications")
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("profile review requests the skills lookup only on the skills step", async ({
  page,
  account,
}) => {
  const reads = []
  page.on("request", (r) => {
    if (new URL(r.url()).pathname === "/api/skills") reads.push(r.url())
  })
  await page.goto("/jobseeker/onboarding/1?review=1")
  await expect(page.getByRole("textbox", { name: "First Name", exact: true })).toBeVisible()
  expect(reads).toHaveLength(0)
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === "/api/skills"),
    page.goto("/jobseeker/onboarding/3?review=1"),
  ])
  expect(response.ok()).toBe(true)
  expect((await response.json()).data.length).toBeGreaterThan(0)
  await expect(page.getByRole("textbox", { name: "Search skills", exact: true })).toBeVisible()
  expect(reads).toHaveLength(1)
})
