import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

test("official PESO details keep application links, provenance and mobile accessibility without a legacy source probe", async ({
  page,
}) => {
  const sourceRequests = []

  page.on("request", (request) => {
    if (
      request.url().includes("vacancy-source-status") ||
      request.url().includes("philjobnet.gov.ph")
    )
      sourceRequests.push(request.url())
  })

  const original = "https://pasay.gov.ph/peso-jobs/utility-helper/"

  const vacancy = {
    id: 900001,

    title: "PESO source review",

    organization: "Browser fixture organization",

    location: "Manila",

    industry: "Services",

    employment_type: "Full-time",

    description:
      "A browser fixture used only to check official PESO source presentation.",

    skills: [],

    source_url: original,

    source_name: "Pasay City PESO",

    source_checked_at: "2026-11-03T08:00:00+08:00",

    source_posted_on: "2026-11-03",

    external_application: true,

    deadline: null,

    slots: null,

    status: "published",

    is_sample: true,
  }

  await page.emulateMedia({ reducedMotion: "reduce" })

  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname

    if (path === "/api/v1/auth/user")
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

    if (path === "/api/v1/platform/summary")
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
    page.getByText("Reviewed PESO and government sources", { exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole("link", {
      name: "View official source information",

      exact: true,
    }),
  ).toHaveAttribute("href", original)

  await expect(
    page.getByRole("link", {
      name: "View official source information",

      exact: true,
    }),
  ).toHaveAttribute("rel", "noopener noreferrer")

  await expect(
    page.getByRole("link", {
      name: "View my referrals",

      exact: true,
    }),
  ).toHaveAttribute("href", "/referrals")

  await expect(page.getByText(/Coverage varies by office/)).toBeVisible()

  await expect(page.getByText(/No skill requirements mapped/)).toBeVisible()

  await expect(
    page.getByText(vacancy.description, { exact: true }),
  ).toBeVisible()

  await expect(page.getByText(/Checked Nov 3, 2026/)).toBeVisible()

  await fs.mkdir("artifacts/peso-sources", { recursive: true })

  await page.screenshot({
    path: "artifacts/peso-sources/peso-desktop.png",

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
    path: "artifacts/peso-sources/peso-mobile.png",

    fullPage: true,
  })

  await page

    .getByRole("link", {
      name: "View official source information",
      exact: true,
    })

    .focus()

  await expect(
    page.getByRole("link", {
      name: "View official source information",

      exact: true,
    }),
  ).toBeFocused()

  expect(sourceRequests).toEqual([])

  expect(errors).toEqual([])
})
