import { test, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

const seeker = {
  id: 970001,

  first_name: "Isolated",

  name: "Isolated Jobseeker",

  role: "jobseeker",

  dashboard_tour_completed_at: "2026-11-07T00:00:00Z",
}

const admin = {
  ...seeker,

  id: 970002,

  name: "Isolated Administrator",

  role: "admin",
}

const vacancy = {
  id: 970003,

  title: "Isolated official vacancy",

  organization: "Fixture employer",

  description: "Browser-only public source fixture",

  location: "Mindoro",

  industry: "Services",

  employment_type: "Full-time",

  status: "published",

  skills: [],

  slots: null,

  deadline: null,

  source_url: "https://pasay.gov.ph/peso-jobs/fixture/",

  source_name: "Official source fixture",

  source_checked_at: "2026-11-07T00:00:00Z",

  external_application: true,

  is_sample: true,

  availability_status: "confirm_availability",
}

const program = {
  id: 970004,

  title: "Isolated registered program",

  provider: "Fixture provider",

  location: "Oriental Mindoro",

  mode: "Confirm delivery mode",

  description: "Browser-only registry fixture",

  requirements: "Review provider intake",

  skills: [],

  fee: null,

  starts_on: null,

  ends_on: null,

  capacity: null,

  schedule: "Confirm intake",

  status: "published",

  source_name: "TESDA Registered Program Directory",

  source_url:
    "https://www.tesda.gov.ph/Tvi/Result?SearchCourse=A&SearchIns=B&SearchLoc=C",

  source_checked_at: "2026-11-07T00:00:00Z",

  catalog_type: "registered_program",

  external_enrollment: true,

  is_sample: true,
}

async function mock(context, initial = seeker) {
  const state = {
    user: initial,

    referrals: [],

    enrollments: [],

    events: [],

    deleted: false,

    deletes: 0,

    intake: null,
  }

  await context.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  )

  const list = (data) => ({
    data,

    total: data.length,

    current_page: 1,

    last_page: 1,
  })

  await context.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname

    if (path === "/api/auth/user")
      return route.fulfill(
        state.user
          ? {
              json: {
                user: state.user,

                onboarding: { completed: true, current_step: 5 },
              },
            }
          : { status: 401, json: { message: "Unauthenticated" } },
      )

    if (path === "/api/auth/logout") {
      state.user = null

      return route.fulfill({ json: {} })
    }

    if (path === "/api/auth/login") {
      state.user = req.postDataJSON().email.includes("admin") ? admin : seeker

      return route.fulfill({
        json: { user: state.user, onboarding: { completed: true } },
      })
    }

    if (path === "/api/auth/preferences")
      return route.fulfill({ json: { user: state.user } })

    if (path === "/api/platform/summary")
      return route.fulfill({
        json: {
          saved: [],

          referrals: state.referrals.length,

          enrollments: state.enrollments.length,

          placements: 0,

          services: 0,
        },
      })

    if (path === "/api/public/source-coverage")
      return route.fulfill({ json: { review_date: "2026-11-07", sources: [] } })

    if (path.endsWith("/delete-intents"))
      return route.fulfill({
        json: { token: "isolated-browser-token", wait_seconds: 5 },
      })

    if (path.includes("/remove/")) {
      state.deleted = true

      state.deletes++

      return route.fulfill({ json: { message: "Removed" } })
    }

    if (path === `/api/platform/vacancies/${vacancy.id}/referrals`) {
      state.referrals.push({
        id: 970010,

        vacancy,

        status: "requested",

        created_at: "2026-11-07",

        user: seeker,

        notes: "PESO application review requested",
      })

      return route.fulfill({ status: 201, json: { data: state.referrals[0] } })
    }

    if (path === `/api/platform/training/${program.id}/enroll`) {
      state.enrollments.push({
        id: 970011,

        program,

        status: "requested",

        created_at: "2026-11-07",

        user: seeker,
      })

      return route.fulfill({
        status: 201,

        json: { data: state.enrollments[0] },
      })
    }

    if (path === "/api/platform/referrals")
      return route.fulfill({ json: list(state.referrals) })

    if (path === "/api/platform/enrollments")
      return route.fulfill({ json: list(state.enrollments) })

    if (path === "/api/platform/vacancies")
      return route.fulfill({ json: list(state.deleted ? [] : [vacancy]) })

    if (path === "/api/platform/training")
      return route.fulfill({
        json: list([program, ...(state.intake ? [state.intake] : [])]),
      })

    if (path === `/api/platform/training/${program.id}/intakes`) {
      state.intake = {
        ...program,

        ...req.postDataJSON(),

        id: 970005,

        external_enrollment: false,

        catalog_type: "partner_program",

        source_program_id: program.id,

        source_url: null,
      }

      return route.fulfill({ status: 201, json: { data: state.intake } })
    }

    if (
      path === "/api/platform/enrollments/970011" &&
      req.method() === "PATCH"
    ) {
      const body = req.postDataJSON()

      expect(String(body.intake_program_id)).toBe(String(state.intake.id))

      state.enrollments[0] = {
        ...state.enrollments[0],

        status: body.status,

        program: state.intake,
      }

      return route.fulfill({ json: { data: state.enrollments[0] } })
    }

    if (path === "/api/platform/users")
      return route.fulfill({ json: list([seeker, admin]) })

    if (path === "/api/platform/events") {
      if (req.method() === "POST") {
        state.events.push({ id: 970020, ...req.postDataJSON() })

        return route.fulfill({ json: { data: state.events[0] } })
      }

      return route.fulfill({ json: list(state.events) })
    }

    return route.fulfill({ json: list([]) })
  })

  return state
}

