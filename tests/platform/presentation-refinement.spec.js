import { test, expect } from "@playwright/test"
import fs from "node:fs/promises"

const vacancy = {
  id: 990120,
  title: "Records Assistant",
  organization: "Synthetic Employer",
  location: "Mansalay",
  employment_type: "Full-time",
  description: "Maintain office records.",
  skills: ["Computer Literacy"],
  slots: 2,
  deadline: "2027-12-01",
  status: "published",
  assessment: { score: 55 },
}
async function mock(context, role = "jobseeker") {
  await context.route("**/sanctum/csrf-cookie", (r) =>
    r.fulfill({ status: 204 }),
  )
  await context.route("**/api/v1/**", (r) => {
    const path = new URL(r.request().url()).pathname
    let json = { data: [], total: 0, current_page: 1, last_page: 1 }
    if (path === "/api/v1/auth/user")
      json = {
        user: {
          id: 990121,
          name: "Synthetic Presentation Check",
          first_name: "Synthetic",
          role,
          dashboard_tour_completed_at: "2026-11-25T00:00:00Z",
        },
        onboarding: { completed: true },
      }
    else if (path.endsWith("/summary"))
      json = {
        saved: [],
        referrals: 0,
        enrollments: 0,
        placements: 0,
        services: 0,
      }
    else if (path.endsWith("/vacancies"))
      json = { ...json, data: [vacancy], total: 1 }
    else if (path.endsWith("/ai/status"))
      json = { configured: true, notice_version: "synthetic-v1" }
    return r.fulfill({ json })
  })
}
test.beforeEach(async () => {
  await fs.mkdir("artifacts/presentation-refinement", { recursive: true })
})

test("large borderless percentage stays on the right in cards and details", async ({
  page,
  context,
}) => {
  await mock(context)
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 })
    await page.goto("/jobs")
    const score = page.getByLabel("Profile match").first()
    await expect(score).toHaveText("55% Match")
    const box = await score.boundingBox()
    const title = await page
      .getByRole("heading", { name: "Records Assistant", exact: true })
      .boundingBox()
    expect(box.x).toBeGreaterThan(title.x + title.width)
    expect(
      await score.evaluate((el) => getComputedStyle(el).borderTopWidth),
    ).toBe("0px")
    expect(
      await score
        .locator("span")
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(36)
    await expect(
      page.getByText(
        "Discover work opportunities or manage reviewed vacancies for PESO referrals.",
        { exact: true },
      ),
    ).toHaveCount(0)
    await page.screenshot({
      path: `artifacts/presentation-refinement/vacancies-${width}.png`,
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
  }
  await page.getByRole("link", { name: "View vacancy", exact: true }).click()
  await expect(page.getByRole("dialog").getByLabel("Profile match")).toHaveText(
    "55% Match",
  )
  expect(errors).toEqual([])
})

for (const role of [
  "jobseeker",
  "peso_staff",
  "admin",
  "employer",
  "training_provider",
]) {
  test(`${role}: Vacancy Management occupies the raised center navigation`, async ({
    page,
    context,
  }) => {
    await mock(context, role)
    await page.setViewportSize({ width: 390, height: 950 })
    await page.goto("/dashboard")
    const nav = page.getByRole("navigation", { name: "Mobile app navigation" })
    const center = nav.getByRole("link", {
      name: "Vacancy Management",
      exact: true,
    })
    await expect(center).toBeVisible()
    const circle = await center.locator(".app-tab-vacancies-icon").boundingBox()
    const bar = await nav.boundingBox()
    expect(circle.width).toBeGreaterThanOrEqual(52)
    expect(Math.abs(circle.x + circle.width / 2 - 195)).toBeLessThan(2)
    expect(circle.y).toBeLessThan(bar.y)
    await center.click()
    await expect(page).toHaveURL(/\/jobs$/)
  })
}

