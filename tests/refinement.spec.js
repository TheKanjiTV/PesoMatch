import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

for (const width of [1440, 390]) {
  test(`first visit tour keyboard, persistence and replay ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })

    await page.goto("/dashboard?tour=1")

    const tour = page.getByRole("dialog", {
      name: "Your dashboard",

      exact: true,
    })

    await expect(tour).toBeVisible()

    expect(
      (
        await new AxeBuilder({ page })

          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

          .analyze()
      ).violations,
    ).toEqual([])

    await page.screenshot({
      path: `test-results/screenshots/tour-${width}.png`,
    })

    for (let i = 0; i < 8; i++) {
      const dialog = page.getByRole("dialog")

      await dialog.getByRole("button", { name: "Next", exact: true }).click()

      await expect(dialog.locator('[lang="fil"]')).toBeVisible()

      await page.keyboard.press("Tab")

      expect(
        await page.evaluate(() =>
          document

            .querySelector("dialog[open]")

            .contains(document.activeElement),
        ),
      ).toBe(true)
    }

    await page.getByRole("button", { name: "Finish Tour", exact: true }).click()

    await page.reload()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    await page.goto("/dashboard?tour=1")

    await expect(page.getByRole("dialog")).toBeVisible()

    await page.keyboard.press("Escape")

    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
}

test("landing active underline follows click, scroll and account transition", async ({
  page,
}) => {
  await page.goto("/")

  const nav = page.getByRole("navigation", {
    name: "Main navigation",

    exact: true,
  })

  await nav.getByRole("link", { name: "Jobs", exact: true }).click()

  await expect(
    nav.getByRole("link", { name: "Jobs", exact: true }),
  ).toHaveAttribute("aria-current", "location")

  await page

    .locator("#training")

    .evaluate((el) => el.scrollIntoView({ behavior: "instant" }))

  await expect(
    nav.getByRole("link", { name: "Training", exact: true }),
  ).toHaveAttribute("aria-current", "location")

  await page.evaluate(() => {
    window.transitionCalls = 0

    window.pageMotion = []

    const original = document.startViewTransition.bind(document)

    document.startViewTransition = (...args) => {
      window.transitionCalls++

      const transition = original(...args)

      transition.ready

        .then(() => {
          window.pageMotion.push({
            direction: document.documentElement.dataset.pageTransition,

            frames: document

              .getAnimations()

              .filter((animation) =>
                [
                  "page-exit-left",

                  "page-enter-left",

                  "page-exit-right",

                  "page-enter-right",
                ].includes(animation.animationName),
              )

              .map((animation) => ({
                name: animation.animationName,

                duration: animation.effect.getTiming().duration,

                frames: animation.effect.getKeyframes(),
              })),
          })
        })

        .catch(() => {})

      return transition
    }
  })

  await page.getByRole("link", { name: "Log In", exact: true }).first().click()

  await expect(page).toHaveURL(/\/login$/)

  expect(await page.evaluate(() => window.transitionCalls)).toBe(1)

  const checkPageMotion = async (direction) => {
    await expect

      .poll(() => page.evaluate(() => window.pageMotion.at(-1)?.direction))

      .toBe(direction)

    const motion = await page.evaluate(() => window.pageMotion.at(-1).frames)

    expect(motion).toHaveLength(2)

    const exit = motion.find((item) => item.name.startsWith("page-exit"))

    const enter = motion.find((item) => item.name.startsWith("page-enter"))

    expect(exit.duration).toBe(400)

    expect(enter.duration).toBe(400)

    expect(exit.frames.at(-1).opacity).toBe("0")

    expect(exit.frames.at(-1).transform).toBe(
      `translateX(${direction === "back" ? 24 : -24}px)`,
    )

    expect(enter.frames[0].opacity).toBe("0")

    expect(enter.frames[0].transform).toBe(
      `translateX(${direction === "back" ? -24 : 24}px)`,
    )
  }

  await checkPageMotion("forward")

  await page.emulateMedia({ reducedMotion: "reduce" })

  expect(
    await page.evaluate(
      () =>
        getComputedStyle(
          document.documentElement,

          "::view-transition-new(root)",
        ).animationName,
    ),
  ).toBe("none")

  await page.getByRole("link", { name: /Create.*account/i }).click()

  await expect(page).toHaveURL(/\/register$/)

  const phone = page.getByLabel("Mobile Number", { exact: false })

  await phone.fill("abc9123-def4567899")

  await expect(phone).toHaveValue("912 345 6789")

  await page.emulateMedia({ reducedMotion: "no-preference" })

  await page.getByRole("link", { name: "Back to Home", exact: true }).click()

  await expect(page).toHaveURL(/\/home$/)

  await expect(page.locator("html")).toHaveAttribute(
    "data-page-transition",

    "back",
  )

  await checkPageMotion("back")

  await page

    .getByRole("navigation", { name: "Main navigation", exact: true })

    .getByRole("link", { name: "Jobs", exact: true })

    .click()

  await expect(page.locator("html")).not.toHaveAttribute("data-page-transition")
})

test("saved jobs, demo assistance, training bookmarks and message undo", async ({
  page,
}) => {
  test.setTimeout(120000)

  await page.goto("/jobseeker/jobs/customer-service")

  await page.getByRole("button", { name: "Save Job", exact: true }).click()

  await page.getByRole("button", { name: "Undo", exact: true }).click()

  await expect(
    page.getByRole("button", { name: "Save Job", exact: true }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Save Job", exact: true }).click()

  const jobsToggle = page.getByRole("button", { name: "Jobs", exact: true })

  if ((await jobsToggle.getAttribute("aria-expanded")) === "false")
    await jobsToggle.click()

  await page

    .getByRole("navigation", { name: "Workspace navigation" })

    .getByRole("link", { name: "Saved Jobs", exact: true })

    .click()

  await expect(page.getByLabel("Job results").locator("article")).toHaveCount(1)

  await page

    .getByLabel("Job results")

    .getByRole("link", {
      name: "View Customer Service Representative",

      exact: true,
    })

    .click()

  await page

    .getByRole("button", { name: "Request PESO Assistance", exact: true })

    .click()

  const dialog = page.getByRole("dialog")

  await expect(
    dialog.getByRole("button", { name: "Submit Request" }),
  ).toBeDisabled()

  await dialog.getByRole("checkbox").check()

  await dialog.getByRole("button", { name: "Submit Request" }).click()

  await page

    .getByRole("link", { name: "View Assistance Status", exact: true })

    .click()

  await expect(
    page.getByRole("heading", { name: "Assistance Details", exact: true }),
  ).toBeVisible()

  await page.goto("/jobseeker/training/excel")

  await page

    .getByRole("button", { name: "Bookmark Training", exact: true })

    .first()

    .click()

  await expect(
    page.getByRole("button", { name: "Saved", exact: true }).first(),
  ).toHaveAttribute("aria-pressed", "true")

  await page.goto("/jobseeker/messages")

  await page

    .getByRole("textbox", { name: "Your message", exact: true })

    .fill("This is a sample reply")

  await page.getByRole("button", { name: "Send Demo Message" }).click()

  await expect(
    page

      .getByRole("region", { name: "Conversation", exact: true })

      .getByText("This is a sample reply", { exact: true }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Undo", exact: true }).click()

  await expect(
    page.getByRole("textbox", { name: "Your message", exact: true }),
  ).toHaveValue("This is a sample reply")
})

test("job grid pagination, entire card navigation and applied filters", async ({
  page,
}) => {
  await page.goto("/jobs?tab=browse")

  await expect(
    page.getByRole("button", { name: "Jobs", exact: true }),
  ).toHaveClass(/bg-secondary/)

  await page.getByRole("button", { name: "Next", exact: true }).click()

  const first = page.getByLabel("Job results").locator("article").first()

  const title = await first.getByRole("heading").textContent()

  await first.click({ position: { x: 5, y: 5 } })

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title)

  await expect(
    page.getByRole("button", { name: "Request PESO Assistance", exact: true }),
  ).toBeVisible()

  await page.getByRole("link", { name: "Back to Jobs", exact: true }).click()

  const filters = page.getByRole("form", { name: "Job filters", exact: true })

  await filters

    .getByLabel("Job Category", { exact: true })

    .selectOption("Customer Service")

  await filters

    .getByRole("button", { name: "Apply Filters", exact: true })

    .click()

  await expect(
    page.getByLabel("Job results").locator("article"),
  ).not.toHaveCount(0)

  await expect(
    page.getByRole("tab", { name: "Browse All Jobs", exact: true }),
  ).toHaveAttribute("aria-selected", "true")
})
