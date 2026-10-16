import { test, expect as browserExpect } from "@playwright/test"

import { recordMotion, expectPanelMotion } from "./motion.js"

// Real session restoration can queue behind SQLite requests on the local PHP server.

const expect = browserExpect.configure({ timeout: 15000 })

test.describe.configure({ timeout: 90000 })

const password = "ProfileCheck482!"

const account = (name = "Profile") => ({
  first_name: name,

  last_name: "Test",

  email: `${name.toLowerCase()}.${Date.now()}.${Math.random().toString(36).slice(2)}@example.test`,

  password,

  password_confirmation: password,

  mobile_number: "+639171234567",
})

async function callAccount(page, path, method = "GET", payload) {
  return page.evaluate(
    async ({ path, method, payload }) => {
      if (method !== "GET")
        await fetch("/sanctum/csrf-cookie", {
          credentials: "include",

          headers: { Accept: "application/json" },
        })

      const token = document.cookie

        .split("; ")

        .find((cookie) => cookie.startsWith("XSRF-TOKEN="))

        ?.slice(11)

      const response = await fetch(path, {
        method,

        credentials: "include",

        headers: {
          Accept: "application/json",

          "Content-Type": "application/json",

          "X-Requested-With": "XMLHttpRequest",

          ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
        },

        ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
      })

      return { status: response.status, body: await response.json() }
    },

    { path, method, payload },
  )
}

async function createAccount(page, values) {
  await page.goto("/login")

  const response = await callAccount(page, "/api/auth/register", "POST", values)

  expect(response.status, JSON.stringify(response.body)).toBe(201)

  const login = await callAccount(page, "/api/auth/login", "POST", {
    email: values.email,
    password: values.password,
  })

  expect(login.status).toBe(200)

  return response.body
}

const personal = (name) => ({
  first_name: name,

  last_name: "Test",

  middle_name: null,

  birth_date: "2000-01-01",

  sex: null,

  mobile_number: "+639171234567",

  address_line: "Test address",

  province: "Oriental Mindoro",

  municipality: "Bansud",

  barangay: "Poblacion",
})

const education = {
  highest_attainment: "College Graduate",

  school_name: "Test University",

  course_program: "Information Technology",

  year_graduated: 2023,

  educational_status: "Graduated",
}

async function saveSection(page, section, values) {
  const response = await callAccount(
    page,

    `/api/jobseeker/onboarding/${section}`,

    "PATCH",

    values,
  )

  expect(response.status, JSON.stringify(response.body)).toBe(200)

  return response.body
}

async function signIn(page, values) {
  await page.goto("/login")

  await page.getByLabel("Email Address").fill(values.email)

  await page

    .locator('input[autocomplete="current-password"]')

    .fill(values.password)

  await page.route(
    "**/api/auth/login",

    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300))

      await route.continue()
    },

    { times: 1 },
  )

  await page.getByRole("button", { name: "Log In", exact: true }).click()

  await expect(
    page.getByRole("button", { name: "Signing in...", exact: true }),
  ).toBeDisabled()
}

test("workspace requires a real account and login/recovery failures stay honest", async ({
  page,
}) => {
  await page.goto("/dashboard")

  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole("button", { name: "Log In", exact: true }).click()

  await expect(page.getByText("This field is required.")).toHaveCount(2)

  await expect(page.getByLabel("Email Address")).toBeFocused()

  await page.getByLabel("Email Address").fill("unknown.person@example.test")

  await page

    .locator('input[autocomplete="current-password"]')

    .fill("WrongPassword111")

  await page.getByRole("button", { name: "Log In", exact: true }).click()

  await expect(page.getByRole("alert")).toContainText(/incorrect/i)

  await expect(page).toHaveURL(/\/login$/)

  await expect(
    page.locator('input[autocomplete="current-password"]'),
  ).toHaveValue("WrongPassword111")

  await page.goto("/jobseeker/onboarding/5")

  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole("link", { name: "Forgot Password?" }).click()

  await expect(
    page.getByRole("heading", { name: "Password recovery" }),
  ).toBeVisible()

  await expect(page.getByText(/No reset email has been sent/)).toBeVisible()
})

test("registration saves the account, normalizes the mobile number, and begins step one", async ({
  page,
}) => {
  await recordMotion(page)

  const values = account("New")

  await page.goto("/register")

  await page

    .getByRole("textbox", { name: "First Name", exact: true })

    .fill(values.first_name)

  await page

    .getByRole("textbox", { name: "Last Name", exact: true })

    .fill(values.last_name)

  await page.getByLabel("Email Address").fill(values.email)

  await page.getByLabel("Mobile Number").fill("917abc1234567")

  await expect(page.getByLabel("Mobile Number")).toHaveValue("917 123 4567")

  await page

    .locator('input[autocomplete="new-password"]')

    .first()

    .fill(values.password)

  await page

    .locator('input[autocomplete="new-password"]')

    .last()

    .fill(values.password)

  await page.getByRole("checkbox", { name: /^I agree/ }).check()

  const registration = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/register") &&
      response.request().method() === "POST",
  )

  await page

    .getByRole("button", { name: "Create Account", exact: true })

    .click()

  expect((await registration).status()).toBe(201)

  await expect(page).toHaveURL(/\/login$/)

  await expect(page.getByText(/Account created. Log in/)).toBeVisible()

  await expect(page.getByLabel("Email Address")).toHaveValue(values.email)

  await expectPanelMotion(page, "forward")

  expect((await callAccount(page, "/api/jobseeker/onboarding")).status).toBe(
    401,
  )

  await signIn(page, values)

  await expect(page).toHaveURL(/\/jobseeker\/onboarding\/1$/)

  await expect(
    page.getByRole("heading", { name: "Personal Information", exact: true }),
  ).toBeVisible()

  await expectPanelMotion(page, "forward", "onboarding-main")

  const saved = await callAccount(page, "/api/jobseeker/onboarding")

  expect(saved.body.data.personal.mobile_number).toBe("+639171234567")

  await page.reload()

  await expect(
    page.getByRole("textbox", { name: "First Name", exact: true }),
  ).toHaveValue("New")
})

