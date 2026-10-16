import {
  test,
  expect,
  apiCall,
  personal,
  education,
  preferences,
} from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

test("home feed is separate, announcements undo, Jobs tabs and search/filter/sort", async ({
  page,
}) => {
  test.setTimeout(90000)

  await page.goto("/dashboard")

  await expect(
    page.getByRole("region", { name: "Employment updates", exact: true }),
  ).toBeVisible()

  await expect(page.locator('[data-tour="jobs"] article')).toHaveCount(3)

  await page

    .getByRole("button", { name: /^Save announcement:/ })

    .first()

    .click()

  await expect(page.getByRole("status")).toContainText("Announcement saved.")

  await page.getByRole("button", { name: "Undo", exact: true }).click()

  await expect(
    page.getByRole("button", { name: /^Save announcement:/ }).first(),
  ).toHaveAttribute("aria-pressed", "false")

  await page

    .getByRole("link", { name: "View all recommended jobs", exact: true })

    .click()

  await expect(page).toHaveURL(/\/jobs\?tab=recommended/)

  const tabs = page.getByRole("tablist", { name: "Jobs views" })

  await tabs

    .getByRole("tab", { name: "Recommended for You", exact: true })

    .focus()

  await page.keyboard.press("ArrowRight")

  await expect(
    tabs.getByRole("tab", { name: "Browse All Jobs", exact: true }),
  ).toHaveAttribute("aria-selected", "true")

  await page

    .getByRole("textbox", { name: "Search jobs", exact: true })

    .fill("customer")

  await page

    .getByRole("form", { name: "Search job opportunities", exact: true })

    .getByRole("button", { name: "Search", exact: true })

    .click()

  await expect(page).toHaveURL(/q=customer/)

  await expect(page.getByLabel("Job results").getByRole("heading", {
      name: "Customer Service Representative",

      exact: true,
    })).toBeVisible()

  await page

    .getByRole("textbox", { name: "Search jobs", exact: true })

    .fill("Bongabong")

  await page

    .getByRole("form", { name: "Search job opportunities", exact: true })

    .getByRole("button", { name: "Search", exact: true })

    .click()

  await expect(page).toHaveURL(/q=Bongabong/)

  await expect(page.getByLabel("Job results").locator("article")).toHaveCount(1)

  await page.getByRole("button", { name: "Clear All", exact: true }).click()

  const filters = page.getByRole("form", { name: "Job filters", exact: true })

  await filters

    .getByLabel("Employment Type", { exact: true })

    .selectOption("Temporary")

  await filters

    .getByRole("button", { name: "Apply Filters", exact: true })

    .click()

  await expect(
    page.getByRole("heading", { name: "No jobs found", exact: true }),
  ).toBeVisible()

  await page

    .getByRole("button", { name: "Remove Temporary filter", exact: true })

    .click()

  await page.getByLabel("Sort by").selectOption("match")

  await expect
    .poll(async () => {
      const scores = await page
        .getByLabel("Job results")
        .locator("article")
        .evaluateAll((cards) =>
          cards.map((card) => Number(card.innerText.match(/(\d+)% Match/)[1])),
        )

      return (
        scores.length > 0 &&
        scores.every((score, index) => !index || score <= scores[index - 1])
      )
    })
    .toBe(true)
})

test("job match to skills, training, PESO request, outcome and dashboard cycle", async ({
  page,
}) => {
  test.setTimeout(90000)

  const calls = []

  page.on("request", (request) => {
    if (
      /\/api\/(jobs|saved-jobs|training|referrals|applications)(?:\/|\?|$)/.test(
        request.url(),
      )
    )
      calls.push(request.url())
  })

  await page.goto("/jobs?tab=recommended")

  await page

    .getByLabel("Job results")

    .locator("article")

    .first()

    .getByRole("button", { name: "Why You Match", exact: true })

    .click()

  const modal = page.getByRole("dialog", { name: "Why You Match", exact: true })

  await expect(modal).toContainText("Microsoft Excel")

  await expect(modal).toContainText("Basic Reporting")

  await modal.getByRole("link", { name: "View Full Job", exact: true }).click()

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Customer Service Representative",
  )

  await expect(
    page.getByRole("button", { name: "Apply Now", exact: false }),
  ).toHaveCount(0)

  await page.getByRole("link", { name: "View Training", exact: true }).click()

  await expect(page).toHaveURL(/training\/excel\?job=customer-service/)

  await expect(
    page.getByText(/Customer Service Representative lists skills/),
  ).toBeVisible()

  await page

    .getByRole("link", { name: "Back to target job", exact: true })

    .click()

  await page

    .getByRole("button", { name: "Request PESO Assistance", exact: true })

    .click()

  await page.getByRole("dialog").getByRole("checkbox").check()

  await page

    .getByRole("button", { name: "Submit Request", exact: true })

    .click()

  await page

    .getByRole("link", { name: "View Assistance Status", exact: true })

    .click()

  await expect(page.locator("#assistance-status")).toContainText(
    "Request Received",
  )

  await page

    .getByRole("button", { name: "Withdraw Request", exact: true })

    .click()

  await page

    .getByRole("dialog")

    .getByRole("button", { name: "Withdraw Request", exact: true })

    .click()

  await page.goto("/dashboard")

  await expect(
    page.getByRole("heading", { name: "Employment Outcome", exact: true }),
  ).toBeVisible()

  await expect(
    page.getByText("Request Withdrawn. User withdrew request."),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByText("Request Withdrawn. User withdrew request."),
  ).toBeVisible()

  expect(calls).toEqual([])
})

