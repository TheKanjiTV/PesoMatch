import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

for (const width of [1440, 390, 320])
  for (const route of ["/", "/login", "/register"]) {
    test(`${route} public layout and accessibility ${width}px`, async ({
      page,
    }) => {
      const errors = []

      page.on("pageerror", (error) => errors.push(error.message))

      await page.setViewportSize({ width, height: 960 })

      await page.goto(route)

      await expect(page.locator("h1")).toHaveCount(1)

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

      expect(errors).toEqual([])

      await page.screenshot({
        path: `test-results/screenshots/${route.slice(1) || "landing"}-${width}.png`,
        fullPage: true,
      })
    })
  }
