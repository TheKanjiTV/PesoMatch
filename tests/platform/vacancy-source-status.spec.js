import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import fs from "node:fs/promises"

test("source outages preserve imported details, offer guidance, and recover after a status recheck", async ({
  page,
}) => {
  let sourceState = "unavailable"
  const original =
    "https://philjobnet.gov.ph/job-vacancies/job/source-review-1234567"
  const vacancy = {
    id: 900001,
    title: "Source availability review",
    organization: "Browser fixture organization",
    location: "Manila",
    industry: "Services",
    employment_type: "Full-time",
    description: "A browser fixture used only to check outage handling.",
    skills: [],
    source_url: original,
    source_name: "PhilJobNet",
    source_checked_at: "2026-11-03T08:00:00+08:00",
    source_posted_on: "2026-11-03",
    external_application: true,
    deadline: null,
    slots: null,
    status: "published",
    is_sample: true,
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === "/api/auth/user")
      return route.fulfill({
        json: {
          user: {
            id: 900001,
            name: "Source Review",
            first_name: "Source",
            role: "jobseeker",
            dashboard_tour_completed_at: "2026-11-06T00:00:00Z",
          },
          onboarding: { completed: true, current_step: 5 },
        },
      })
    if (path === "/api/public/vacancy-source-status")
      return route.fulfill({
        json: {
          status: sourceState,
          checked_at: "2026-11-06T20:00:00+08:00",
          http_status: sourceState === "reachable" ? 200 : 403,
          url: "https://philjobnet.gov.ph/job-vacancies/",
        },
      })
    if (path === "/api/platform/summary")
      return route.fulfill({ json: { saved: [] } })
    return route.fulfill({
      json: { data: [vacancy], current_page: 1, last_page: 1, total: 1 },
    })
  })
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/jobs/900001")
  await expect(
    page.getByText("PhilJobNet is currently unavailable from PesoMatch.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", {
      name: "Retry original PhilJobNet listing",
      exact: true,
    }),
  ).toHaveAttribute("href", original)
  await expect(
    page.getByRole("link", {
      name: "Ask PESO for application guidance",
      exact: true,
    }),
  ).toHaveAttribute("href", "/services")
  await expect(
    page.getByRole("link", {
      name: "View official listing & apply",
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(
    page.getByText(vacancy.description, { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/Checked Nov 3, 2026/)).toBeVisible()
  await fs.mkdir("artifacts/source-status", { recursive: true })
  await page.screenshot({
    path: "artifacts/source-status/unavailable-desktop.png",
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  await page.screenshot({
    path: "artifacts/source-status/unavailable-mobile.png",
    fullPage: true,
  })
  sourceState = "reachable"
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await expect(
    page.getByRole("link", {
      name: "View official listing & apply",
      exact: true,
    }),
  ).toHaveAttribute("href", original)
  await expect(
    page.getByText("PhilJobNet is currently unavailable from PesoMatch.", {
      exact: true,
    }),
  ).toHaveCount(0)
  expect(errors).toEqual([])
})
