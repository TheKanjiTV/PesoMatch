import { test, expect, apiCall } from "./fixtures.js"

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
}

async function contained(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

async function accessible(page) {
  const result = await new AxeBuilder({ page })

    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

    .analyze()

  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target)}`),
  ).toEqual([])
}

for (const width of [1440, 390]) {
  test(`activity panels align with their own icons and remain contained ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 960 })

    await page.goto("/dashboard")

    for (const [buttonName, panelName] of [
      [/^Notifications,/, "Notifications"],

      [/^Messages,/, "Chats"],
    ]) {
      const trigger = page.getByRole("button", { name: buttonName })

      await trigger.click()

      const panel = page.getByRole("region", { name: panelName, exact: true })

      await expect(panel).toBeVisible()

      await settled(page)

      if (width >= 640) {
        const a = await trigger.boundingBox(),
          b = await panel.boundingBox()

        expect(Math.abs(a.x + a.width - b.x - b.width)).toBeLessThanOrEqual(1)

        expect(b.y).toBeGreaterThan(a.y + a.height)
      }

      await contained(page)

      await accessible(page)

      await page.screenshot({
        path: info.outputPath(`${panelName}-${width}.png`),
      })

      await page.keyboard.press("Escape")

      await expect(trigger).toBeFocused()
    }
  })

  test(`original posters, arrow gallery and Home refresh work ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 960 })

    await page.goto("/dashboard")

    const feed = page.getByRole("region", { name: "Employment updates" })

    await expect(feed.getByRole("article")).toHaveCount(2)

    await settled(page)

    await page.screenshot({
      path: info.outputPath(`home-${width}.png`),
      fullPage: true,
    })

    const mandaluyong = page.getByRole("article", {
      name: "In-house job interviews",

      exact: true,
    })

    await mandaluyong

      .getByRole("button", { name: /^Open announcement photo 1:/ })

      .click()

    const gallery = page.getByRole("dialog", { name: "Announcement photos" })

    await expect(gallery).toBeVisible()

    await expect(gallery.getByRole("img")).toHaveAttribute(
      "src",

      "/images/announcements/poster13.png",
    )

    await gallery

      .getByRole("button", { name: "Next photo", exact: true })

      .click()

    await expect(gallery.getByRole("img")).toHaveAttribute(
      "src",

      "/images/announcements/poster14.png",
    )

    await page.keyboard.press("ArrowLeft")

    await expect(gallery.getByRole("img")).toHaveAttribute(
      "src",

      "/images/announcements/poster13.png",
    )

    await page.keyboard.press("Escape")

    const paranaque = page.getByRole("article", { name: /Jobs Fair/ })

    await paranaque

      .getByRole("button", { name: /^Open announcement photo 1:/ })

      .click()

    const displayed = gallery.getByRole("img")

    await expect(displayed).toHaveAttribute(
      "src",

      "/images/announcements/poster.png",
    )

    await expect

      .poll(() =>
        displayed.evaluate((img) => img.complete && img.naturalWidth > 0),
      )

      .toBe(true)

    await expect(
      gallery.getByText(/Text summary of the supplied poster/),
    ).toHaveCount(0)

    await expect(gallery.getByText(/^\d+ of \d+$/)).toHaveCount(0)

    if (width > 1024) {
      const image = await displayed.boundingBox(),
        details = await gallery

          .getByRole("complementary", { name: "Announcement details" })

          .boundingBox()

      expect(details.x).toBeGreaterThanOrEqual(image.x + image.width)
    }

    await settled(page)

    await accessible(page)

    await contained(page)

    await page.screenshot({ path: info.outputPath(`gallery-${width}.png`) })

    for (const name of [
      "poster1",

      "poster3",

      "poster4",

      "poster5",

      "poster6",

      "poster7",

      "poster8",

      "poster9",

      "poster10",

      "poster11",

      "poster12",
    ]) {
      await gallery

        .getByRole("button", { name: "Next photo", exact: true })

        .click()

      await expect(displayed).toHaveAttribute(
        "src",

        `/images/announcements/${name}.png`,
      )
    }

    await gallery

      .getByRole("button", { name: "Close announcement photos" })

      .click()

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    )

    await page

      .getByRole("link", { name: "PesoMatch Home", exact: true })

      .click()

    await expect(
      page.getByRole("status").filter({ hasText: "Refreshing posts" }),
    ).toBeVisible()

    await expect(feed.getByRole("article")).toHaveCount(3)

    expect(await page.evaluate(() => scrollY)).toBeLessThan(10)

    await expect(feed.getByRole("article").first()).toHaveAttribute(
      "aria-label",

      "J.G. Manpower Corp.",
    )

    await page

      .getByRole("link", { name: "View Details", exact: true })

      .first()

      .click()

    await expect(page).toHaveURL(/feed\/palscon-employer-1/)

    await expect(
      page

        .getByRole("heading", { name: "J.G. Manpower Corp.", exact: true })

        .first(),
    ).toBeVisible()
  })

  test(`joined settings, profile links and standalone Help/Admin Center ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 960 })

    await page.goto("/jobseeker/settings")
    const savedProfile = await apiCall(
      page.request,
      "/api/jobseeker/onboarding",
    )
    expect(savedProfile.status()).toBe(200)
    const expectedName = (await savedProfile.json()).data.personal.first_name

    await expect(
      page.getByRole("button", { name: "People you unfollowed", exact: true }),
    ).toHaveCount(0)

    await page

      .getByRole("button", { name: "Sign in & security", exact: true })

      .click()

    await expect(
      page.getByRole("button", { name: "Phone numbers", exact: true }),
    ).toHaveCount(0)

    await page

      .getByRole("button", { name: "Data privacy", exact: true })

      .click()

    await expect(
      page.getByRole("button", { name: "People you unfollowed", exact: true }),
    ).toHaveCount(0)

    await page

      .getByRole("button", { name: "Account preferences", exact: true })

      .click()

    await settled(page)

    await contained(page)

    await accessible(page)

    await page.screenshot({
      path: info.outputPath(`settings-${width}.png`),

      fullPage: true,
    })

    for (const label of [
      "Name, location and industry",

      "Personal information",
    ]) {
      await page.getByRole("link", { name: label, exact: true }).click()

      const dialog = page.getByRole("dialog", {
        name: "Edit Profile",

        exact: true,
      })

      await expect(
        dialog.getByRole("textbox", { name: "First Name", exact: true }),
      ).toHaveValue(expectedName)

      await page.keyboard.press("Escape")

      await expect(page).not.toHaveURL(/edit=/)

      await expect(dialog).toHaveCount(0)

      await page
        .getByRole("button", { name: "Edit Profile", exact: true })
        .click()

      await expect(dialog).toBeVisible()

      await page.keyboard.press("Escape")

      await page.goto("/jobseeker/settings")
    }

    for (const route of ["/help", "/business/admin-center"]) {
      await page.goto(route)

      await expect(
        page.getByRole("navigation", { name: "Workspace navigation" }),
      ).toHaveCount(0)

      const homeBack = page.getByRole("link", {
        name: "Back to the Home",
        exact: true,
      })
      if (route === "/help")
        await expect(homeBack).toHaveAttribute("href", "/dashboard")
      else await expect(homeBack).toHaveCount(0)

      await settled(page)

      await contained(page)

      await accessible(page)

      await page.screenshot({
        path: info.outputPath(
          `${route === "/help" ? "help" : "admin-center"}-${width}.png`,
        ),

        fullPage: true,
      })
    }

    await page.goto("/jobs?tab=recommended")

    await expect(
      page.getByText(
        /These fixed demo matches|Explore opportunities, review your recommendations/,
      ),
    ).toHaveCount(0)

    await page.goto("/training")

    await expect(
      page.getByText(/Explore training opportunities that may help strengthen/),
    ).toHaveCount(0)

    expect(
      await page

        .getByRole("link", { name: "Back to Home", exact: true })

        .count(),
    ).toBe(0)
  })
}