test("saved jobs and training survive reload, unsave undo and empty state", async ({
  page,
}) => {
  await page.goto("/jobseeker/jobs/customer-service")

  await page.getByRole("button", { name: "Save Job", exact: true }).click()

  await page.goto("/jobs?tab=saved")

  await page.reload()

  await expect(page.getByLabel("Job results").locator("article")).toHaveCount(1)

  await page

    .getByRole("button", {
      name: "Unsave job: Customer Service Representative",

      exact: true,
    })

    .click()

  await expect(
    page.getByRole("heading", { name: "No saved jobs yet.", exact: true }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Undo", exact: true }).click()

  await expect(page.getByLabel("Job results").locator("article")).toHaveCount(1)

  await page.goto("/jobseeker/training/excel")

  await page

    .getByRole("button", { name: "Bookmark Training", exact: true })

    .first()

    .click()

  await page.goto("/jobseeker/training?tab=saved")

  await page.reload()

  await expect(
    page.getByRole("heading", {
      name: "Microsoft Excel Essentials",

      exact: true,
    }),
  ).toBeVisible()
})

for (const width of [1440, 390])
  test(`journey layouts, tabs, guidance and mobile filters ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000)

    await page.setViewportSize({ width, height: 900 })

    const errors = []

    page.on("pageerror", (error) => errors.push(error.message))

    for (const [route, name] of [
      ["/dashboard", "home"],

      ["/jobs?tab=recommended", "recommended"],

      ["/jobs?tab=browse", "browse"],

      ["/jobs?tab=saved", "saved"],

      ["/jobseeker/jobs/customer-service", "detail"],

      ["/jobseeker/training", "training"],

      ["/jobseeker/training/excel?job=customer-service", "course"],

      ["/jobseeker/assistance", "peso"],

      ["/jobseeker/settings", "settings"],
    ]) {
      await page.goto(route)

      await expect(page.locator("h1")).toHaveCount(1)

      await expect(
        page.getByText("Restoring your session...", { exact: true }),
      ).not.toBeVisible({ timeout: 15000 })

      await page.evaluate(() => document.fonts.ready)

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),

        route,
      ).toBe(true)

      expect(
        (
          await new AxeBuilder({ page })

            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

            .analyze()
        ).violations,

        route,
      ).toEqual([])

      await page.screenshot({
        path: `test-results/screenshots/journey-${name}-${width}.png`,

        fullPage: true,
      })
    }

    if (width === 390) {
      await page.goto("/jobs?tab=browse")

      await page.getByRole("button", { name: "Filters", exact: true }).click()

      const drawer = page.getByRole("dialog", {
        name: "Filter job opportunities",

        exact: true,
      })

      await expect(drawer).toBeVisible()

      await drawer

        .getByLabel("Work Arrangement", { exact: true })

        .selectOption("Remote")

      await drawer

        .getByRole("button", { name: "Apply Filters", exact: true })

        .click()

      await expect(drawer).not.toBeVisible()

      await expect(
        page.getByRole("heading", { name: "No jobs found", exact: true }),
      ).toBeVisible()
    }

    expect(errors).toEqual([])
  })

test("account settings validates password, persists updates and deletes only disposable account", async ({
  page,

  context,
}) => {
  test.setTimeout(180000)

  await context.clearCookies()

  const email = `security.${Date.now()}@example.test`,
    password = "JourneySecurity482!"

  expect(
    (
      await apiCall(page.request, "/api/auth/register", "POST", {
        first_name: "Security",

        last_name: "Check",

        email,

        password,

        password_confirmation: password,
      })
    )

      .status(),
  ).toBe(201)

  expect(
    (
      await apiCall(page.request, "/api/auth/login", "POST", {
        email,

        password,
      })
    )

      .status(),
  ).toBe(200)

  for (const [section, body] of [
    ["personal", personal("Security")],

    ["education", education],

    [
      "skills",

      { skills: [1], certifications: [], languages: [], licenses: [] },
    ],

    ["work-experience", { has_experience: false, experiences: [] }],

    ["preferences", preferences],
  ])
    expect(
      (
        await apiCall(
          page.request,

          `/api/jobseeker/onboarding/${section}`,

          "PATCH",

          body,
        )
      )

        .status(),
    ).toBe(200)

  await apiCall(page.request, "/api/jobseeker/onboarding/complete", "POST")

  await apiCall(page.request, "/api/auth/preferences", "PATCH", {
    dashboard_tour_completed: true,
  })

  await page.goto("/jobseeker/settings")

  await expect(
    page.getByRole("textbox", { name: "Mobile number *", exact: true }),
  ).toHaveValue("9171234567")

  await page

    .getByRole("textbox", { name: "First Name", exact: true })

    .fill("Updated")

  await page

    .getByRole("textbox", {
      name: "Current Password to save account changes",

      exact: true,
    })

    .fill(password)

  await page

    .getByRole("button", { name: "Save Account Information", exact: true })

    .click()

  await expect(page.getByRole("status")).toContainText(
    "Account information updated.",
  )

  await page.reload()

  await expect(
    page.getByRole("textbox", { name: "First Name", exact: true }),
  ).toHaveValue("Updated")

  await page

    .getByRole("button", { name: "Send Verification Email", exact: true })

    .click()

  await expect(page.getByRole("status")).toContainText(
    "No verification email was sent",
  )

  await page

    .getByRole("textbox", { name: "Current Password", exact: true })

    .fill("WrongPassword")

  await page

    .getByRole("textbox", { name: "New Password", exact: true })

    .fill("NewJourney482!")

  await page

    .getByRole("textbox", { name: "Confirm New Password", exact: true })

    .fill("NewJourney482!")

  const invalidPasswordResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/password") &&
      response.request().method() === "PATCH",

    { timeout: 60000 },
  )

  await page

    .getByRole("button", { name: "Update Password", exact: true })

    .click()

  expect((await invalidPasswordResponse).status()).toBe(422)

  await expect(page.getByRole("alert")).toContainText(/password/i, {
    timeout: 30000,
  })

  await page

    .getByRole("textbox", { name: "Current Password", exact: true })

    .fill(password)

  await page

    .getByRole("button", { name: "Update Password", exact: true })

    .click()

  await expect(page.getByRole("status")).toContainText("Password updated.")

  await page

    .getByRole("button", { name: "Delete Account", exact: true })

    .click()

  await page

    .getByRole("button", { name: "Keep My Account", exact: true })

    .click()

  await expect(page.getByRole("dialog")).not.toBeVisible()

  await page

    .getByRole("button", { name: "Delete Account", exact: true })

    .click()

  await page

    .getByRole("textbox", { name: "Confirm current password", exact: true })

    .fill("NewJourney482!")

  await page

    .getByRole("button", { name: "Permanently Delete Account", exact: true })

    .click()

  await expect(page).toHaveURL(/\/home$/)

  expect((await apiCall(page.request, "/api/auth/user")).status()).toBe(401)
})

test("workspace forward/back motion and share copy fallback", async ({
  page,

  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])

  await page.goto("/jobs?tab=recommended")

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Jobs")

  await page.evaluate(() => {
    window.workspaceMotion = []

    const original = document.startViewTransition.bind(document)

    document.startViewTransition = (...args) => {
      const transition = original(...args)

      transition.ready

        .then(() =>
          window.workspaceMotion.push({
            direction: document.documentElement.dataset.pageTransition,

            frames: document

              .getAnimations()

              .filter((a) => a.animationName?.startsWith("page-"))

              .map((a) => ({
                name: a.animationName,

                target: a.effect.pseudoElement,

                duration: a.effect.getTiming().duration,

                frames: a.effect.getKeyframes(),
              })),
          }),
        )

        .catch(() => {})

      return transition
    }

    Object.defineProperty(navigator, "share", {
      value: undefined,

      configurable: true,
    })
  })

  await page

    .getByLabel("Job results")

    .locator("article")

    .first()

    .getByRole("link", { name: /^View Customer/ })

    .click()

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Customer Service Representative",
  )

  for (const direction of ["journey-forward", "journey-back"]) {
    if (direction === "journey-back")
      await page

        .getByRole("link", { name: "Back to Jobs", exact: true })

        .click()

    await expect

      .poll(() => page.evaluate(() => window.workspaceMotion.at(-1)?.direction))

      .toBe(direction)

    const motion = await page.evaluate(
      () => window.workspaceMotion.at(-1).frames,
    )

    expect(motion).toHaveLength(2)

    for (const item of motion) {
      expect(item.duration).toBe(400)

      expect(item.target).toContain("workspace")
    }

    expect(
      motion.find((item) => item.name.startsWith("page-exit")).frames.at(-1)
        .transform,
    ).toBe(`translateX(${direction === "journey-back" ? 24 : -24}px)`)

    if (direction === "journey-forward") {
      await page.getByRole("button", { name: "Share Job", exact: true }).click()

      await expect(page.getByRole("status")).toContainText("Job link copied.")

      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        "http://127.0.0.1:8443/jobseeker/jobs/customer-service",
      )
    }
  }

  await page.emulateMedia({ reducedMotion: "reduce" })

  expect(
    await page.evaluate(
      () =>
        getComputedStyle(
          document.documentElement,

          "::view-transition-new(workspace)",
        ).animationName,
    ),
  ).toBe("none")
})

test("browser demo bookmarks remain scoped to the authenticated account", async ({
  page,

  context,
}) => {
  test.setTimeout(120000)

  // Create an independent session; logging out must not invalidate the worker fixture.

  await context.clearCookies()

  const firstEmail = `first-isolation.${Date.now()}@example.test`,
    firstPassword = "FirstIsolation482!"

  expect(
    (
      await apiCall(page.request, "/api/auth/register", "POST", {
        first_name: "First",

        last_name: "Account",

        email: firstEmail,

        password: firstPassword,

        password_confirmation: firstPassword,
      })
    )

      .status(),
  ).toBe(201)

  expect(
    (
      await apiCall(page.request, "/api/auth/login", "POST", {
        email: firstEmail,

        password: firstPassword,
      })
    )

      .status(),
  ).toBe(200)

  for (const [section, body] of [
    ["personal", personal("First")],

    ["education", education],

    [
      "skills",

      { skills: [1], certifications: [], languages: [], licenses: [] },
    ],

    ["work-experience", { has_experience: false, experiences: [] }],

    ["preferences", preferences],
  ])
    expect(
      (
        await apiCall(
          page.request,

          `/api/jobseeker/onboarding/${section}`,

          "PATCH",

          body,
        )
      )

        .status(),
    ).toBe(200)

  await apiCall(page.request, "/api/jobseeker/onboarding/complete", "POST")

  await apiCall(page.request, "/api/auth/preferences", "PATCH", {
    dashboard_tour_completed: true,
  })

  const firstUser = (
    await (await apiCall(page.request, "/api/auth/user")).json()
  ).user.id

  await page.goto("/jobseeker/jobs/customer-service")

  await page.getByRole("button", { name: "Save Job", exact: true }).click()

  const key = `pesomatch:demo:${firstUser}:saved-jobs`

  await expect

    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key),
    )

    .toEqual(["customer-service"])

  await apiCall(page.request, "/api/auth/logout", "POST")

  const email = `isolation.${Date.now()}@example.test`,
    password = "Isolation482!"

  expect(
    (
      await apiCall(page.request, "/api/auth/register", "POST", {
        first_name: "Separate",

        last_name: "Account",

        email,

        password,

        password_confirmation: password,
      })
    )

      .status(),
  ).toBe(201)

  expect(
    (
      await apiCall(page.request, "/api/auth/login", "POST", {
        email,

        password,
      })
    )

      .status(),
  ).toBe(200)

  for (const [section, body] of [
    ["personal", personal("Separate")],

    ["education", education],

    [
      "skills",

      { skills: [1], certifications: [], languages: [], licenses: [] },
    ],

    ["work-experience", { has_experience: false, experiences: [] }],

    ["preferences", preferences],
  ]) {
    expect(
      (
        await apiCall(
          page.request,

          `/api/jobseeker/onboarding/${section}`,

          "PATCH",

          body,
        )
      )

        .status(),
    ).toBe(200)
  }

  await apiCall(page.request, "/api/jobseeker/onboarding/complete", "POST")

  await apiCall(page.request, "/api/auth/preferences", "PATCH", {
    dashboard_tour_completed: true,
  })

  await page.goto("/jobs?tab=saved")

  await expect(
    page.getByRole("heading", { name: "No saved jobs yet.", exact: true }),
  ).toBeVisible()

  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key),
  ).toEqual(["customer-service"])

  expect(
    (
      await apiCall(page.request, "/api/auth/account", "DELETE", {
        current_password: password,
      })
    )

      .status(),
  ).toBe(200)
})
