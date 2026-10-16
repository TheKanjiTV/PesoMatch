import { mkdir } from "node:fs/promises"
import { test, expect } from "./fixtures.js"

// Explicit regeneration only; these captures contain isolated demo records.
test("capture Staff Portal tutorial pictures", async ({ page }) => {
  test.skip(process.env.CAPTURE_ADMIN_GUIDE !== "1", "Asset regeneration only")
  await mkdir("public/images/admin-guide", { recursive: true })
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/peso/dashboard")
  await page
    .getByRole("button", { name: "Preview PESO Staff", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Staff Dashboard", exact: true }),
  ).toBeVisible()
  const shots = [
    ["/peso/assistance", "Employment Assistance", "queue"],
    ["/peso/assistance/PESO-DEMO-003", "Employment Assistance", "review"],
    ["/peso/assistance/PESO-DEMO-001", "Employment Assistance", "coordination"],
    [
      "/peso/assistance/PESO-DEMO-001/public",
      "Jobseeker Update Preview",
      "updates",
    ],
  ]
  for (const [route, heading, filename] of shots) {
    await page.goto(route)
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: `public/images/admin-guide/${filename}.png` })
  }
})
