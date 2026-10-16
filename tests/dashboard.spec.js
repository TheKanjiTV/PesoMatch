import { test, expect, apiCall } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

import { mkdir, writeFile } from "node:fs/promises"

for (const width of [1440, 900, 390, 320]) {
  test(`workspace layout and accessibility ${width}px`, async ({ page }) => {
    test.setTimeout(180000)

    const errors = []

    page.on("pageerror", (error) => errors.push(error.message))

    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 })

    for (const route of [
      "/dashboard",

      "/jobseeker/jobs",

      "/jobseeker/jobs/customer-service",

      "/jobseeker/training",

      "/jobseeker/training/excel",

      "/jobseeker/assistance",

      "/jobseeker/profile",

      "/jobseeker/settings",

      "/jobseeker/messages",

      "/jobseeker/notifications",

      "/jobseeker/skills",
    ]) {
      await page.goto(route)

      await expect(page.locator("h1")).toHaveCount(1)

      await expect(page).not.toHaveURL(/login|onboarding/)

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

      if (
        [1440, 390].includes(width) &&
        [
          "/dashboard",

          "/jobseeker/jobs",

          "/jobseeker/jobs/customer-service",
        ].includes(route)
      )
        await page.screenshot({
          path: `test-results/screenshots/${route.split("/").filter(Boolean).join("-")}-${width}.png`,

          fullPage: true,
        })
    }

    expect(errors).toEqual([])
  })
}

test("workspace profile and navigation retain the real account", async ({
  page,

  context,
}) => {
  await page.goto("/dashboard")

  await expect(page.locator("h1")).toContainText("Browser")

  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible()

  await page

    .getByRole("button", { name: "Account options", exact: true })

    .click()

  await page
    .locator("#account-links")
    .getByRole("link", { name: "My Profile", exact: true })
    .click()

  await expect(page).toHaveURL(/\/jobseeker\/profile$/)

  await expect(page.getByText("Test College", { exact: true })).toBeVisible()

  await page.reload()

  await expect(page.getByText("Test College", { exact: true })).toBeVisible()

  await mkdir("test-results", { recursive: true })

  await writeFile(
    "test-results/uireview-session.json",

    JSON.stringify(await context.storageState()),
  )
})

test("mobile navigation and account menus work with keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto("/dashboard")

  const toggle = page.getByRole("button", { name: "Open navigation" })

  await toggle.click()

  const nav = page.getByRole("navigation", {
    name: "Workspace navigation",

    exact: true,
  })

  await expect(nav).toBeVisible()

  await page.keyboard.press("Escape")

  await expect(toggle).toBeFocused()

  await toggle.click()

  const jobsToggle = nav.getByRole("button", { name: "Jobs", exact: true })

  if ((await jobsToggle.getAttribute("aria-expanded")) === "false")
    await jobsToggle.click()

  await nav.getByRole("link", { name: "Browse All Jobs", exact: true }).click()

  await expect(page).toHaveURL(/\/jobs\?tab=browse$/)

  await expect(nav).not.toBeVisible()

  await page.getByRole("button", { name: "Account options" }).click()

  await page

    .getByRole("link", { name: "Account Settings", exact: true })

    .click()

  await expect(page).toHaveURL(/\/jobseeker\/settings$/)
})

test("saved profile review edits persist without restarting onboarding", async ({
  page,
}) => {
  await page.goto("/jobseeker/profile")

  await page.getByRole("link", { name: "Edit Education", exact: true }).click()

  await expect(page).toHaveURL(/onboarding\/2\?review=1$/)

  const school = page.getByRole("textbox", {
    name: "School / Institution",

    exact: true,
  })

  await expect(school).toHaveValue("Test College")

  await school.fill("Updated Test College")

  await page.getByRole("button", { name: "Save changes", exact: true }).click()

  await expect(page).toHaveURL(/\/jobseeker\/profile$/)

  await expect(
    page.getByText("Updated Test College", { exact: true }),
  ).toBeVisible()

  await expect(page.getByText("100% complete", { exact: true })).toBeVisible()

  await page.reload()

  await expect(
    page.getByText("Updated Test College", { exact: true }),
  ).toBeVisible()

  const response = await apiCall(page.request, "/api/jobseeker/onboarding")

  expect(response.status()).toBe(200)

  const profile = await response.json()

  expect(profile.onboarding.completed).toBe(true)

  expect(profile.onboarding.completion_percentage).toBe(100)
})
