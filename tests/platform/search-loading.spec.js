import { test, expect, provisionAndSignIn } from "./helpers.js"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

test("provider and administrator workspaces finish loading with their authorized controls", async ({
  page,
  account,
}) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  for (const [role, route] of [
    ["training_provider", "/training"],
    ["admin", "/users"],
  ]) {
    await provisionAndSignIn(account, page, role)
    await page.goto(route)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("status").filter({ hasText: "Loading" }),
    ).toHaveCount(0)
    if (role === "training_provider") {
      await page.keyboard.press("Control+k")
      await expect(
        page.getByRole("combobox", { name: "Search training", exact: true }),
      ).toBeFocused()
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
  }
  expect(errors).toEqual([])
})

const vacancy = {
  id: 987654,

  title: "Nurse Peña",

  organization: "Community Health",

  location: "Quezon City",

  skills: ["Nursing", "Communication"],

  employment_type: "Full-time",

  status: "published",

  description: "A browser test fixture for searching. Not a live vacancy.",

  deadline: "2027-01-01",

  is_sample: true,
}

test("autocomplete keeps focus, supports keyboard selection and validates without submitting bad searches", async ({
  page,
}) => {
  const errors = []

  const searches = []

  page.on("pageerror", (error) => errors.push(error.message))

  await page.emulateMedia({ reducedMotion: "reduce" })

  await page.route("**/api/platform/vacancies?**", async (route) => {
    searches.push(new URL(route.request().url()).searchParams.get("search"))

    await route.fulfill({
      json: { data: [vacancy], current_page: 1, last_page: 1, total: 1 },
    })
  })

  await page.goto("/jobs")

  const search = page.getByRole("combobox", {
    name: "Search vacancies",

    exact: true,
  })

  await expect(
    page.getByRole("link", { name: "Nurse Peña", exact: true }),
  ).toBeVisible()

  await page.evaluate(() => {
    window.__skeletonDurations = []

    let started = null

    new MutationObserver(() => {
      const visible = Boolean(
        document.querySelector('[data-skeleton="screen"]'),
      )

      if (visible && started === null) started = performance.now()

      if (!visible && started !== null) {
        window.__skeletonDurations.push(performance.now() - started)

        started = null
      }
    }).observe(document.body, { childList: true, subtree: true })
  })

  await page.keyboard.press("Control+k")

  await expect(search).toBeFocused()

  await search.fill("Nu")

  await expect(page.locator('[data-skeleton="screen"]')).toBeVisible()

  await expect(search).toBeFocused()

  await expect(page.getByRole("listbox")).toBeVisible()

  await expect(
    page.getByRole("option", { name: "Nurse Peña", exact: true }),
  ).toBeVisible()

  await page.keyboard.press("ArrowUp")
  await expect(search).toHaveAttribute("aria-activedescendant", /option-1$/)
  await page.keyboard.press("ArrowDown")

  await expect(search).toHaveAttribute("aria-activedescendant", /option-0$/)

  await page.keyboard.press("Enter")

  await expect(search).toHaveValue("Nurse Peña")

  await expect(page.getByRole("listbox")).toHaveCount(0)

  await expect(page.locator('[data-skeleton="screen"]')).toHaveCount(0)

  await search.fill("Nurs")

  await expect(page.getByRole("listbox")).toBeVisible()

  await page.keyboard.press("Escape")

  await expect(page.getByRole("listbox")).toHaveCount(0)

  await expect(search).toHaveValue("Nurs")

  await search.fill("bad\u0007query")

  await expect(search).toHaveAttribute("aria-invalid", "true")

  await expect(page.getByRole("alert")).toContainText("control characters")

  await expect(search).toBeFocused()

  expect(searches.some((value) => value?.includes("\u0007"))).toBe(false)

  await page

    .getByRole("button", { name: "Clear search vacancies", exact: true })

    .click()

  await expect(search).toBeFocused()

  await expect(search).toHaveValue("")

  await expect(page.getByRole("alert")).toHaveCount(0)

  expect(
    (await page.evaluate(() => window.__skeletonDurations)).every(
      (duration) => duration >= 380,
    ),
  ).toBe(true)

  expect(
    (await page.evaluate(() => window.__skeletonDurations)).length,
  ).toBeGreaterThan(0)

  await fs.mkdir("artifacts/input-loading-review", { recursive: true })

  await search.fill("Nu")

  await expect(page.getByRole("listbox")).toBeVisible()

  await page.screenshot({
    path: "artifacts/input-loading-review/autocomplete-desktop.png",

    fullPage: true,
  })

  for (const theme of ["hc1", "hc2"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.contrast = theme
    }, theme)

    await page.setViewportSize({ width: 390, height: 844 })

    await search.focus()

    await expect(page.getByRole("listbox")).toBeVisible()

    const accessibility = await new AxeBuilder({ page })

      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

      .analyze()

    expect(
      accessibility.violations.map((v) => ({
        id: v.id,

        targets: v.nodes.map((n) => n.target),
      })),
    ).toEqual([])

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)

    await page.screenshot({
      path: `artifacts/input-loading-review/autocomplete-mobile-${theme}.png`,

      fullPage: true,
    })
  }

  expect(errors).toEqual([])
})

