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
        label: "(Micro Credential Course) Preparing Computer Aided Drawings Using AutoCAD",
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
                label: "(Micro Credential Course) Preparing Computer Aided Drawings Using AutoCAD",
                context: "Synthetic person",
                status: "requested",
                archived_at: "2026-11-25T01:00:00Z",
              },
            ],
        total: deleted ? 0 : 1,
      }
    else if (/training-demands\/\d+\/archive$/.test(path)) {
      archived = true
      json = { message: "Training request archived." }
    } else if (path.endsWith("/training-demands")) {
      const detailed = new URL(request.url()).searchParams.has("topic_key")
      const people = [
        {
          id: 990230,
          name: "Synthetic person",
          topic: "Digital records",
          topic_key: "digital records",
        },
        {
          id: 990232,
          name: "Second person",
          topic: "Digital records",
          topic_key: "digital records",
        },
      ]
      const data = detailed
        ? archived
          ? people.slice(1)
          : people
        : role === "jobseeker" && archived
          ? []
          : [{ ...people[0], interested_jobseekers: archived ? 1 : 2 }]
      json = { ...json, data, total: data.length }
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
  await expect(dialog.locator('input[type="text"]')).toHaveCount(0)
  await dialog
    .getByRole("checkbox", {
      name: "I understand this deletion cannot be undone.",
    })
    .check()
  await dialog
    .getByLabel("Your current administrator password")
    .evaluate((input) => {
      input.value = "Synthetic password"
    })
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
  await expect(
    dialog.getByRole("checkbox", {
      name: "I understand this deletion cannot be undone.",
    }),
  ).toBeChecked()
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

test("expired confirmation can be renewed without closing the deletion dialog", async ({
  page,
  context,
}) => {
  await workspace(context)
  await page.clock.install()
  await page.goto("/archive")
  await page.getByRole("button", { name: /^Permanently delete/ }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("checkbox").check()
  await dialog
    .getByLabel("Your current administrator password")
    .fill("Synthetic password")
  await page.clock.fastForward(301000)
  await expect(
    dialog.getByText("Confirmation expired. Review it again to continue.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "Delete permanently", exact: true }),
  ).toBeDisabled()
  await dialog
    .getByRole("button", { name: "Review confirmation again", exact: true })
    .click()
  await expect(dialog.getByRole("checkbox")).not.toBeChecked()
  await expect(
    dialog.getByLabel("Your current administrator password"),
  ).toHaveValue("Synthetic password")
  await dialog.getByRole("checkbox").check()
  await page.clock.fastForward(6000)
  await expect(
    dialog.getByRole("button", { name: "Delete permanently", exact: true }),
  ).toBeEnabled()
})

for (const role of ["jobseeker", "peso_staff", "admin"]) {
  test(`${role}: request archive is confirmed and scoped to the proper operation`, async ({
    page,
    context,
  }) => {
    const calls = await workspace(context, role)
    await page.goto("/training-demand")
    await expect(
      page.getByRole("button", { name: "Archive topic", exact: true }),
    ).toHaveCount(0)
    if (role !== "jobseeker") {
      await page
        .getByRole("button", { name: "View requests", exact: true })
        .click()
      await page
        .getByRole("button", {
          name: "Archive request from Synthetic person",
          exact: true,
        })
        .click()
    } else
      await page
        .getByRole("button", { name: "Archive request", exact: true })
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
    if (role === "jobseeker")
      await expect(
        page.getByText("No training interest recorded yet.", { exact: true }),
      ).toBeVisible()
    else {
      await expect(
        page.getByText("1 interested jobseeker(s)", { exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole("region", {
          name: "Training request from Second person",
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        page.getByRole("region", {
          name: "Training request from Synthetic person",
          exact: true,
        }),
      ).toHaveCount(0)
    }
    const request = calls.find(
      (c) => c.method === "POST" && c.path.includes("training-demands"),
    )
    expect(request.path).toBe(
      "/api/v1/platform/training-demands/990230/archive",
    )
    expect(request.body).toEqual({})
    expect(calls.some((c) => c.path.endsWith("/archive-topic"))).toBe(false)
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
