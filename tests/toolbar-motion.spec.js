import { test, expect } from "./fixtures.js"

for (const reduced of [false, true]) {
  test(`toolbar open close conversation animations reduced=${reduced}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    })
    await page.goto("/dashboard")
    await page.evaluate(() => {
      window.surfaceAnimations = []
      new MutationObserver(() => {
        document
          .querySelectorAll(
            ".presence-enter > *, .presence-exit > *, .conversation-enter",
          )
          .forEach((node) => {
            node.getAnimations().forEach((animation) => {
              const name =
                animation.animationName ||
                (animation.effect
                  ?.getKeyframes()
                  .some((frame) => frame.transform === "translateY(16px)")
                  ? "conversation-exit"
                  : "")
              if (name) window.surfaceAnimations.push(name)
            })
          })
      }).observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
      })
    })
    const messages = page.getByRole("button", {
      name: /^Messages, \d+ unread$/,
    })
    await messages.click()
    await expect(
      page.getByRole("region", { name: "Chats", exact: true }),
    ).toBeVisible()
    if (!reduced)
      await expect
        .poll(() => page.evaluate(() => window.surfaceAnimations))
        .toContain("surface-enter")
    await page
      .getByRole("button", {
        name: "Open conversation with Sample PESO Officer",
        exact: true,
      })
      .click()
    const chat = page.getByRole("region", {
      name: "Sample PESO Officer",
      exact: true,
    })
    await expect(chat).toBeVisible()
    if (!reduced) {
      await expect
        .poll(() => page.evaluate(() => window.surfaceAnimations))
        .toContain("surface-exit")
      await expect
        .poll(() => page.evaluate(() => window.surfaceAnimations))
        .toContain("conversation-enter")
    }
    await chat
      .getByRole("button", {
        name: "Close conversation with Sample PESO Officer",
        exact: true,
      })
      .click()
    if (!reduced)
      await expect
        .poll(() => page.evaluate(() => window.surfaceAnimations))
        .toContain("conversation-exit")
    await expect(chat).toHaveCount(0)
    await expect(messages).toBeFocused()
    const notifications = page.getByRole("button", {
      name: /^Notifications, \d+ unread$/,
    })
    await notifications.click()
    await expect(
      page.getByRole("region", { name: "Notifications", exact: true }),
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(
      page.getByRole("region", { name: "Notifications", exact: true }),
    ).toHaveCount(0)
    const profile = page.getByRole("button", {
      name: "Profile options",
      exact: true,
    })
    await profile.click()
    await expect(page.locator("#account-links")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.locator("#account-links")).toHaveCount(0)
    await expect(profile).toBeFocused()
    if (reduced)
      expect(await page.evaluate(() => window.surfaceAnimations)).toEqual([])
  })
}
