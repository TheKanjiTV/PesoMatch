import { test, expect } from "./fixtures.js"
import AxeBuilder from "@axe-core/playwright"

async function checks(page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    ),
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(
    result.violations.map(
      (item) => `${item.id}: ${item.nodes.map((n) => n.target)}`,
    ),
  ).toEqual([])
}

for (const width of [1440, 390]) {
  test(`Admin Center picture slideshow, features, resources and support ${width}px`, async ({
    page,
  }, info) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/business/admin-center")
    await expect(
      page.getByRole("navigation", { name: "Workspace navigation" }),
    ).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Back to the Home", exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: /Welcome to/ }),
    ).toBeVisible()
    const player = page.getByRole("region", {
      name: "Animated Staff Portal tutorial",
    })
    await player
      .getByRole("button", { name: "Pause tutorial slideshow" })
      .click()
    await expect(
      player.getByRole("button", { name: "Play tutorial slideshow" }),
    ).toBeVisible()
    for (const filename of ["review", "coordination", "updates", "queue"]) {
      await player.getByRole("button", { name: "Next tutorial slide" }).click()
      await expect(player.getByRole("img")).toHaveAttribute(
        "src",
        `/images/admin-guide/${filename}.png`,
      )
      expect(
        await player
          .getByRole("img")
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      ).toBe(true)
    }
    await checks(page)
    await page.screenshot({
      path: info.outputPath(`admin-center-${width}.png`),
      fullPage: true,
    })
    const enlarge = player.getByRole("button", {
      name: /^Enlarge tutorial picture:/,
    })
    await enlarge.click()
    const viewer = page.getByRole("dialog", {
      name: "Staff Portal picture guide",
    })
    await expect(viewer).toBeVisible()
    await viewer.getByRole("button", { name: "Next guide picture" }).click()
    await expect(viewer.getByRole("img")).toHaveAttribute(
      "src",
      "/images/admin-guide/review.png",
    )
    await page.keyboard.press("ArrowLeft")
    await expect(viewer.getByRole("img")).toHaveAttribute(
      "src",
      "/images/admin-guide/queue.png",
    )
    await checks(page)
    await page.screenshot({
      path: info.outputPath(`picture-viewer-${width}.png`),
    })
    await page.keyboard.press("Escape")
    await expect(viewer).toHaveCount(0)
    await expect(enlarge).toBeFocused()
    const tab = page.getByRole("tab", {
      name: "Review the profile",
      exact: true,
    })
    await tab.click()
    await expect(tab).toHaveAttribute("aria-selected", "true")
    await expect(page.getByRole("tabpanel").getByRole("img")).toHaveAttribute(
      "src",
      "/images/admin-guide/review.png",
    )
    await page.keyboard.press("ArrowRight")
    await expect(
      page.getByRole("tab", { name: "Coordinate & follow up" }),
    ).toBeFocused()
    await page
      .getByRole("button", {
        name: "Open Jobseeker updates guide",
        exact: true,
      })
      .click()
    await expect(viewer.getByRole("img")).toHaveAttribute(
      "src",
      "/images/admin-guide/updates.png",
    )
    await page.keyboard.press("Escape")
    await page
      .getByRole("button", { name: "Contact support", exact: true })
      .click()
    await expect(
      page.getByRole("textbox", { name: "Support message" }),
    ).toBeFocused()
    await page
      .getByRole("textbox", { name: "Support message" })
      .fill("Help with referrals")
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
      .getByRole("button", { name: "Contact support", exact: true })
      .click()
    await expect(
      page.getByText("Help with referrals", { exact: true }),
    ).toBeVisible()
    await checks(page)
    expect(errors).toEqual([])
  })

  test(`Settings shorter sections have no white bottom extension ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 960 })
    await page.goto("/jobseeker/settings?section=notifications")
    for (const label of ["Notifications", "Visibility"]) {
      await page.getByRole("button", { name: label, exact: true }).click()
      const root = page
        .getByRole("navigation", { name: "Settings categories" })
        .locator("../..")
      const aside = await root.locator(":scope > aside").boundingBox()
      const content = await root.locator(":scope > div").boundingBox()
      if (width >= 1024)
        expect(
          Math.abs(aside.y + aside.height - content.y - content.height),
        ).toBeLessThan(1)
      await checks(page)
      await page.screenshot({
        path: info.outputPath(`${label.toLowerCase()}-${width}.png`),
        fullPage: true,
      })
    }
  })
}

test("tutorial autoplay advances, pauses, and respects reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/business/admin-center")
  const player = page.getByRole("region", {
    name: "Animated Staff Portal tutorial",
  })
  await expect(player.getByRole("img")).toHaveAttribute(
    "src",
    "/images/admin-guide/queue.png",
  )
  await expect(
    player.getByRole("button", { name: "Pause tutorial slideshow" }),
  ).toBeVisible()
  await page.clock.install()
  await page.clock.runFor(7500)
  await expect(player.getByRole("img")).toHaveAttribute(
    "src",
    "/images/admin-guide/review.png",
  )
  await player.getByRole("button", { name: "Pause tutorial slideshow" }).click()
  await page.mouse.move(0, 0)
  await page.getByRole("heading", { name: /Welcome to/ }).click()
  await page.clock.runFor(15000)
  await expect(player.getByRole("img")).toHaveAttribute(
    "src",
    "/images/admin-guide/review.png",
  )
  await player.getByRole("button", { name: "Play tutorial slideshow" }).click()
  await page.clock.runFor(7500)
  await expect(player.getByRole("img")).toHaveAttribute(
    "src",
    "/images/admin-guide/coordination.png",
  )
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.reload()
  await expect(
    player.getByRole("button", { name: "Play tutorial slideshow" }),
  ).toBeVisible()
  await page.clock.runFor(15000)
  await expect(player.getByRole("img")).toHaveAttribute(
    "src",
    "/images/admin-guide/queue.png",
  )
  await expect(player.locator(".guide-focus")).toHaveCount(0)
})
