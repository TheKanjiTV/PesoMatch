import { test, expect } from "@playwright/test"
import fs from "node:fs/promises"

test.use({ serviceWorkers: "block" })

async function workspace(context, role = "admin") {
  const calls = []
  let archived = false
  let deleted = false
  let failedOnce = false
  await context.route("**/sanctum/csrf-cookie", (r) =>
    r.fulfill({ status: 204 }),
  )
  await context.route("**/api/v1/**", async (r) => {
    const request = r.request(),
      path = new URL(request.url()).pathname
    const body = request.postDataJSON()
    calls.push({ path, method: request.method(), body })
    let json = {
      data: [],
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 20,
    }
    if (path.endsWith("/auth/user"))
      json = {
        user: {
          id: 990231,
          name: "Synthetic archive check",
          role,
          dashboard_tour_completed_at: "2026-11-25T00:00:00Z",
        },
        onboarding: { completed: true },
      }
    else if (path.endsWith("/summary"))
      json = {
        saved: [],
        referrals: 0,
        enrollments: 0,
        placements: 0,
        services: 0,
      }
    else if (path.endsWith("/table-settings")) json = { rows_per_page: 20 }
    else if (path.endsWith("/archive/delete-intents"))
      json = {
        token: "synthetic-intent",
        wait_seconds: 5,
        label: "Digital records",
        impact: {},
      }
    else if (path.endsWith("/archive/demand/990230")) {
      if (!failedOnce) {
        failedOnce = true
        return r.fulfill({
          status: 429,
          headers: { "Retry-After": "17" },
          json: { message: "Too Many Attempts." },
        })
      }
      deleted = true
      json = { message: "Record permanently deleted." }
    } else if (path === "/api/v1/platform/archive")
      json = {
        ...json,
        data: deleted
          ? []
          : [
              {
                type: "demand",
                id: 990230,
                label: "Digital records",
                context: "Synthetic person",
                status: "requested",
                archived_at: "2026-11-25T01:00:00Z",
              },
            ],
        total: deleted ? 0 : 1,
      }
    else if (
      path.endsWith("/training-demands/archive-topic") ||
      /training-demands\/\d+\/archive$/.test(path)
    ) {
      archived = true
      json = { message: "Training request archived." }
    } else if (path.endsWith("/training-demands"))
      json = {
        ...json,
        data: archived
          ? []
          : [
              {
                id: 990230,
                topic: "Digital records",
                topic_key: "digital records",
                interested_jobseekers: 2,
              },
            ],
        total: archived ? 0 : 1,
      }
    await r.fulfill({ json })
  })
  return calls
}

test("Restore and Delete stay adjacent; deletion waits, preserves input on 429, and sends only on explicit submit", async ({
  page,
  context,
}) => {
  const calls = await workspace(context)
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/archive")
  const row = page.locator("tbody tr")
  await expect(row.getByRole("button", { name: /^Restore/ })).toBeVisible()
  await row.getByRole("button", { name: /^Permanently delete/ }).click()
  const dialog = page.getByRole("dialog")
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused()
  await expect(
    dialog.getByRole("button", { name: /^Delete permanently/ }),
  ).toBeDisabled()
  await dialog
    .getByLabel("Type the complete record name")
    .fill("Digital records")
  await dialog
    .getByLabel("Your current administrator password")
    .fill("Synthetic password")
  await fs.mkdir("artifacts/archive-management", { recursive: true })
  for (const [width, theme] of [
    [1440, "hc1"],
    [390, "hc2"],
  ]) {
    await page.setViewportSize({ width, height: 950 })
    await page.evaluate(
      (theme) => (document.documentElement.dataset.contrast = theme),
      theme,
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: `artifacts/archive-management/delete-${width}-${theme}.png`,
    })
  }
  const submit = dialog.getByRole("button", {
    name: "Delete permanently",
    exact: true,
  })
  await submit.click()
  await expect(
    dialog.getByText(
      "Please wait 17 seconds before trying again. Your entries are still here.",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(dialog.getByLabel("Type the complete record name")).toHaveValue(
    "Digital records",
  )
  await expect(
    dialog.getByLabel("Your current administrator password"),
  ).toHaveValue("Synthetic password")
  expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(1)
  await submit.click()
  await expect(dialog).toHaveCount(0)
  await expect(
    page.getByText("Record permanently deleted.", { exact: true }),
  ).toBeVisible()
  expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(2)
  expect(errors).toEqual([])
})

for (const role of ["jobseeker", "peso_staff", "admin"]) {
  test(`${role}: request archive is confirmed and scoped to the proper operation`, async ({
    page,
    context,
  }) => {
    const calls = await workspace(context, role)
    await page.goto("/training-demand")
    await page
      .getByRole("button", {
        name: role === "jobseeker" ? "Archive request" : "Archive topic",
        exact: true,
      })
      .click()
    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeFocused()
    await dialog
      .getByRole("button", { name: "Archive request", exact: true })
      .click()
    await expect
      .poll(
        () =>
          calls.filter(
            (c) => c.method === "POST" && c.path.includes("training-demands"),
          ).length,
      )
      .toBe(1)
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByText("No training interest recorded yet.", { exact: true }),
    ).toBeVisible()
    const request = calls.find(
      (c) => c.method === "POST" && c.path.includes("training-demands"),
    )
    expect(request.path).toBe(
      `/api/v1/platform/training-demands/${
        role === "jobseeker" ? "990230/archive" : "archive-topic"
      }`,
    )
    if (role !== "jobseeker")
      expect(request.body).toEqual({ topic_key: "digital records" })
  })
}

for (const role of [
  "jobseeker",
  "peso_staff",
  "admin",
  "employer",
  "training_provider",
]) {
  test(`${role}: Events is absent and old URL returns to Overview`, async ({
    page,
    context,
  }) => {
    const calls = await workspace(context, role)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 })
      await page.goto("/events")
      await expect(page).toHaveURL(/\/dashboard$/)
      await expect(
        page.getByRole("heading", { name: /Events & programs/i }),
      ).toHaveCount(0)
      expect(await page.locator('a[href="/events"]').count()).toBe(0)
    }
    expect(calls.some((c) => c.path.endsWith("/events"))).toBe(false)
  })
}