test("two tabs restore the same server account, replay keeps its role, and sign-out synchronizes", async ({
  context,

  page,
}) => {
  const state = await mock(context)

  await page.goto("/dashboard")

  await expect(page.getByText(seeker.name, { exact: true })).toBeVisible()

  const other = await context.newPage()

  await other.goto("/")

  await expect(other).toHaveURL(/\/dashboard$/)

  await expect(other.getByText(seeker.name, { exact: true })).toBeVisible()

  await other.evaluate(() => window.dispatchEvent(new Event("peso:open-tour")))

  await expect(other.getByRole("dialog")).toBeVisible()

  await other.getByRole("button", { name: "Close tutorial" }).click()

  expect(state.user.role).toBe("jobseeker")

  await expect(other.getByText(seeker.name, { exact: true })).toBeVisible()

  await other.getByRole("button", { name: "Sign out", exact: true }).click()

  await expect(page).toHaveURL(/\/login$/)

  await expect(other).toHaveURL(/\/login$/)

  await other.getByLabel("Email Address").fill("admin@browser.example.test")

  await other

    .locator('input[autocomplete="current-password"]')

    .fill("BrowserOnly123!")

  await other.getByRole("button", { name: "Log In", exact: true }).click()

  await expect(other).toHaveURL(/\/dashboard$/)

  await expect(page).toHaveURL(/\/dashboard$/)

  await expect(page.getByText(admin.name, { exact: true })).toBeVisible()
})

test("external vacancy and registry training create local requests and open their tracking pages", async ({
  context,

  page,
}) => {
  const state = await mock(context)

  await page.goto(`/jobs/${vacancy.id}`)

  await page

    .getByRole("button", {
      name: "Apply through PESO · request referral",

      exact: true,
    })

    .click()

  await expect(page).toHaveURL(/\/referrals$/)

  await expect(
    page.getByText("PESO application review requested", { exact: true }),
  ).toBeVisible()

  expect(state.referrals).toHaveLength(1)

  await page.goto(`/training/${program.id}`)

  await page.getByRole("checkbox").check()

  await page

    .getByRole("button", { name: "Request enrollment through PESO" })

    .click()

  await expect(page).toHaveURL(/\/enrollments$/)

  await expect(
    page.getByRole("heading", { name: program.title, exact: true }),
  ).toBeVisible()

  expect(state.enrollments).toHaveLength(1)
})

test("charcoal theme persists, disabled dropdown prompts cannot be selected, and deletion waits five seconds", async ({
  context,

  page,
}) => {
  const state = await mock(context, admin)

  await page.addInitScript(() =>
    localStorage.setItem(
      "peso-appearance",

      JSON.stringify({ theme: "hc2", reduceMotion: true }),
    ),
  )

  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto("/jobs")

  await expect(
    page.getByRole("heading", { name: "Vacancy Management", exact: true }),
  ).toBeVisible()

  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)

        .getPropertyValue("--background")

        .trim(),
    ),
  ).toBe("#18191a")

  await page.getByRole("button", { name: "Add vacancy", exact: true }).click()

  const select = page.getByLabel("Employment type", { exact: false })

  await select.selectOption("Full-time")

  await expect(select.locator('option[value=""]')).toHaveJSProperty(
    "disabled",

    true,
  )

  await select.focus()

  await page.keyboard.press("Home")

  await expect(select).toHaveValue("Full-time")

  await expect(select.locator('option[value=""]')).toHaveAttribute("hidden", "")

  await page.getByRole("button", { name: "Cancel", exact: true }).click()

  await page

    .getByRole("button", { name: "Delete vacancy", exact: true })

    .click()

  const dialog = page.getByRole("dialog")

  await expect(dialog.getByRole("button", { name: /Delete/ })).toBeDisabled()

  expect(state.deletes).toBe(0)

  await fs.mkdir("artifacts/facilitation", { recursive: true })

  await page.screenshot({
    path: "artifacts/facilitation/dark-delete.png",

    fullPage: true,
  })

  await expect(
    dialog.getByRole("button", { name: "Delete item", exact: true }),
  ).toBeEnabled({ timeout: 8000 })

  await dialog.getByRole("button", { name: "Delete item", exact: true }).click()

  await expect(dialog).toHaveCount(0)

  expect(state.deletes).toBe(1)

  await page.reload()

  await expect(page.locator("html")).toHaveAttribute("data-contrast", "hc2")

  expect(
    (
      await new AxeBuilder({ page })

        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

        .analyze()
    ).violations,
  ).toEqual([])
})