test("returning users resume the first incomplete step and cannot bypass it", async ({
  page,
}) => {
  await recordMotion(page)

  const values = account("Returning")

  await createAccount(page, values)

  await saveSection(page, "personal", personal(values.first_name))

  const saved = await saveSection(page, "education", education)

  expect(saved.onboarding.current_step).toBe(3)

  const bypass = await callAccount(
    page,

    "/api/jobseeker/onboarding/preferences",

    "PATCH",

    {
      occupations: ["Office Assistant"],

      preferred_location: "Bansud",

      employment_types: ["Full-time"],

      work_arrangements: ["On-site"],

      willing_to_relocate: false,
    },
  )

  expect(bypass.status).toBe(422)

  await callAccount(page, "/api/auth/logout", "POST")

  await signIn(page, values)

  await expect(page).toHaveURL(/\/jobseeker\/onboarding\/3$/)

  await expectPanelMotion(page, "forward", "onboarding-main")

  await expect(
    page.getByRole("heading", { name: "Skills & Qualifications", exact: true }),
  ).toBeVisible()

  await page.emulateMedia({ reducedMotion: "reduce" })

  await callAccount(page, "/api/auth/logout", "POST")

  await signIn(page, values)

  await expect(page).toHaveURL(/\/jobseeker\/onboarding\/3$/)

  expect(await page.evaluate(() => window.navigationMotion)).toEqual([])

  await expect(page.locator("#onboarding-main")).toHaveCSS(
    "animation-name",

    "none",
  )

  await page.goto("/dashboard")

  await expect(page).toHaveURL(/\/jobseeker\/onboarding\/3$/)

  await page.goto("/jobseeker/onboarding/5")

  await expect(page).toHaveURL(/\/jobseeker\/onboarding\/3$/)

  const restored = await callAccount(page, "/api/jobseeker/onboarding")

  expect(restored.body.data.education.school_name).toBe(education.school_name)
})

test("completed profiles return to dashboard with 100 percent server completion", async ({
  page,
}) => {
  await recordMotion(page)

  const values = account("Completed")

  await createAccount(page, values)

  expect(
    (await callAccount(page, "/api/jobseeker/onboarding/complete", "POST"))
      .status,
  ).toBe(422)

  await saveSection(page, "personal", personal(values.first_name))

  await saveSection(page, "education", education)

  const skills = await callAccount(page, "/api/skills")

  await saveSection(page, "skills", {
    skills: [skills.body.data[0].id],

    certifications: [],

    languages: [],

    licenses: [],
  })

  await saveSection(page, "work-experience", {
    has_experience: false,

    experiences: [],
  })

  await saveSection(page, "preferences", {
    occupations: ["Office Assistant"],

    preferred_industry: "Administration",

    preferred_location: "Bansud",

    employment_types: ["Full-time"],

    work_arrangements: ["On-site"],

    willing_to_relocate: false,
  })

  const complete = await callAccount(
    page,

    "/api/jobseeker/onboarding/complete",

    "POST",
  )

  expect(complete.status).toBe(200)

  expect(complete.body.onboarding.completed).toBe(true)

  expect(complete.body.onboarding.completion_percentage).toBe(100)

  await callAccount(page, "/api/auth/preferences", "PATCH", {
    dashboard_tour_completed: true,
  })

  await callAccount(page, "/api/auth/logout", "POST")

  await signIn(page, values)

  await expect(page).toHaveURL(/\/dashboard$/)

  await expectPanelMotion(page, "forward", "workspace-main")

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Completed",
  )

  await page.reload()

  await expect(page).toHaveURL(/\/dashboard$/)

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Completed",
  )

  await page.goto("/jobseeker/onboarding/complete")

  await expect(
    page.getByRole("heading", {
      name: "Your Jobseeker Profile is Ready",

      exact: true,
    }),
  ).toBeVisible()

  await expect(
    page.getByText("100% complete", { exact: true }).first(),
  ).toBeVisible()
})

test("registration API failure preserves entered fields and exposes retry", async ({
  page,
}) => {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 503,

      contentType: "application/json",

      body: JSON.stringify({
        message: "Account service is temporarily unavailable. Try again.",
      }),
    }),
  )

  await page.goto("/register")

  await page

    .getByRole("textbox", { name: "First Name", exact: true })

    .fill("Retry")

  await page

    .getByRole("textbox", { name: "Last Name", exact: true })

    .fill("Test")

  await page.getByLabel("Email Address").fill("retry@example.test")

  await page.getByLabel("Mobile Number").fill("9171234567")

  await page

    .locator('input[autocomplete="new-password"]')

    .first()

    .fill(password)

  await page.locator('input[autocomplete="new-password"]').last().fill(password)

  await page.getByRole("checkbox", { name: /^I agree/ }).check()

  await page

    .getByRole("button", { name: "Create Account", exact: true })

    .click()

  await expect(page.getByRole("alert")).toContainText("temporarily unavailable")

  await expect(
    page.getByRole("textbox", { name: "First Name", exact: true }),
  ).toHaveValue("Retry")

  await expect(page.getByLabel("Email Address")).toHaveValue(
    "retry@example.test",
  )

  await expect(
    page.getByRole("button", { name: "Create Account", exact: true }),
  ).toBeEnabled()

  await expect(page).toHaveURL(/\/register$/)
})
