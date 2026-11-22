import { test, expect } from "./helpers.js"

test("Android companion browser session works on the local mobile platform", async ({
  browser,
  account,
}) => {
  const origin = process.env.PESO_MOBILE_ORIGIN
  test.skip(
    !origin,
    "Run with PESO_MOBILE_ORIGIN and pnpm mobile:preview for the LAN session check.",
  )
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 PESOAndroid/1.1.0",
    storageState: { cookies: [], origins: [] },
  })
  try {
    const page = await context.newPage()
    await page.goto(`${origin}/login`)
    await page.getByLabel("Email Address").fill(account.email)
    await page
      .getByLabel("Password", { exact: false })
      .first()
      .fill(account.password)
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/api/v1/auth/login")),
      page.getByRole("button", { name: "Log In", exact: true }).click(),
    ])
    expect(response.status()).toBe(200)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(
      page.getByRole("navigation", { name: "Mobile app navigation" }),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Install", exact: true }),
    ).toHaveCount(0)
    await page
      .getByRole("navigation", { name: "Mobile app navigation" })
      .getByRole("link", { name: "Training", exact: true })
      .click()
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Training",
    )
    await expect(
      page.getByRole("status").filter({ hasText: /^Loading/ }),
    ).toHaveCount(0)
    await page
      .getByRole("button", { name: "Toggle service navigation" })
      .click()
    await page.getByRole("button", { name: "Sign out", exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
  } finally {
    await context.close()
  }
})
