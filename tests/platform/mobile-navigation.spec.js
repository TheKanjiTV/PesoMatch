import { expect, test } from "@playwright/test"

for (const role of ["jobseeker", "admin"]) {
  test(`mobile navigation for ${role}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname
      return route.fulfill({
        json: path === "/api/v1/auth/user"
          ? {
              user: { id: 900001, name: "Mobile Review", role, dashboard_tour_completed_at: "2026-11-06T00:00:00Z" },
              onboarding: { completed: true, current_step: 5 },
            }
          : path.endsWith("/summary")
            ? { referrals: 0, enrollments: 0, placements: 0, services: 0, saved: [] }
            : { data: [], total: 0, current_page: 1, last_page: 1 },
      })
    })

    await page.goto("/dashboard")
    const nav = page.getByRole("navigation", { name: "Mobile app navigation" })
    const matching = nav.getByRole("link", { name: "Job Matching" })
    const brand = page.locator(".mobile-app-header a")
    await expect(brand).toBeVisible()
    const brandBounds = await brand.boundingBox()
    expect(Math.abs(brandBounds.x + brandBounds.width / 2 - 180)).toBeLessThan(1)
    if (role === "jobseeker") {
      await expect(nav.getByRole("link")).toHaveText(["Home", "Jobs", "Job Matching", "Training"])
      const circle = matching.locator(".app-tab-matching-icon")
      const bounds = await circle.boundingBox()
      const bar = await nav.boundingBox()
      expect(bounds.width).toBeGreaterThanOrEqual(44)
      expect(bounds.y).toBeLessThan(bar.y)
      expect(Math.abs(bounds.x + bounds.width / 2 - 180)).toBeLessThan(1)
      await page.screenshot({ path: testInfo.outputPath("mobile-navigation.png") })
      await matching.click()
      await expect(page).toHaveURL(/\/matches$/)
      await expect(matching).toHaveAttribute("aria-current", "page")
    } else {
      await expect(matching).toHaveCount(0)
      await expect(nav.getByRole("link", { name: "Account" })).toBeVisible()
    }
    await nav.getByRole("button", { name: "Open all services" }).click()
    await expect(page.locator("#service-drawer")).toBeVisible()
  })
}


test("Install PESO centers the brand on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await page.goto("/app")
  const brand = page.locator("header").getByRole("link", { name: "PESO employment services home" })
  await expect(brand).toBeVisible()
  const bounds = await brand.boundingBox()
  expect(Math.abs(bounds.x + bounds.width / 2 - 180)).toBeLessThan(1)
})
