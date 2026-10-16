import { test, expect } from "./fixtures.js"
import AxeBuilder from "@axe-core/playwright"

async function accessible(page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
}

for (const width of [1440, 390]) {
  test(`connected job skill analysis training save and return ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    const featureRequests = []
    page.on("request", (request) => {
      if (
        /\/api\/(trainings|saved-trainings|jobs\/[^/]+\/skill-analysis|jobseeker\/skill-gaps)/.test(
          request.url(),
        )
      )
        featureRequests.push(request.url())
    })
    await page.goto("/dashboard")
    await expect(
      page.getByText(
        /Good to see you|Your employment journey, updates|Public-service examples, separate/,
      ),
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "Employment Feed", exact: true }),
    ).toHaveCount(0)
    await page
      .getByRole("link", { name: "View Full Skill Analysis", exact: true })
      .click()
    await expect(page).toHaveURL(/\/jobs\/customer-service\/skill-analysis$/)
    await expect(
      page.getByRole("heading", { name: "6 Required Skills" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Your Strengths for This Role" }),
    ).toBeVisible()
    await accessible(page)
    await page.screenshot({
      path: `test-results/screenshots/skill-analysis-${width}.png`,
      fullPage: true,
    })
    const gaps = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", {
          name: "Skills to Improve",
          exact: true,
        }),
      })
      .first()
    const excel = gaps.getByRole("listitem").filter({
      has: page.getByRole("button", { name: "Microsoft Excel", exact: true }),
    })
    await excel
      .getByRole("button", { name: "Microsoft Excel", exact: true })
      .click()
    const skillDialog = page.getByRole("dialog", {
      name: "Microsoft Excel",
      exact: true,
    })
    await expect(skillDialog).toBeVisible()
    await expect(
      skillDialog.getByText("Needs Improvement", { exact: true }),
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await excel
      .getByRole("link", { name: "View Related Training", exact: true })
      .click()
    await expect(page).toHaveURL(
      /\/training\?tab=recommended&skill=Microsoft%20Excel&job=customer-service&from=analysis/,
    )
    const card = page.getByRole("article").filter({
      has: page.getByRole("heading", {
        name: "Microsoft Excel Essentials",
        exact: true,
      }),
    })
    await expect(card).toHaveCount(1)
    await card
      .getByRole("button", { name: "Why Recommended", exact: true })
      .click()
    const why = page.getByRole("dialog", {
      name: "Why this training was recommended",
      exact: true,
    })
    await expect(
      why.getByText("Needs Improvement", { exact: true }),
    ).toBeVisible()
    await accessible(page)
    await page.screenshot({
      path: `test-results/screenshots/training-why-${width}.png`,
    })
    await page.keyboard.press("Escape")
    await card
      .getByRole("link", {
        name: "View training: Microsoft Excel Essentials",
        exact: true,
      })
      .click()
    await expect(page).toHaveURL(
      /\/training\/excel\?job=customer-service&from=analysis/,
    )
    await expect(
      page.getByRole("heading", { name: "Registration Details", exact: true }),
    ).toBeVisible()
    await accessible(page)
    await page.screenshot({
      path: `test-results/screenshots/training-details-${width}.png`,
      fullPage: true,
    })
    const guidance = page.getByRole("complementary", {
      name: "Training guidance",
    })
    await guidance
      .getByRole("button", { name: "Bookmark Training", exact: true })
      .click()
    await expect(
      page.getByRole("status").filter({ hasText: "Training saved." }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(
      guidance.getByRole("button", { name: "Bookmark Training", exact: true }),
    ).toBeVisible()
    await guidance
      .getByRole("button", { name: "Bookmark Training", exact: true })
      .click()
    await guidance
      .getByRole("button", { name: "I'm Interested", exact: true })
      .click()
    await expect(
      guidance.getByRole("button", { name: "Interested", exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
    await page.reload()
    await expect(
      guidance.getByRole("button", { name: "Saved", exact: true }),
    ).toBeVisible()
    await expect(
      guidance.getByRole("button", { name: "Interested", exact: true }),
    ).toHaveAttribute("aria-pressed", "true")
    await page
      .getByRole("link", { name: "Back to training", exact: true })
      .click()
    await expect(page).toHaveURL(
      /\/training\?tab=recommended&skill=Microsoft%20Excel&job=customer-service&from=analysis/,
    )
    await page
      .getByRole("link", { name: "Back to skill analysis", exact: true })
      .click()
    await expect(page).toHaveURL(/\/jobs\/customer-service\/skill-analysis$/)
    await page
      .getByRole("link", { name: "Back to job details", exact: true })
      .click()
    await expect(page).toHaveURL(/\/jobs\/customer-service$/)
    await page.goto("/training?tab=saved")
    await expect(
      page.getByRole("heading", {
        name: "Microsoft Excel Essentials",
        exact: true,
      }),
    ).toBeVisible()
    await page
      .getByRole("button", {
        name: "Unsave training: Microsoft Excel Essentials",
        exact: true,
      })
      .click()
    await expect(
      page.getByRole("heading", { name: "No saved training yet", exact: true }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Undo", exact: true }).click()
    await expect(
      page.getByRole("heading", {
        name: "Microsoft Excel Essentials",
        exact: true,
      }),
    ).toBeVisible()
    expect(featureRequests).toEqual([])
  })

  test(`training search filters tabs and empty states ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/training?tab=browse")
    await page
      .getByRole("textbox", { name: "Search training, skills, or provider" })
      .fill("Sample Training Partner")
    await expect(page.getByRole("article")).toHaveCount(1)
    await page
      .getByRole("textbox", { name: "Search training, skills, or provider" })
      .fill("")
    if (width < 1024) {
      await page.getByRole("button", { name: "Filters", exact: true }).click()
      const filters = page.getByRole("dialog", {
        name: "Filter Training",
        exact: true,
      })
      await filters
        .getByRole("combobox", { name: "Delivery Mode", exact: true })
        .selectOption("Online")
      await filters
        .getByRole("button", { name: "Apply Filters", exact: true })
        .click()
    } else
      await page
        .getByRole("combobox", { name: "Delivery Mode", exact: true })
        .selectOption("Online")
    await expect(page.getByRole("article")).toHaveCount(1)
    await expect(
      page.getByRole("heading", {
        name: "Workplace Communication",
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Remove filter: Online", exact: true }),
    ).toBeVisible()
    await page.getByRole("button", { name: "Clear All", exact: true }).click()
    await expect(page.getByRole("article")).toHaveCount(4)
    await accessible(page)
    await page.screenshot({
      path: `test-results/screenshots/training-browse-${width}.png`,
      fullPage: true,
    })
    await page
      .getByRole("textbox", { name: "Search training, skills, or provider" })
      .fill("no-program-here")
    await expect(
      page.getByRole("heading", {
        name: "No training programs found.",
        exact: true,
      }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "Clear Filters", exact: true })
      .last()
      .click()
    await expect(page.getByRole("article")).toHaveCount(4)
    await page
      .getByRole("tab", { name: "Browse Training", exact: true })
      .focus()
    await page.keyboard.press("ArrowLeft")
    await expect(
      page.getByRole("tab", { name: "Recommended for You", exact: true }),
    ).toHaveAttribute("aria-selected", "true")
    await page.goto("/jobseeker/training/excel?job=customer-service")
    await expect(page).toHaveURL(/\/training\/excel\?job=customer-service$/)
    await page
      .getByRole("link", { name: "Back to target job", exact: true })
      .click()
    await expect(page).toHaveURL(/\/jobs\/customer-service$/)
  })
}

test("loading errors invalid items and overview retain recovery paths", async ({
  page,
}) => {
  await page.goto("/training?preview=loading")
  await expect(
    page.getByRole("status", { name: "Loading training opportunity" }),
  ).toHaveCount(4)
  await page.goto("/training/excel?preview=loading")
  await expect(
    page.getByRole("status", { name: "Loading training details" }),
  ).toBeVisible()
  await page.goto(
    "/jobseeker/jobs/customer-service/skill-analysis?preview=loading",
  )
  await expect(
    page.getByRole("status", { name: "Loading skill analysis" }),
  ).toBeVisible()
  await page.goto("/training?preview=error")
  await page.getByRole("button", { name: "Try Again", exact: true }).click()
  await expect(page.getByRole("article")).toHaveCount(4)
  await page.goto("/training/missing")
  await expect(
    page.getByRole("heading", { name: "Training not found" }),
  ).toBeVisible()
  await page.goto("/jobseeker/jobs/missing/skill-analysis")
  await expect(
    page.getByRole("heading", { name: "Skill analysis not found" }),
  ).toBeVisible()
  await page.goto("/jobseeker/skill-analysis")
  await expect(
    page.getByRole("heading", { name: "Developing Skills", exact: true }),
  ).toBeVisible()
  await accessible(page)
})
