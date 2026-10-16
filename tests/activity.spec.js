import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

for (const width of [1440, 390, 320]) {
  test(`nonmodal activity panels and bottom conversation ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })

    await page.goto("/dashboard")

    const trigger = page.getByRole("button", { name: /^Messages, \d+ unread$/ })

    await trigger.click()

    const chats = page.getByRole("region", { name: "Chats", exact: true })

    await expect(chats).toBeVisible()

    const dropdown = await chats.boundingBox()

    expect(dropdown.y + dropdown.height).toBeLessThanOrEqual(900)

    await expect(page.locator("dialog[open]")).toHaveCount(0)

    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
      "hidden",
    )

    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    await chats.getByRole("button", { name: "Unread", exact: true }).click()

    await expect(
      chats.getByRole("button", { name: /^Open conversation/ }),
    ).toHaveCount(2)

    await chats.getByRole("button", { name: "All", exact: true }).click()

    await chats

      .getByRole("textbox", { name: "Search conversations" })

      .fill("training")

    await expect(
      chats.getByRole("button", { name: /^Open conversation/ }),
    ).toHaveCount(1)

    await chats.getByRole("textbox", { name: "Search conversations" }).fill("")

    await page.screenshot({
      path: `test-results/screenshots/chats-dropdown-${width}.png`,
    })

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await chats

      .getByRole("button", {
        name: "Open conversation with Sample PESO Officer",

        exact: true,
      })

      .click()

    await expect(chats).toHaveCount(0)

    const chat = page.getByRole("region", {
      name: "Sample PESO Officer",

      exact: true,
    })

    await expect(chat).toBeVisible()

    const input = chat.getByRole("textbox", {
      name: "Message to Sample PESO Officer",
    })

    await expect(input).toBeFocused()

    // Measure the dock at rest, after its requested 16px entrance has finished.
    await expect
      .poll(async () => {
        const box = await chat.boundingBox()
        return Math.round(box.y + box.height)
      })
      .toBe(900)

    await input.fill("A local demo reply")

    await chat

      .getByRole("button", { name: "Send demo message to Sample PESO Officer" })

      .click()

    await expect(chat.getByRole("log")).toContainText("A local demo reply")

    await chat.getByRole("button", { name: "Undo", exact: true }).click()

    await expect(input).toHaveValue("A local demo reply")

    await chat

      .getByRole("button", {
        name: "Minimize conversation with Sample PESO Officer",
      })

      .click()

    await expect(input).toHaveCount(0)

    await trigger.click()

    await chats

      .getByRole("button", {
        name: "Open conversation with Sample PESO Officer",

        exact: true,
      })

      .click()

    await expect(input).toBeVisible()

    await expect(input).toHaveValue("A local demo reply")

    await page.screenshot({
      path: `test-results/screenshots/bottom-chat-${width}.png`,
    })

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await page

      .getByRole("banner")

      .getByRole("link", { name: /PesoMatch/ })

      .click()

    await expect(chat).toBeVisible()

    await chat

      .getByRole("button", {
        name: "Close conversation with Sample PESO Officer",
      })

      .click()

    await expect(chat).toHaveCount(0)

    await expect(trigger).toBeFocused()

    const bell = page.getByRole("button", {
      name: /^Notifications, \d+ unread$/,
    })

    await bell.click()

    const notifications = page.getByRole("region", {
      name: "Notifications",

      exact: true,
    })

    await expect(notifications).toBeVisible()

    const updates = await notifications.boundingBox()

    expect(updates.y + updates.height).toBeLessThanOrEqual(900)

    await expect(
      notifications.getByRole("heading", { name: "New", exact: true }),
    ).toBeVisible()

    await expect(
      notifications.getByRole("heading", { name: "Earlier", exact: true }),
    ).toBeVisible()

    await page.screenshot({
      path: `test-results/screenshots/notifications-dropdown-${width}.png`,
    })

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await notifications

      .getByRole("button", { name: "Unread", exact: true })

      .click()

    await expect(
      notifications.getByRole("link", { name: /Profile Updated/ }),
    ).toHaveCount(0)

    await notifications

      .getByRole("button", { name: "Mark all read", exact: true })

      .click()

    await expect(notifications.getByText("You're all caught up.")).toBeVisible()

    await page.getByRole("button", { name: "Undo", exact: true }).click()

    await bell.click()

    await page.keyboard.press("Escape")

    await expect(notifications).toHaveCount(0)

    await expect(bell).toBeFocused()

    await bell.click()

    await notifications.getByRole("link", { name: /New Job Match/ }).click()

    await expect(page).toHaveURL(/jobs\/customer-service$/)

    await expect(notifications).toHaveCount(0)

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false)
  })
}

test("multiple bottom chats survive workspace navigation and share drafts with inbox", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto("/dashboard")

  const trigger = page.getByRole("button", { name: /^Messages, \d+ unread$/ })

  for (const sender of [
    "Sample PESO Officer",

    "Sample Training Desk",

    "Sample Employer",
  ]) {
    await trigger.click()

    await page

      .getByRole("button", {
        name: `Open conversation with ${sender}`,

        exact: true,
      })

      .click()
  }

  const windows = page

    .getByRole("region")

    .filter({ has: page.getByRole("button", { name: /^Close conversation/ }) })

  await expect(windows).toHaveCount(3)

  await page.screenshot({ path: "test-results/screenshots/multiple-chats.png" })

  await page

    .getByRole("textbox", { name: "Message to Sample PESO Officer" })

    .fill("Keep this draft")

  await page

    .getByRole("navigation", { name: "Workspace navigation", exact: true })

    .getByRole("link", { name: "Browse Training", exact: true })

    .click()

  await expect(windows).toHaveCount(3)

  await page

    .getByRole("button", {
      name: "Close conversation with Sample PESO Officer",
    })

    .click()

  await page

    .getByRole("navigation", { name: "Workspace navigation", exact: true })

    .getByRole("link", { name: "Messages", exact: true })

    .click()

  await expect(
    page.getByRole("textbox", { name: "Your message", exact: true }),
  ).toHaveValue("Keep this draft")
})
