import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

async function settled(page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  )
  await page.evaluate(() => document.fonts.ready)
}

async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

async function axe(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(
    results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(",")}`,
    ),
  ).toEqual([])
}

test("Home has aligned navigation, two supplied posts and a compact recommendation panel", async ({
  page,
}, info) => {
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard")

  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible()

  await expect(
    page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible()

  await expect(
    page.locator('[aria-label="Employment updates"] article'),
  ).toHaveCount(2)

  await expect(page.getByText("Saved (0)", { exact: true })).toHaveCount(0)

  await expect(page.locator('[data-tour="jobs"] li')).toHaveCount(3)

  await expect(
    page.getByText("View all recommended jobs", { exact: true }),
  ).toBeVisible()

  await expect(
    page.locator("header").getByText("PesoMatch", { exact: true }),
  ).toHaveCount(0)

  await settled(page)
  await page.screenshot({
    path: info.outputPath("home-desktop.png"),
    fullPage: true,
  })
  await noOverflow(page)
  await axe(page)

  await page
    .getByRole("button", { name: "Profile options", exact: true })
    .click()

  await expect(
    page.getByRole("link", { name: "Settings & Privacy", exact: true }),
  ).toBeVisible()

  await expect(
    page.locator("#account-links").getByRole("button", { name: "Verify Now" }),
  ).toBeVisible()

  await expect(
    page.getByText("PESO Portal Preview", { exact: true }),
  ).toHaveCount(0)

  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("button", { name: "Profile options" }),
  ).toBeFocused()

  expect(errors).toEqual([])
})

test("search submits, filters opportunities and persists account-scoped recent searches", async ({
  page,
}) => {
  await page.goto("/dashboard")

  await page
    .getByRole("textbox", { name: "Search PesoMatch" })
    .fill("Customer Service Representative")

  await page.getByRole("textbox", { name: "Search PesoMatch" }).press("Enter")

  await expect(
    page.getByRole("heading", { name: "Search results" }),
  ).toBeVisible()

  await page
    .getByRole("navigation", { name: "Search filters" })
    .getByRole("button", { name: "Jobs", exact: true })
    .click()

  await expect(
    page.getByRole("heading", {
      name: "Customer Service Representative",
      exact: true,
    }),
  ).toBeVisible()

  await page
    .getByLabel("Employment type", { exact: true })
    .selectOption("Part-time")

  await expect(
    page.getByRole("heading", { name: "No matching results" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Clear filters" }).click()

  await page.reload()
  await page.getByRole("textbox", { name: "Search PesoMatch" }).click()

  await expect(
    page.getByRole("heading", { name: "Recent searches" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Clear history", exact: true }).click()

  await expect(
    page.getByRole("heading", { name: "Recent searches" }),
  ).toHaveCount(0)
})

test("feed hide, undo, unfollow, refollow, save and report work without social reactions", async ({
  page,
}) => {
  await page.goto("/dashboard")

  const post = page.getByRole("article", {
    name: "In-house job interviews",
    exact: true,
  })

  await post
    .getByRole("button", {
      name: "Hide post: In-house job interviews",
      exact: true,
    })
    .click()

  const hidden = page.getByRole("article", {
    name: "Hidden post: In-house job interviews",
  })

  await expect(hidden.getByText("Post hidden in your feed.")).toBeVisible()
  await hidden.getByRole("button", { name: "Undo", exact: true }).click()

  await post
    .getByRole("button", { name: "Post options: In-house job interviews" })
    .click()
  await post
    .getByRole("button", { name: "Not interested", exact: true })
    .click()

  await expect(
    hidden.getByText("You unfollowed PESO Mandaluyong Official."),
  ).toBeVisible()

  await page.goto("/jobseeker/settings?section=account&detail=unfollowed")
  await page.getByRole("button", { name: "Follow again" }).click()

  await page.goto("/dashboard")
  await post.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    post.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible()

  await post
    .getByRole("button", { name: "Post options: In-house job interviews" })
    .click()
  await post.getByRole("button", { name: "Report post", exact: true }).click()

  const dialog = page.getByRole("dialog", { name: "Report post", exact: true })
  await dialog
    .getByLabel("Reason")
    .selectOption("Misleading vacancy information")
  await dialog.getByRole("button", { name: "Save report" }).click()

  await expect(dialog.getByText("Report saved in this preview.")).toBeVisible()

  await dialog.getByRole("button", { name: "Done" }).click()
  await page.goto("/jobseeker/settings?section=privacy&detail=reports")

  await expect(
    page.getByText("Misleading vacancy information", { exact: false }),
  ).toBeVisible()
})

test("profile edits use a modal and persist personal information through the existing API", async ({
  page,
}, info) => {
  await page.goto("/jobseeker/profile")

  await page.getByRole("button", { name: "Edit Profile", exact: true }).click()

  const dialog = page.getByRole("dialog", { name: "Edit Profile", exact: true })

  await dialog
    .getByLabel("Headline", { exact: true })
    .fill("Frontend Developer | React | UI/UX")

  await dialog
    .getByRole("textbox", { name: "First Name", exact: true })
    .fill("Preview")

  await settled(page)
  await page.screenshot({
    path: info.outputPath("profile-editor-desktop.png"),
    fullPage: true,
  })
  await axe(page)

  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/api/jobseeker/profile") &&
      response.request().method() === "PATCH",
  )

  await dialog.getByRole("button", { name: "Save", exact: true }).click()
  expect((await saved).status()).toBe(200)

  await expect(dialog).not.toBeVisible()
  await expect(page).toHaveURL(/\/jobseeker\/profile$/)

  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Preview Check", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Frontend Developer | React | UI/UX", { exact: true }),
  ).toBeVisible()

  await page
    .getByRole("button", { name: "Edit Education", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", { name: "Edit Education", exact: true }),
  ).toBeVisible()
  await page.keyboard.press("Escape")
})

test("settings language, notifications, account forms and Help articles are functional", async ({
  page,
}, info) => {
  await page.goto("/jobseeker/settings")

  await expect(
    page.getByRole("navigation", { name: "Settings categories" }),
  ).toBeVisible()

  await settled(page)
  await page.screenshot({
    path: info.outputPath("settings-desktop.png"),
    fullPage: true,
  })
  await axe(page)

  await page.getByRole("button", { name: /^Language / }).click()
  await page.getByLabel("Language", { exact: true }).selectOption("fil")

  await expect(
    page.getByRole("button", { name: "Trabaho", exact: true }),
  ).toBeVisible()

  await page.getByLabel("Language", { exact: true }).selectOption("en")

  await page.goto("/jobseeker/settings?section=security&detail=password")
  await expect(
    page.getByLabel(/^New Password/),
  ).toBeVisible()
  await expect(
    page.getByRole("textbox", { name: "First Name", exact: true }),
  ).toHaveCount(0)

  await page.goto("/help")
  await page
    .getByRole("textbox", { name: "Search help articles" })
    .fill("password")
  await page.getByRole("button", { name: "Search help", exact: true }).click()

  await page
    .getByRole("link", { name: "Change your password", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Change your password", exact: true }),
  ).toBeVisible()
  await page.getByRole("link", { name: "Change Password", exact: true }).click()

  await expect(page).toHaveURL(/detail=password/)
})

test("Businesses connects to Admin Center and local support without granting company permissions", async ({
  page,
}, info) => {
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Businesses", exact: true }).click()

  await expect(
    page.getByRole("link", { name: "Create a Company Page +", exact: true }),
  ).toHaveCount(0)

  await page
    .locator("#business-links")
    .getByRole("link", { name: "Admin Center", exact: true })
    .click()

  await expect(page.getByRole("heading", { name: /Welcome to/ })).toBeVisible()
  await settled(page)
  await page.screenshot({
    path: info.outputPath("admin-center-desktop.png"),
    fullPage: true,
  })
  await axe(page)

  await page
    .getByRole("button", { name: "Contact Us Now", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "Support message" })
    .fill("How do I update my profile?")
  await page
    .getByRole("button", { name: "Send support preview message" })
    .click()

  await expect(
    page.getByText("Message kept in this preview.", { exact: false }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Minimize support", exact: true })
    .first()
    .click()

  await page
    .getByRole("link", { name: "Enter Staff Portal", exact: false })
    .click()
  await expect(
    page.getByRole("heading", { name: "PESO workspace preview" }),
  ).toBeVisible()
})

test("mobile Home, dropdowns, settings and Help have no horizontal overflow", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible()

  await settled(page)
  await expect(page.getByText("Bansud", { exact: false }).first()).toBeVisible()
  await page.screenshot({
    path: info.outputPath("home-mobile.png"),
    fullPage: true,
  })
  await noOverflow(page)
  await axe(page)

  await page.getByRole("textbox", { name: "Search PesoMatch" }).click()
  await noOverflow(page)
  await page.keyboard.press("Escape")

  await page
    .getByRole("button", { name: "Toggle navigation", exact: true })
    .click()
  await page.getByRole("button", { name: "Jobs", exact: true }).click()
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click()
  await expect(page).toHaveURL(/tab=browse/)

  await page.goto("/jobseeker/settings")
  await settled(page)
  await page.screenshot({
    path: info.outputPath("settings-mobile.png"),
    fullPage: true,
  })
  await noOverflow(page)

  await page.goto("/help")
  await settled(page)
  await page.screenshot({
    path: info.outputPath("help-mobile.png"),
    fullPage: true,
  })
  await noOverflow(page)
  await axe(page)
})
