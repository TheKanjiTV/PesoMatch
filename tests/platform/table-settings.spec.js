import { test, expect } from "@playwright/test"

import fs from "node:fs/promises"

test.use({ reducedMotion: "reduce" })

async function fixture(context) {
  const state = { size: 20, fail: false }

  const user = {
    id: 980001,
    name: "Synthetic Administrator",
    first_name: "Synthetic",
    role: "admin",
    dashboard_tour_completed_at: "2026-11-22T00:00:00Z",
  }

  const records = Array.from({ length: 396 }, (_, i) => ({
    id: i + 1,
    name: `Synthetic Account ${String(i + 1).padStart(3, "0")}`,
    email: `fixture-${i + 1}@example.test`,
    role: "jobseeker",
  }))

  await context.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  )

  await context.route("**/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname

    if (path === "/api/auth/user")
      return route.fulfill({ json: { user, onboarding: { completed: true } } })

    if (path === "/api/platform/table-settings") {
      if (request.method() === "PATCH") {
        if (state.fail)
          return route.fulfill({
            status: 503,
            json: { message: "Settings could not be saved. Try again." },
          })

        state.size = request.postDataJSON().rows_per_page
      }

      return route.fulfill({ json: { rows_per_page: state.size } })
    }

    if (path === "/api/platform/login-policy")
      return route.fulfill({
        json: {
          stages: [
            { attempts: 3, lockout_minutes: 5 },
            { attempts: 3, lockout_minutes: 10 },
            { attempts: 5, lockout_minutes: 60 },
          ],
        },
      })

    if (path === "/api/platform/users") {
      const page = Number(url.searchParams.get("page") || 1)

      return route.fulfill({
        json: {
          data: records.slice((page - 1) * state.size, page * state.size),
          current_page: page,
          last_page: Math.ceil(records.length / state.size),
          total: records.length,
          per_page: state.size,
        },
      })
    }

    return route.fulfill({
      json: { data: [], saved: [], total: 0, current_page: 1, last_page: 1 },
    })
  })

  return state
}

for (const width of [1440, 390]) {
  test(`global table setting paginates, persists and refreshes open tabs at ${width}px`, async ({
    page,
    context,
  }) => {
    await fixture(context)

    await page.setViewportSize({ width, height: 900 })

    const errors = []

    page.on("pageerror", (error) => errors.push(error.message))

    await page.goto("/users")

    await expect(page.locator("table tbody tr")).toHaveCount(20)

    await expect(
      page.getByText("Page 1 of 20 · 396 records", { exact: true }),
    ).toBeVisible()

    const pager = page
      .getByText("Page 1 of 20 · 396 records", { exact: true })
      .locator("..")

    await pager.getByRole("button", { name: "Next page" }).click()

    await expect(page.locator("table tbody tr").first()).toContainText(
      "Synthetic Account 021",
    )

    const other = await context.newPage()

    await other.goto("/users")

    await expect(other.locator("table tbody tr")).toHaveCount(20)

    await page.getByLabel("Rows per page", { exact: true }).fill("10")

    await page
      .getByRole("button", { name: "Save table settings", exact: true })
      .click()

    await expect(
      page.getByText("Table settings saved for all accounts."),
    ).toBeVisible()

    for (const tab of [page, other]) {
      await expect(tab.locator("table tbody tr")).toHaveCount(10)

      await expect(
        tab.getByText("Page 1 of 40 · 396 records", { exact: true }),
      ).toBeVisible()

      await expect(tab.locator("table tbody tr").first()).toContainText(
        "Synthetic Account 001",
      )
    }

    await page.reload()

    await expect(page.getByLabel("Rows per page", { exact: true })).toHaveValue(
      "10",
    )

    await expect(page.locator("table tbody tr")).toHaveCount(10)

    await page.getByLabel("Rows per page", { exact: true }).fill("20")

    await page
      .getByRole("button", { name: "Save table settings", exact: true })
      .click()

    await expect(page.locator("table tbody tr")).toHaveCount(20)

    await expect(
      page.getByText("Page 1 of 20 · 396 records", { exact: true }),
    ).toBeVisible()

    const section = page.getByRole("region", {
      name: "Table settings",
      exact: true,
    })

    await section.scrollIntoViewIfNeeded()

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy()

    await fs.mkdir("artifacts/table-settings", { recursive: true })

    await page.screenshot({
      path: `artifacts/table-settings/settings-${width}.png`,
    })

    await section.screenshot({
      path: `artifacts/table-settings/section-${width}.png`,
    })

    expect(errors).toEqual([])
  })
}

test("failed save keeps existing rows and supports retry", async ({
  page,
  context,
}) => {
  const state = await fixture(context)

  state.fail = true

  await page.goto("/users")

  await expect(page.locator("table tbody tr")).toHaveCount(20)

  await page.getByLabel("Rows per page", { exact: true }).fill("10")

  await page
    .getByRole("button", { name: "Save table settings", exact: true })
    .click()

  await expect(
    page.getByText(
      "PesoMatch is temporarily unavailable. Please try again. Your entries are still here.",
    ),
  ).toBeVisible()

  await expect(page.locator("table tbody tr")).toHaveCount(20)

  state.fail = false

  await page
    .getByRole("button", { name: "Save table settings", exact: true })
    .click()

  await expect(page.locator("table tbody tr")).toHaveCount(10)
})

test("summary tables respect one row per page and keep every status reachable", async ({
  page,
  context,
}) => {
  const state = await fixture(context)

  state.size = 1

  await context.route("**/api/platform/labor-market?*", (route) =>
    route.fulfill({
      json: {
        industries: [],
        skills: {},
        follow_ups: [],
        training_completions: 0,

        outcomes: [
          { status: "employed", total: 5, verified: 3 },

          { status: "unemployed", total: 2, verified: 1 },

          { status: "self_employed", total: 1, verified: 0 },
        ],
      },
    }),
  )

  await page.goto("/labor-market")

  await expect(page.locator("table tbody tr")).toHaveCount(1)

  await expect(page.locator("table tbody tr")).toContainText("Employed")

  await expect(
    page.getByText("Page 1 of 3 · 3 records", { exact: true }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Next page", exact: true }).click()

  await expect(page.locator("table tbody tr")).toContainText("Unemployed")

  await page.getByRole("button", { name: "Next page", exact: true }).click()

  await expect(page.locator("table tbody tr")).toContainText("Self Employed")

  await expect(
    page.getByRole("button", { name: "Next page", exact: true }),
  ).toBeDisabled()
})
