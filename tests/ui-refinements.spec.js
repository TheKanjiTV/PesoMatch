import { test, expect, apiCall } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

for (const width of [1440, 390]) {
  test(`education selections persist and keep placeholders disabled ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })

    await page.goto("/jobseeker/onboarding/2?review=1")

    const level = page.getByRole("combobox", { name: "Year Level" })

    await expect(level).toBeVisible()

    expect(
      await level.locator("option:not([disabled])").allTextContents(),
    ).toEqual(["1st", "2nd", "3rd", "4th", "5th", "5+"])

    for (const field of await page.getByRole("combobox").all()) {
      const placeholder = field.locator('option[value=""]')

      if (await placeholder.count()) await expect(placeholder).toBeDisabled()
    }

    const course = page.getByRole("combobox", { name: "Course / Program" })

    expect(await course.locator("option").count()).toBeGreaterThan(150)

    await course.selectOption("Civil Engineering")

    await level.selectOption("3rd")

    await page

      .getByRole("combobox", { name: "Educational Status" })

      .selectOption("Currently Studying")

    await expect(
      page.getByRole("combobox", { name: "Year Graduated" }),
    ).toBeDisabled()

    await page

      .getByRole("combobox", { name: "Educational Status" })

      .selectOption("Graduated")

    await page

      .getByRole("combobox", { name: "Year Graduated" })

      .selectOption("2024")

    await course.selectOption("__other")

    await page

      .getByRole("textbox", { name: "Other course / program" })

      .fill("Coastal Resource Studies")

    await page.screenshot({
      path: `test-results/screenshots/education-refined-${width}.png`,

      fullPage: true,
    })

    await page.getByRole("button", { name: "Save changes" }).click()

    await expect(page).toHaveURL(/jobseeker\/profile$/)

    const result = await apiCall(page.request, "/api/jobseeker/onboarding")

    const body = await result.json()

    expect(body.data.education).toMatchObject({
      year_level: "3rd",

      year_graduated: 2024,

      course_program: "Coastal Resource Studies",
    })

    await page.goto("/jobseeker/onboarding/2?review=1")

    await expect(level).toHaveValue("3rd")

    await expect(
      page.getByRole("textbox", { name: "Other course / program" }),
    ).toHaveValue("Coastal Resource Studies")

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])
  })

  test(`workspace spacing greeting actions and training back icon ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })

    await page.goto("/dashboard")

    await expect(
      page.getByText(
        /Good to see you|Your employment journey, updates|Public-service examples, separate/,
      ),
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "Employment Feed", exact: true }),
    ).toHaveCount(0)
    const jobs = page.locator('section[data-tour="jobs"]')

    await expect(
      jobs.getByRole("link", { name: "Explore Opportunities" }),
    ).toBeVisible()

    const explore = await jobs
      .getByRole("link", { name: "Explore Opportunities" })
      .boundingBox()

    const title = await jobs
      .getByRole("heading", { name: "Recommended Jobs", exact: true })
      .boundingBox()

    expect(explore.y + explore.height).toBeLessThan(title.y)

    await expect(page.getByText(/Demo opportunities Â·/)).toHaveCount(0)

    await expect(
      page.getByText(/Job and training recommendations support your decisions/),
    ).toHaveCount(0)

    if (width === 1440) {
      const sidebar = page.getByRole("navigation", {
        name: "Workspace navigation",
      })

      expect((await sidebar.boundingBox()).x).toBe(0)

      expect((await sidebar.boundingBox()).width).toBe(248)

      expect(
        await sidebar

          .getByRole("link", { name: "Dashboard", exact: true })

          .evaluate((element) =>
            parseFloat(getComputedStyle(element).fontSize),
          ),
      ).toBeGreaterThanOrEqual(15)

      expect(
        (await page.locator("#workspace-main").boundingBox()).x +
          (await page.locator("#workspace-main").boundingBox()).width,
      ).toBeCloseTo(width - 24, 0)
    }

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false)

    await page.screenshot({
      path: `test-results/screenshots/dashboard-refined-${width}.png`,

      fullPage: true,
    })

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await page.goto("/jobseeker/training/excel")

    const back = page.getByRole("link", {
      name: "Back to training",

      exact: true,
    })

    await expect(back).toBeVisible()

    await expect(back.locator("svg")).toHaveCount(1)

    await back.click()

    await expect(page).toHaveURL(/\/training$/)
  })
}

test("registration password and confirmation each have one working reveal toggle", async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL: "http://127.0.0.1:8443" })

  const page = await context.newPage()

  await page.goto("/register")

  const confirmation = page

    .getByLabel("Confirm Password", { exact: false })

    .and(page.locator("input"))

  await confirmation.fill("Example-Password123!")

  const toggle = page.getByRole("button", {
    name: "Show confirm password",

    exact: true,
  })

  await expect(toggle).toHaveCount(1)

  await toggle.click()

  await expect(confirmation).toHaveAttribute("type", "text")

  await page

    .getByRole("button", { name: "Hide confirm password", exact: true })

    .click()

  await expect(confirmation).toHaveAttribute("type", "password")

  await confirmation.focus()

  await page.screenshot({
    path: "test-results/screenshots/password-refined.png",
  })

  await context.close()
})
