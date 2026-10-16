import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

test("sidebar Jobs views, match explanations and frontend detail recovery", async ({
  page,
}) => {
  await page.goto("/jobs?tab=recommended")

  const nav = page.getByRole("navigation", {
    name: "Workspace navigation",
    exact: true,
  })

  await expect(
    nav.getByRole("link", { name: "Recommended for You", exact: true }),
  ).toHaveAttribute("aria-current", "page")

  for (const label of [
    "Dashboard",
    "Browse All Jobs",
    "Saved Jobs",
    "Training",
    "PESO Assistance",
    "Notifications",
    "Messages",
    "My Profile",
    "Settings",
  ])
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toBeVisible()

  await page
    .getByLabel("Job results")
    .locator("article")
    .first()
    .getByRole("button", { name: "Why You Match", exact: true })
    .click()

  const modal = page.getByRole("dialog", { name: "Why You Match", exact: true })

  await expect(modal).toContainText("College Level")

  await expect(modal).toContainText("preferred province")

  await expect(modal).toContainText("preferred skill is not listed")

  await page.keyboard.press("Escape")

  await expect(modal).not.toBeVisible()

  await expect(
    page
      .getByLabel("Job results")
      .locator("article")
      .first()
      .getByRole("button", { name: "Why You Match", exact: true }),
  ).toBeFocused()

  await nav.getByRole("link", { name: "Browse All Jobs", exact: true }).click()

  const filters = page.getByRole("form", { name: "Job filters", exact: true })

  for (const [label, value] of [
    ["Job Category", "Sales / Retail"],
    ["Location", "Roxas, Oriental Mindoro"],
    ["Employment Type", "Full-time"],
    ["Experience Level", "No experience required"],
    ["Education Level", "Senior High School"],
    ["Work Arrangement", "On-site"],
    ["Match Classification", "Potential Match"],
  ])
    await filters
      .getByRole("combobox", { name: label, exact: true })
      .selectOption(value)

  await filters
    .getByRole("button", { name: "Apply Filters", exact: true })
    .click()

  await expect(page.getByLabel("Job results").locator("article")).toHaveCount(1)

  const returnUrl = page.url()

  await page
    .getByRole("link", { name: "View Sales Associate", exact: true })
    .click()

  await page.getByRole("link", { name: "Back to Jobs", exact: true }).click()

  await expect(page).toHaveURL(returnUrl)

  await expect(
    filters.getByRole("combobox", { name: "Location", exact: true }),
  ).toHaveValue("Roxas, Oriental Mindoro")

  await page.goto("/jobseeker/jobs/it-support")

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "IT Support Assistant",
  )

  await expect(
    page.getByText(
      "Help staff troubleshoot routine computer, software and connectivity issues.",
      { exact: true },
    ),
  ).toBeVisible()

  await page.goto("/jobseeker/jobs/customer-service?preview=loading")

  await expect(
    page.getByRole("status", { name: "Loading job details", exact: true }),
  ).toBeVisible()

  await expect(
    page.getByRole("status", { name: "Loading match guidance", exact: true }),
  ).toBeVisible()

  await page.goto("/jobseeker/jobs/customer-service?preview=error")

  await expect(page.getByRole("alert")).toContainText(
    "We couldn't load job opportunities.",
  )

  await page.getByRole("button", { name: "Try Again", exact: true }).click()

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Customer Service Representative",
  )

  await page.goto("/jobseeker/jobs/unavailable")

  await expect(
    page.getByRole("heading", { name: "Job not found", exact: true }),
  ).toBeVisible()
})

for (const width of [1440, 1024, 900, 390, 320])
  test(`Jobs responsive and accessibility ${width}px`, async ({ page }) => {
    test.setTimeout(180000)

    await page.setViewportSize({ width, height: 900 })

    const errors = []

    page.on("pageerror", (error) => errors.push(error.message))

    for (const [route, name] of [
      ["/jobs?tab=recommended", "recommended"],
      ["/jobs?tab=browse", "browse"],
      ["/jobs?tab=saved", "saved"],
      ["/jobseeker/jobs/customer-service", "detail"],
      ["/dashboard", "dashboard"],
    ]) {
      await page.goto(route)

      await expect(page.locator("h1")).toHaveCount(1)

      await page.evaluate(() => document.fonts.ready)

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true)

      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
        route,
      ).toEqual([])

      if ([1440, 390].includes(width))
        await page.screenshot({
          path: `test-results/screenshots/jobs-${name}-${width}.png`,
          fullPage: true,
        })
    }

    if (width < 1024) {
      await page.goto("/jobs?tab=browse")

      await page.getByRole("button", { name: "Filters", exact: true }).click()

      const drawer = page.getByRole("dialog", {
        name: "Filter job opportunities",
        exact: true,
      })

      await drawer
        .getByRole("combobox", { name: "Employment Type", exact: true })
        .selectOption("Contract")

      await drawer
        .getByRole("button", { name: "Apply Filters", exact: true })
        .click()

      await expect(drawer).not.toBeVisible()

      await expect(
        page.getByRole("button", {
          name: "Remove Contract filter",
          exact: true,
        }),
      ).toBeVisible()

      await expect(
        page.getByLabel("Job results").locator("article"),
      ).toHaveCount(3)
    }

    expect(errors).toEqual([])
  })