test("event display names become safe links and placement shows exactly one labeled example", async ({
  context,

  page,
}) => {
  const state = await mock(context, admin)

  await page.goto("/events")

  await page

    .getByRole("button", { name: "Add event / program", exact: true })

    .click()

  await page.getByLabel("Event / program title").fill("Browser fixture event")

  await page.getByLabel("Service type").selectOption("Job fair")

  await page.getByLabel("Venue / location").fill("Bansud")

  await page.getByLabel("Start time (Philippine time)").fill("2027-01-20T09:00")

  await page

    .getByLabel("Program details & coordination instructions")

    .fill("Browser-only event test.")

  await page

    .getByLabel("Organizer / link display name")

    .fill("DOLE XI · 2026 Job Fair Schedules")

  await page

    .getByLabel("Organizer / program link (HTTPS)")

    .fill("https://ro11.dole.gov.ph/job-fair-schedules/")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(
    page.getByRole("link", { name: /DOLE XI · 2026 Job Fair Schedules/ }),
  ).toHaveAttribute("href", "https://ro11.dole.gov.ph/job-fair-schedules/")

  expect(state.events).toHaveLength(1)

  await page.goto("/placements")

  await expect(
    page.getByRole("article", { name: "Placement workflow example" }),
  ).toHaveCount(1)

  await expect(
    page.getByText(
      "Illustrative placement example · not a real employment record",

      { exact: true },
    ),
  ).toBeVisible()
})

test("PESO creates a separate verified intake and selects it when confirming a pending source enrollment", async ({
  context,

  page,
}) => {
  const state = await mock(context, admin)

  state.enrollments = [
    {
      id: 970011,

      program,

      status: "requested",

      created_at: "2026-11-07",

      user: seeker,
    },
  ]

  await page.goto(`/training/${program.id}`)

  await page

    .getByRole("button", { name: "Create verified local intake", exact: true })

    .click()

  await page

    .getByLabel("Actual training location")

    .fill("Bansud training center")

  await page.getByLabel("Delivery mode").selectOption("In person")

  await page.getByLabel("Confirmed intake capacity").fill("10")

  await page.getByLabel("Confirmed start date").fill("2027-01-10")

  await page.getByLabel("Confirmed end date").fill("2027-02-10")

  await page

    .getByLabel("Confirmed training schedule")

    .fill("Weekdays 9 AM to 4 PM")

  await page.getByLabel("Confirmed fee (PHP)").fill("100")

  await page

    .getByLabel(
      "Provider contact, date, intake, fee and scholarship verification",
    )

    .fill(
      "Browser-only intake confirmation fixture with actual dates and fee fields.",
    )

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(page).toHaveURL(/\/training\/970005$/)

  expect(state.intake.source_program_id).toBe(program.id)

  await page.goto("/enrollments")

  await page.getByRole("button", { name: "Update status", exact: true }).click()

  await page.getByLabel("Enrollment status").selectOption("confirmed")

  await page

    .getByLabel("Verified local intake (required for confirmation)")

    .selectOption("970005")

  await page

    .getByLabel("Notes / reason")

    .fill("Admission confirmed by the provider.")

  await page.getByRole("button", { name: "Save record", exact: true }).click()

  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible()

  expect(state.enrollments[0].program.external_enrollment).toBe(false)
})

test("both themes keep readable mobile details and emphasize interview notes without changing layout", async ({
  context,

  page,
}) => {
  const state = await mock(context)

  state.referrals = [
    {
      id: 970010,

      vacancy,

      status: "interviewing",

      created_at: "2026-11-07",

      user: seeker,

      notes:
        "Interview confirmed. Please bring the requested application documents.",

      interview_at: "2027-01-10T03:00:00Z",
    },
  ]

  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto("/referrals")

  const notes = page.getByText(state.referrals[0].notes, { exact: true })

  await expect(notes).toHaveCSS("font-weight", "700")

  await expect(page.getByText(/^Interview:/)).toHaveCSS("font-weight", "700")

  await fs.mkdir("artifacts/facilitation", { recursive: true })

  await page.screenshot({
    path: "artifacts/facilitation/light-notes.png",

    fullPage: true,
  })

  await page

    .getByRole("button", { name: "Switch to dark mode", exact: true })

    .click()

  await expect(page.locator("html")).toHaveAttribute("data-contrast", "hc2")

  await expect(
    page.getByRole("button", { name: "Withdraw request", exact: true }),
  ).toHaveCSS("background-color", "rgb(36, 37, 38)")

  await page.screenshot({
    path: "artifacts/facilitation/dark-notes.png",

    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)

  expect(
    (
      await new AxeBuilder({ page })

        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

        .analyze()
    ).violations,
  ).toEqual([])

  await page.screenshot({
    path: "artifacts/facilitation/mobile-dark-notes.png",

    fullPage: true,
  })
})
