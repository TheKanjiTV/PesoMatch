import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import { apiCall } from "./fixtures.js"

import { recordMotion, expectPanelMotion, clearMotion } from "./motion.js"

for (const width of [1440, 390]) {
  test(`five-step profile saves, recovers, completes and remembers tour ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(150000)

    await recordMotion(page)

    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 })

    const errors = []

    page.on("pageerror", (e) => errors.push(e.message))

    const password = "WizardProfile482!"

    const email = `wizard.${width}.${Date.now()}@example.test`

    const registered = await apiCall(
      page.request,

      "/api/auth/register",

      "POST",

      {
        first_name: "Wizard",

        last_name: "Check",

        email,

        password,

        password_confirmation: password,
      },
    )

    expect(registered.status()).toBe(201)

    expect(
      (
        await apiCall(page.request, "/api/auth/login", "POST", {
          email,
          password,
        })
      ).status(),
    ).toBe(200)

    await page.goto("/jobseeker/onboarding/1")

    const textbox = (name) => page.getByRole("textbox", { name, exact: true })

    const next = () =>
      page.getByRole("button", { name: "Save & continue", exact: true })

    const audit = async (step) => {
      await expect(page.locator("form")).toBeVisible()

      await page.evaluate(() => document.fonts.ready)

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)

      expect(
        (
          await new AxeBuilder({ page })

            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

            .analyze()
        ).violations,
      ).toEqual([])

      await page.screenshot({
        path: `test-results/screenshots/onboarding-${step}-${width}.png`,

        fullPage: true,
      })
    }

    await next().click()

    await expect(page.getByRole("alert")).toContainText("highlighted fields")

    await page.getByLabel("Birth Date").fill("2000-01-02")

    await page.getByLabel("Mobile Number").fill("917abc1234567")

    await expect(page.getByLabel("Mobile Number")).toHaveValue("917 123 4567")

    await textbox("Address").fill("Test address")

    await textbox("Province").fill("Oriental Mindoro")

    await textbox("Municipality / City").fill("Bansud")

    await textbox("Barangay").fill("Poblacion")

    await audit(1)

    await page.route(
      "**/api/jobseeker/onboarding/personal",

      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1200))

        await route.fulfill({
          status: 503,

          contentType: "application/json",

          body: JSON.stringify({
            message: "Profile service unavailable. Please try again.",
          }),
        })
      },

      { times: 1 },
    )

    await next().click()

    await expect(page.getByRole("button", { name: "Saving..." })).toBeDisabled()

    await expect(page.getByRole("alert")).toContainText("unavailable")

    await expect(page).toHaveURL(/onboarding\/1$/)

    await expect(textbox("Address")).toHaveValue("Test address")

    await next().click()

    await expect(page).toHaveURL(/onboarding\/2$/)

    await expectPanelMotion(page, "forward", "form")

    await page

      .getByRole("combobox", { name: "Highest Educational Attainment" })

      .selectOption("College Level")

    await page

      .getByRole("combobox", { name: "Educational Status" })

      .selectOption("Currently Studying")

    await expect(page.getByLabel("Year Graduated")).toBeDisabled()

    await textbox("School / Institution").fill("Test College")

    await page.getByRole("button", { name: "Back", exact: true }).click()

    const leave = page.getByRole("dialog", {
      name: "You have unsaved changes. Leave this page?",
    })

    await expect(leave).toBeVisible()

    await leave.getByRole("button", { name: "Stay", exact: true }).click()

    await expect(textbox("School / Institution")).toHaveValue("Test College")

    await clearMotion(page)

    await page.getByRole("button", { name: "Back", exact: true }).click()

    await leave.getByRole("button", { name: "Leave", exact: true }).click()

    await expect(page).toHaveURL(/onboarding\/1$/)

    await expectPanelMotion(page, "back", "form")

    await expect(textbox("Address")).toHaveValue("Test address")

    await next().click()

    await expect(page).toHaveURL(/onboarding\/2$/)

    await expect(textbox("School / Institution")).toBeEmpty()

    await page

      .getByRole("combobox", { name: "Highest Educational Attainment" })

      .selectOption("College Level")

    await page

      .getByRole("combobox", { name: "Educational Status" })

      .selectOption("Currently Studying")

    await textbox("School / Institution").fill("Test College")

    await audit(2)

    await next().click()

    await expect(page).toHaveURL(/onboarding\/3$/)

    await clearMotion(page)

    await page.getByRole("button", { name: "Back", exact: true }).click()

    await expect(page).toHaveURL(/onboarding\/2$/)

    await expectPanelMotion(page, "back", "form")

    await expect(textbox("School / Institution")).toHaveValue("Test College")

    await expect(page.locator("form")).toHaveClass(/onboarding-flow-back/)

    await page.locator('button[aria-current="step"]').click()

    await expect(page.locator("form")).toHaveCSS("opacity", "1")

    await next().click()

    await expect(page).toHaveURL(/onboarding\/3$/)

    await page.getByLabel("Search skills").fill("Customer")

    await page

      .getByRole("button", { name: "Customer Service", exact: true })

      .click()

    await page

      .getByRole("button", { name: "Add Certification", exact: true })

      .click()

    await textbox("Certification Name").fill("Customer Care Certificate")

    await page.getByRole("button", { name: "Remove certification 1" }).click()

    await expect(page.getByRole("status")).toContainText(
      "Certification removed",
    )

    await page.getByRole("button", { name: "Undo", exact: true }).click()

    await expect(textbox("Certification Name")).toHaveValue(
      "Customer Care Certificate",
    )

    await page.getByRole("button", { name: "Remove certification 1" }).click()

    await page.getByRole("button", { name: "Dismiss notification" }).click()

    await audit(3)

    await next().click()

    await expect(page).toHaveURL(/onboarding\/4$/)

    await page.getByRole("radio", { name: "Yes", exact: true }).check()

    await textbox("Job Title").fill("Office Assistant")

    await textbox("Company / Organization").fill("Test Company")

    await page.getByLabel("Start Date").fill("2022-01-01")

    await page.getByRole("checkbox", { name: "I currently work here" }).check()

    await page.getByRole("button", { name: "Remove experience 1" }).click()

    await page.getByRole("button", { name: "Undo", exact: true }).click()

    await expect(textbox("Job Title")).toHaveValue("Office Assistant")

    await page.getByRole("radio", { name: "No", exact: true }).check()

    await expect(page.getByText("That's okay.", { exact: false })).toBeVisible()

    await audit(4)

    await next().click()

    await expect(page).toHaveURL(/onboarding\/5$/)

    await page

      .getByRole("button", { name: "Office Assistant", exact: true })

      .click()

    await textbox("Preferred Location").fill("Bansud, Oriental Mindoro")

    await page.getByRole("checkbox", { name: "Full-time", exact: true }).check()

    await page.getByRole("checkbox", { name: "On-site", exact: true }).check()

    await audit(5)

    await page

      .getByRole("button", { name: "Complete profile", exact: true })

      .click()

    await expect(page).toHaveURL(/onboarding\/complete$/)

    await expect(
      page.getByRole("heading", { name: "Your Jobseeker Profile is Ready" }),
    ).toBeVisible()

    await expect(
      page.getByText("100% complete", { exact: true }).first(),
    ).toBeVisible()

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await page.screenshot({
      path: `test-results/screenshots/onboarding-complete-${width}.png`,

      fullPage: true,
    })

    await expectPanelMotion(page, "forward", "section")

    const profile = await apiCall(page.request, "/api/jobseeker/onboarding")

    const saved = await profile.json()

    expect(saved.onboarding.completed).toBe(true)

    expect(saved.onboarding.completion_percentage).toBe(100)

    expect(saved.data.work_experience.has_experience).toBe(false)

    expect(saved.data.work_experience.experiences).toEqual([])

    expect(saved.data.skills.certifications).toEqual([])

    await clearMotion(page)

    await page

      .getByRole("button", { name: "Go to Dashboard", exact: true })

      .click()

    await expect(page).toHaveURL(/\/dashboard$/)

    await expectPanelMotion(page, "forward", "workspace-main")

    const tour = page.getByRole("dialog")

    await expect(tour).toBeVisible()

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await page.screenshot({
      path: `test-results/screenshots/onboarding-tour-${width}.png`,
    })

    for (let i = 0; i < 8; i++) {
      await tour.getByRole("button", { name: "Next", exact: true }).click()

      await expect(tour.locator('[lang="fil"]')).toBeVisible()

      await page.keyboard.press("Tab")

      expect(
        await page.evaluate(() =>
          document

            .querySelector("dialog[open]")

            .contains(document.activeElement),
        ),
      ).toBe(true)
    }

    const preference = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/auth/preferences") &&
        r.request().method() === "PATCH",
    )

    await tour.getByRole("button", { name: "Finish Tour", exact: true }).click()

    expect((await preference).status()).toBe(200)

    await page.reload()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    await expect(page.locator("h1")).toContainText("Wizard")

    await page.goto("/dashboard?tour=1")

    await page

      .getByRole("dialog")

      .getByRole("button", { name: "Next", exact: true })

      .click()

    await page

      .getByRole("dialog")

      .getByRole("button", { name: "VIEW PROFILE", exact: true })

      .click()

    await expect(page).toHaveURL(/\/jobseeker\/profile$/)

    await expect(page.getByText("Test College", { exact: true })).toBeVisible()

    expect(errors).toEqual([])
  })
}
