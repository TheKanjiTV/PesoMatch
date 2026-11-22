import fs from "node:fs/promises"
import { test, expect, apiCall, provisionAndSignIn } from "./helpers.js"

test("account history records real authentication and appears in the admin audit on desktop and mobile", async ({
  page,
  account,
}) => {
  await provisionAndSignIn(account, page, "admin")
  expect(
    (await apiCall(page.request, "/api/v1/auth/logout", "POST")).status(),
  ).toBe(200)
  expect(
    (
      await apiCall(page.request, "/api/v1/auth/login", "POST", {
        email: account.email,
        password: "wrong-password",
      })
    ).status(),
  ).toBe(422)
  expect(
    (
      await apiCall(page.request, "/api/v1/auth/login", "POST", {
        email: account.email,
        password: account.password,
      })
    ).status(),
  ).toBe(200)
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await fs.mkdir("artifacts/account-history", { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/settings")
    const history = page.getByRole("region", {
      name: "Account history",
      exact: true,
    })
    await expect(history.getByRole("table")).toBeVisible({ timeout: 30000 })
    const rows = history.locator("tbody tr")
    await expect(rows.first()).toContainText("Login")
    await expect(
      history.getByRole("cell", { name: "Logout", exact: true }),
    ).toBeVisible()
    await expect(
      history.getByRole("cell", { name: "Failed login", exact: true }),
    ).toBeVisible()
    await expect(history.locator("time").first()).toHaveAttribute(
      "datetime",
      /\+08:00$/,
    )
    await history.getByRole("button", { name: "Refresh history" }).click()
    await expect(history.getByRole("table")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await history.screenshot({
      path: `artifacts/account-history/settings-${width}.png`,
    })
    await page.goto("/audit")
    const audit = page
      .locator("tbody tr")
      .filter({
        has: page.getByRole("cell", {
          name: `users #${account.user.id}`,
          exact: true,
        }),
      })
    await expect(audit.filter({ hasText: "auth.login_failed" })).toContainText(
      account.user.name,
    )
    await expect(audit.filter({ hasText: "auth.logout" })).toBeVisible()
    await audit
      .filter({ hasText: "auth.login_failed" })
      .getByText("View details", { exact: true })
      .click()
    await expect(
      audit.filter({ hasText: "auth.login_failed" }).locator("pre"),
    ).toContainText("ip_address")
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page
      .locator("main")
      .screenshot({ path: `artifacts/account-history/audit-${width}.png` })
  }
  expect(errors).toEqual([])
})

test("account history recovers from a load error and paginates", async ({
  page,
}) => {
  let fail = true
  await page.route("**/api/v1/auth/history?*", async (route) => {
    if (fail) {
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unavailable" }),
      })
    }
    const pageNumber = Number(
      new URL(route.request().url()).searchParams.get("page"),
    )
    await route.fulfill({
      json: {
        current_page: pageNumber,
        last_page: 2,
        total: 2,
        data: [
          {
            id: pageNumber,
            action: pageNumber === 1 ? "auth.login" : "auth.logout",
            created_at: "2026-11-23T14:15:16+08:00",
            ip_address: "127.0.0.1",
            user_agent: "Synthetic browser",
          },
        ],
      },
    })
  })
  await page.goto("/settings")
  const history = page.getByRole("region", {
    name: "Account history",
    exact: true,
  })
  await expect(
    history.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible()
  fail = false
  await history.getByRole("button", { name: "Retry loading" }).click()
  await expect(
    history.getByRole("cell", { name: "Login", exact: true }),
  ).toBeVisible()
  await history.getByRole("button", { name: "Next page" }).click()
  await expect(
    history.getByRole("cell", { name: "Logout", exact: true }),
  ).toBeVisible()
  await expect(
    history.getByRole("button", { name: "Next page" }),
  ).toBeDisabled()
  await page.route("**/api/v1/auth/history?*", (route) =>
    route.fulfill({
      json: { data: [], current_page: 1, last_page: 1, total: 0 },
    }),
  )
  await history.getByRole("button", { name: "Refresh history" }).click()
  await expect(
    history.getByText("Your next login or logout will appear here."),
  ).toBeVisible()
})