test("training modal has connected completion states, retains values and restores focus", async ({
  page,
  context,
}) => {
  await mock(context)
  await page.goto("/training-demand")
  const opener = page.getByRole("button", {
    name: "Request a training topic",
    exact: true,
  })
  await opener.click()
  const dialog = page.getByRole("dialog", {
    name: "Request a training topic",
    exact: true,
  })
  await dialog
    .getByLabel("Training / skill topic", { exact: true })
    .fill("Digital records")
  await dialog
    .getByLabel("What would you like to learn?", { exact: true })
    .fill("Maintain office records and spreadsheets.")
  await dialog.getByRole("button", { name: "Next", exact: true }).click()
  await expect(dialog.locator('[data-state="complete"]')).toHaveCount(1)
  await expect(dialog.locator('[aria-current="step"]')).toContainText("Dates")
  for (const [width, theme] of [
    [1440, "hc1"],
    [390, "hc2"],
  ]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(
      (theme) => (document.documentElement.dataset.contrast = theme),
      theme,
    )
    expect((await dialog.boundingBox()).width).toBeLessThanOrEqual(880)
    await page.screenshot({
      path: `artifacts/presentation-refinement/training-${width}-${theme}.png`,
    })
  }
  await dialog.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    dialog.getByLabel("Training / skill topic", { exact: true }),
  ).toHaveValue("Digital records")
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("AI setup explains disabled actions and supports consent on desktop and mobile", async ({
  page,
  context,
}) => {
  await mock(context)
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/ai-workspace")
  const generate = page.getByRole("button", {
    name: "Generate career advice",
    exact: true,
  })
  await expect(generate).toBeDisabled()
  await expect(
    page.getByText("Turn on AI assistance above to continue.", { exact: true }),
  ).toBeVisible()
  await page.getByText("AI assistance off", { exact: true }).click()
  const preferences = page.getByRole("dialog", {
    name: "AI privacy & response preferences",
  })
  await preferences.getByRole("checkbox").check()
  await preferences.getByRole("button", { name: "Done", exact: true }).click()
  await expect(
    page.getByText("Choose a vacancy to continue.", { exact: true }),
  ).toBeVisible()
  await page
    .getByRole("combobox", { name: "Selected vacancy", exact: true })
    .selectOption(String(vacancy.id))
  await expect(generate).toBeEnabled()
  for (const [width, theme] of [
    [1440, "hc1"],
    [390, "hc2"],
  ]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(
      (theme) => (document.documentElement.dataset.contrast = theme),
      theme,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `artifacts/presentation-refinement/ai-setup-${width}-${theme}.png`,
    })
  }
  await page.getByText("AI assistance on", { exact: true }).click()
  await expect(generate).toBeDisabled()
  expect(errors).toEqual([])
})

test("privacy opens over AI preferences, preserves its parent and supports direct links", async ({
  page,
  context,
}) => {
  await mock(context)
  await page.goto("/ai-workspace")
  await page
    .getByRole("button", { name: "Privacy & consent", exact: true })
    .click()
  const parent = page.getByRole("dialog", {
    name: "AI privacy & response preferences",
  })
  await parent
    .getByRole("link", { name: "Privacy notice", exact: true })
    .click()
  const privacy = page.getByRole("dialog", {
    name: "Privacy & Your Information",
    exact: true,
  })
  await expect(privacy).toBeVisible()
  await expect(page).toHaveURL(/\/ai-workspace$/)
  await expect(
    privacy.getByRole("heading", {
      name: "Information you provide",
      exact: true,
    }),
  ).toBeVisible()
  await page.screenshot({
    path: "artifacts/presentation-refinement/privacy-desktop.png",
  })
  await page.keyboard.press("Escape")
  await expect(parent).toBeVisible()
  await expect(
    parent.getByRole("link", { name: "Privacy notice", exact: true }),
  ).toBeFocused()
  await page.goto("/privacy")
  await expect(privacy).toBeVisible()
  await page.getByRole("button", { name: "Close dialog", exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("Reload app and Later use styled controls without covering mobile navigation", async ({
  page,
  context,
}) => {
  await mock(context)
  await page.goto("/dashboard")
  await page.getByRole("heading", { level: 1 }).waitFor()
  await page.evaluate(() => {
    window.__updateMessages = []
    window.dispatchEvent(
      new CustomEvent("peso:update", {
        detail: {
          version: "synthetic-update-1",
          worker: {
            postMessage: (value) => window.__updateMessages.push(value),
          },
        },
      }),
    )
  })
  const notice = page.getByRole("status", { name: "App update available" })
  await expect(notice).toBeVisible()
  for (const [width, theme] of [
    [1440, "hc1"],
    [390, "hc2"],
  ]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(
      (theme) => (document.documentElement.dataset.contrast = theme),
      theme,
    )
    expect(
      await notice
        .getByRole("button", { name: "Reload app" })
        .evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe("none")
    if (width === 390) {
      const box = await notice.boundingBox(),
        nav = await page.locator(".app-bottom-nav").boundingBox()
      expect(box.y + box.height).toBeLessThan(nav.y)
    }
    await page.screenshot({
      path: `artifacts/presentation-refinement/reload-${width}-${theme}.png`,
    })
  }
  await notice.getByRole("button", { name: "Reload app", exact: true }).click()
  expect(await page.evaluate(() => window.__updateMessages)).toEqual([
    { type: "SKIP_WAITING" },
  ])
  await expect(notice).toHaveCount(0)
})

test("reading privacy preserves registration entries and never checks consent", async ({
  page,
  context,
}) => {
  await mock(context)
  await context.route("**/api/v1/auth/user", (r) =>
    r.fulfill({ json: { user: null, onboarding: null } }),
  )
  await page.goto("/register")
  await page
    .getByRole("textbox", { name: "First Name", exact: true })
    .fill("Synthetic")
  const agreement = page.getByRole("checkbox", { name: /I agree/ })
  await expect(agreement).not.toBeChecked()
  await page
    .getByRole("link", { name: "Privacy Policy", exact: true })
    .first()
    .click()
  await expect(
    page.getByRole("dialog", { name: "Privacy & Your Information" }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("textbox", { name: "First Name", exact: true }),
  ).toHaveValue("Synthetic")
  await expect(agreement).not.toBeChecked()
  await expect(page).toHaveURL(/\/register$/)
})
