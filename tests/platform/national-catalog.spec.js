import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

const registryUrl =
  "https://www.tesda.gov.ph/Tvi/Result?SearchCourse=Qualification&SearchIns=Fixture&SearchLoc=Oriental+Mindoro"

const registry = {
  id: 980001,

  title: "Isolated registered-program fixture",

  provider: "Browser fixture institution",

  location: "Oriental Mindoro",

  mode: "Confirm delivery mode",

  description: "A browser-only fixture for registry semantics.",

  requirements: "Confirm the current intake with the institution.",

  skills: [],

  fee: null,

  capacity: null,

  starts_on: null,

  ends_on: null,

  schedule: "Registered program · intake not confirmed",

  external_enrollment: true,

  is_sample: true,

  status: "published",

  source_url: registryUrl,

  source_name: "TESDA Registered Program Directory",

  source_checked_at: "2026-11-06T08:00:00+08:00",

  catalog_type: "registered_program",

  availability_status: "intake_unconfirmed",
}

const overseas = {
  ...registry,

  id: 980002,

  title: "Isolated overseas-training fixture",

  location: "Japan",

  fee: 0,

  source_url:
    "https://mwo-osaka.dmw.gov.ph/2026/09/26/free-jlpt-n3-examination-preparation-training-program/",

  source_name: "MWO Osaka · TESDA National Language Skills Center",

  catalog_type: "overseas_training",

  availability_status: "official_announcement",
}

async function mock(page) {
  await page.emulateMedia({ reducedMotion: "reduce" })

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname === "/api/auth/user")
      return route.fulfill({
        json: {
          user: {
            id: 980000,

            name: "Browser Fixture",

            first_name: "Browser",

            role: "jobseeker",

            dashboard_tour_completed_at: "2026-11-06T00:00:00Z",
          },

          onboarding: { completed: true, current_step: 5 },
        },
      })

    if (url.pathname === "/api/platform/summary")
      return route.fulfill({ json: { saved: [] } })

    if (url.pathname === "/api/public/source-coverage")
      return route.fulfill({
        json: {
          review_date: "2026-11-06",

          sources: [
            {
              area: "Oriental Mindoro",

              name: "Official government careers",

              url: "https://ormindoro.gov.ph/careers/",

              status: "Office review recorded",

              notes: "A browser-only fixture for source coverage.",
            },
          ],
        },
      })

    let records = [registry, overseas]

    if (url.searchParams.has("id"))
      records = records.filter(
        (r) => String(r.id) === url.searchParams.get("id"),
      )

    if (
      url.searchParams.get("catalog") &&
      url.searchParams.get("catalog") !== "all"
    )
      records = records.filter(
        (r) => r.catalog_type === url.searchParams.get("catalog"),
      )

    if (url.searchParams.get("search"))
      records = records.filter((r) =>
        r.location.includes(url.searchParams.get("search")),
      )

    return route.fulfill({
      json: {
        data: records,

        total: records.length,

        current_page: 1,

        last_page: 1,
      },
    })
  })
}

test("registry details do not claim free fees, self-paced delivery or an open intake", async ({
  page,
}) => {
  await mock(page)

  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto("/training/980001")

  await expect(
    page.getByText("Registered program · confirm intake", { exact: true }),
  ).toBeVisible()

  await expect(
    page.getByText("Not disclosed · confirm with provider", { exact: true }),
  ).toBeVisible()

  await expect(
    page.getByText("Free online course", { exact: true }),
  ).toHaveCount(0)

  await expect(page.getByText("Self-paced", { exact: true })).toHaveCount(0)

  await expect(
    page.getByRole("link", {
      name: "View official source information",

      exact: true,
    }),
  ).toHaveAttribute("href", registryUrl)

  await expect(page.locator('[data-logo-loading="true"]')).toHaveCount(0)

  await page

    .getByText("Official sources and coverage by area", { exact: true })

    .click()

  await expect(
    page.getByRole("link", {
      name: /Oriental Mindoro · Official government careers/,
    }),
  ).toHaveAttribute("href", "https://ormindoro.gov.ph/careers/")

  await fs.mkdir("artifacts/national-catalog", { recursive: true })

  await page.screenshot({
    path: "artifacts/national-catalog/registered-desktop.png",

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

  expect(accessibility.violations.map((v) => v.id)).toEqual([])

  await page.screenshot({
    path: "artifacts/national-catalog/registered-mobile.png",

    fullPage: true,
  })
})

test("training type and priority-area controls query the catalog and keep overseas intake qualified", async ({
  page,
}) => {
  await mock(page)

  await page.goto("/training")

  await page

    .getByLabel("Filter training catalog")

    .selectOption("registered_program")

  await expect(
    page.getByRole("link", { name: registry.title, exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole("link", { name: overseas.title, exact: true }),
  ).toHaveCount(0)

  await page

    .getByRole("button", { name: "Oriental Mindoro", exact: true })

    .focus()

  await page.keyboard.press("Enter")

  await expect(page.getByLabel("Search training", { exact: true })).toHaveValue(
    "Oriental Mindoro",
  )

  await page.goto("/training/980002")

  await expect(
    page.getByRole("link", {
      name: "View official source information",

      exact: true,
    }),
  ).toHaveAttribute("href", overseas.source_url)

  await expect(
    page.getByText("Official overseas announcement · confirm intake", {
      exact: true,
    }),
  ).toBeVisible()

  await expect(
    page.getByText("Free as announced · confirm eligibility", { exact: true }),
  ).toBeVisible()
})