test("slow responses retain skeletons, stale searches cannot replace newer results, and failures can retry", async ({
  page,
}) => {
  let finishSlow

  let fail = false

  await page.route("**/api/platform/vacancies?**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("search")

    if (query === "slow")
      await new Promise((resolve) => {
        finishSlow = resolve
      })

    if (fail)
      return route.fulfill({ status: 503, json: { message: "Unavailable" } })

    await route

      .fulfill({
        json: {
          data:
            query === "new"
              ? [{ ...vacancy, title: "New vacancy" }]
              : [vacancy],

          current_page: 1,

          last_page: 1,

          total: 1,
        },
      })

      .catch(() => {})
  })

  await page.goto("/jobs")

  const search = page.getByRole("combobox", {
    name: "Search vacancies",

    exact: true,
  })

  await expect(
    page.getByRole("link", { name: "Nurse Peña", exact: true }),
  ).toBeVisible()

  await search.fill("slow")

  await expect.poll(() => typeof finishSlow).toBe("function")

  await expect(page.locator('[data-skeleton="screen"]')).toBeVisible()

  await page.screenshot({
    path: "artifacts/input-loading-review/skeleton-desktop.png",

    fullPage: true,
  })

  await search.fill("new")

  await expect(
    page.getByRole("link", { name: "New vacancy", exact: true }),
  ).toBeVisible()

  finishSlow()

  await expect(
    page.getByRole("link", { name: "Nurse Peña", exact: true }),
  ).toHaveCount(0)

  fail = true

  await search.fill("offline")

  await expect(
    page.getByRole("button", { name: "Retry loading" }),
  ).toBeVisible()

  await expect(search).toBeFocused()

  fail = false

  await page.getByRole("button", { name: "Retry loading" }).click()

  await expect(
    page.getByRole("link", { name: "Nurse Peña", exact: true }),
  ).toBeVisible()
})

test("record forms expose field errors, keyboard submit, and Escape restores focus", async ({
  page,

  account,
}) => {
  await provisionAndSignIn(account, page, "employer")

  await page.goto("/jobs")

  const add = page.getByRole("button", { name: "Add vacancy", exact: true })

  await add.focus()

  await page.keyboard.press("Enter")

  const title = page.getByLabel("Vacancy title", { exact: false })

  await expect(title).toBeFocused()

  await title.fill(" ")

  await page.keyboard.press("Tab")

  await expect(
    page.getByText("Vacancy title is required.", { exact: true }),
  ).toBeVisible()

  await expect(title).toHaveAttribute("aria-invalid", "true")

  await title.fill("Test input")

  await expect(
    page.getByText("Vacancy title is required.", { exact: true }),
  ).toHaveCount(0)

  await page.keyboard.press("Control+Enter")

  await expect(page.getByLabel("Employer / organization")).toHaveAttribute(
    "aria-invalid",

    "true",
  )

  await page.route("**/api/platform/vacancies", (route) =>
    route.fulfill({
      status: 422,
      json: {
        message: "Review the fields.",
        errors: {
          title: ["Review this title."],
          organization: ["Review this organization."],
        },
      },
    }),
  )
  await page.getByLabel("Employer / organization").fill("Test employer")
  await page.getByLabel("Work location").fill("Manila")
  await page.getByLabel("Industry", { exact: false }).fill("Services")
  await page.getByLabel("Employment type").selectOption("Full-time")
  await page.getByLabel("Application deadline").fill("2027-01-01")
  await page
    .getByLabel("Required skills (comma separated)")
    .fill("Communication")
  await page
    .getByLabel("Responsibilities & requirements")
    .fill("Browser validation fixture only.")
  await page.keyboard.press("Control+Enter")
  await expect(title).toBeFocused()
  await expect(
    page.getByText("Review this title.", { exact: true }),
  ).toBeVisible()
  await title.fill("Corrected title")
  await expect(title).toBeFocused()
  await expect(
    page.getByText("Review this title.", { exact: true }),
  ).toHaveCount(0)
  await page.keyboard.press("Escape")

  await expect(
    page.getByRole("region", { name: "Add vacancy", exact: true }),
  ).toHaveCount(0)

  await expect(add).toBeFocused()
})
