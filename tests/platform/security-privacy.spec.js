import { test as publicTest, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { test, apiCall, provision } from "./helpers.js"

async function accessible(page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  )
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze()
  expect(
    result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

publicTest(
  "legal drafts have accessible notices, cookies and enforced preview headers",
  async ({ page, request }) => {
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /Content Security Policy|violates.*directive/i.test(m.text())
      )
        errors.push(m.text())
    })
    for (const theme of ["hc1", "hc2"]) {
      await page.addInitScript(
        (theme) =>
          localStorage.setItem("peso-appearance", JSON.stringify({ theme })),
        theme,
      )
      await page.setViewportSize({ width: 390, height: 844 })
      for (const route of ["/privacy", "/terms", "/cookies"]) {
        const response = await page.goto(route)
        expect(response.headers()["x-content-type-options"]).toBe("nosniff")
        expect(response.headers()["content-security-policy"]).toContain(
          "frame-ancestors 'none'",
        )
        expect(response.headers()["content-security-policy"]).not.toContain(
          "'unsafe-eval'",
        )
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await expect(page.locator("html")).toHaveAttribute(
          "data-contrast",
          theme,
        )
        await accessible(page)
      }
    }
    const auth = await request.get("/api/v1/auth/user")
    expect(auth.status()).toBe(401)
    expect(auth.headers()["cache-control"]).toContain("no-store")
    expect(auth.headers()["x-frame-options"]).toBe("DENY")
    expect(errors).toEqual([])
  },
)

test("privacy requests stay scoped, render hostile text safely and support keyboard review", async ({
  page,
  account,
}) => {
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/settings")
  await expect(
    page.getByRole("heading", { name: "Your privacy requests", exact: true }),
  ).toBeVisible()
  const opener = page.getByRole("button", {
    name: "Make a privacy request",
    exact: true,
  })
  await opener.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByLabel("Request type")).toBeFocused()
  await page.getByLabel("Request type").selectOption("correction")
  const hostile = '<img src=x onerror="window.__privacyXss=1">'
  await page.getByLabel("Details (optional)").fill(hostile)
  await page.getByRole("button", { name: "Save record" }).click()
  await expect(page.getByText(hostile, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__privacyXss)).toBeUndefined()
  await accessible(page)
  expect(
    (
      await apiCall(account.request, "/api/v1/privacy/requests?scope=all")
    ).status(),
  ).toBe(403)
  provision(account.email, "admin")
  // Role provisioning revokes sessions, requiring a fresh login.
  expect(
    (
      await apiCall(account.request, "/api/v1/auth/login", "POST", {
        email: account.email,
        password: account.password,
      })
    ).status(),
  ).toBe(200)
  await page.context().clearCookies()
  await page
    .context()
    .addCookies((await account.request.storageState()).cookies)
  await page.goto("/users")
  await expect(
    page.getByRole("heading", { name: "Privacy request review", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Review request", exact: true })
    .click()
  await page.getByLabel("Review status").selectOption("in_review")
  await page
    .getByLabel("Response and action taken")
    .fill("Reviewing the requested correction; no deletion performed.")
  await page.getByRole("button", { name: "Save record" }).click()
  await expect(
    page.getByText("Privacy response recorded.", { exact: true }),
  ).toBeVisible()
  await accessible(page)
  expect(errors).toEqual([])
})

publicTest(
  "registration sends explicit terms acknowledgement and an empty bot field",
  async ({ page }) => {
    let payload
    await page.route("**/api/v1/auth/register", async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Audit form verification only.",
          errors: { email: ["Audit form verification only."] },
        }),
      })
    })
    await page.goto("/register")
    await page
      .getByRole("textbox", { name: "First Name", exact: true })
      .fill("Audit")
    await page
      .getByRole("textbox", { name: "Last Name", exact: true })
      .fill("Tester")
    await page
      .getByRole("textbox", { name: "Email Address", exact: true })
      .fill("audit@example.test")
    await page
      .getByRole("textbox", { name: "Mobile Number", exact: true })
      .fill("9171234567")
    await page.getByLabel(/^Create Password/).fill("Audit-Password-123!")
    await page.getByLabel(/^Confirm Password/).fill("Audit-Password-123!")
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: /Create.*Account/i }).click()
    await expect.poll(() => payload?.terms_accepted).toBe(true)
    expect(payload.website).toBe("")
    await expect(
      page.getByText("Audit form verification only.").first(),
    ).toBeVisible()
  },
)
