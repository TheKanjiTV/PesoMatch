import fs from "node:fs/promises"
import { test, expect, apiCall, provisionAndSignIn } from "./helpers.js"

test.use({ autoDismissAiPrivacy: false })

test("training request saves four steps and retains values when going back", async ({
  page,
  account,
}) => {
  await page.goto("/training-demand")
  await expect(
    page.getByText("This page shows only the topics", { exact: false }),
  ).toHaveCount(0)
  await page
    .getByRole("button", { name: "Request a training topic", exact: true })
    .click()
  await page
    .getByLabel("Training / skill topic", { exact: true })
    .fill("Browser digital records")
  await page
    .getByLabel("What would you like to learn?", { exact: true })
    .fill("Maintain digital records and spreadsheets.")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Step 2: Dates" }),
  ).toBeVisible()
  const start = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const end = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10)
  await page.getByLabel("Preferred start date", { exact: true }).fill(start)
  await page.getByLabel("Preferred end date", { exact: true }).fill(end)
  await page
    .getByLabel("Preferred days and time", { exact: true })
    .fill("Saturday mornings")
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    page.getByLabel("Training / skill topic", { exact: true }),
  ).toHaveValue("Browser digital records")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(
    page.getByLabel("Preferred days and time", { exact: true }),
  ).toHaveValue("Saturday mornings")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByLabel("Training mode", { exact: true }).selectOption("Online")
  await page
    .getByLabel("Preferred training location", { exact: true })
    .fill("Mansalay")
  await page
    .getByLabel("How will this training help you?", { exact: true })
    .fill("Prepare for office support work.")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Step 4: Review" }),
  ).toBeVisible()
  await fs.mkdir("artifacts/workspace-refinement", { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 950 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page
      .locator("main")
      .screenshot({
        path: `artifacts/workspace-refinement/training-review-${width}.png`,
      })
  }
  await page
    .getByRole("button", { name: "Submit training request", exact: true })
    .click()
  await expect(
    page.getByText("Training topic request submitted.", { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Browser digital records", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Saturday mornings", { exact: true }),
  ).toBeVisible()
  const stored = await (
    await apiCall(account.request, "/api/v1/platform/training-demands")
  ).json()
  expect(stored.data[0].goal).toBe("Prepare for office support work.")
})

test("vacancies show scores and compact generic AI consent across themes and widths", async ({
  page,
}) => {
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.route("**/api/v1/platform/ai/status", (r) =>
    r.fulfill({ json: { configured: true, notice_version: "synthetic-v1" } }),
  )
  let matchingCalls = 0
  await page.route("**/api/v1/platform/ai/vacancy-matches", async (r) => {
    matchingCalls++
    const body = r.request().postDataJSON()
    expect(body.consent).toBe(true)
    await r.fulfill({
      json: {
        scores: Object.fromEntries(body.vacancy_ids.map((id) => [id, 68])),
      },
    })
  })
  await page.goto("/jobs")
  await expect(page.getByLabel("Profile match").first()).toHaveText(
    /\d+% Match/,
  )
  expect(matchingCalls).toBe(0)
  await expect(
    page.getByRole("link", { name: "Job Matching", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Labor Market Information", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "Employment Outcomes", exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("button", { name: "Privacy & consent", exact: true })
    .click()
  const dialog = page.getByRole("dialog", {
    name: "AI privacy & response preferences",
  })
  await expect(dialog).toBeVisible()
  await expect(dialog).not.toContainText(/Cohere|TF-IDF|command-a/)
  await fs.mkdir("artifacts/workspace-refinement", { recursive: true })
  for (const theme of ["hc1", "hc2"]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.contrast = theme),
      theme,
    )
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 })
      const box = await dialog.boundingBox()
      expect(box.width).toBeLessThanOrEqual(600)
      expect(box.x).toBeGreaterThanOrEqual(0)
      await page.screenshot({
        path: `artifacts/workspace-refinement/ai-consent-${theme}-${width}.png`,
      })
    }
  }
  await dialog.getByRole("checkbox").check()
  await dialog.getByRole("button", { name: "Done", exact: true }).click()
  await expect(page.getByLabel("Profile match").first()).toHaveText("68% Match")
  expect(matchingCalls).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test("saved work history renders in profile and removed controls stay absent", async ({
  page,
  account,
}) => {
  const result = await apiCall(
    account.request,
    "/api/v1/jobseeker/onboarding/work-experience",
    "PATCH",
    {
      has_experience: true,
      experiences: [
        {
          job_title: "Records assistant",
          company_name: "Synthetic Browser Employer",
          start_date: "2025-01-01",
          end_date: "2025-06-01",
          is_current: false,
          description: "Maintained records.",
        },
      ],
    },
  )
  expect(result.status()).toBe(200)
  await page.goto("/profile")
  const section = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Work experience", exact: true }),
    })
  await expect(
    section.getByText("Synthetic Browser Employer", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("No work experience declared", { exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", {
      name: /Review & add (work experience|certificate)/i,
    }),
  ).toHaveCount(0)
  await page.goto("/settings")
  await expect(
    page.getByRole("heading", { name: "Account information", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", {
      name: "Replay workspace tutorial",
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(
    page.getByText("Your privacy requests", { exact: true }),
  ).toHaveCount(0)
})

test("interview actions align and do not display provider or model labels", async ({
  page,
}) => {
  await page.route("**/api/v1/platform/ai/status", (r) =>
    r.fulfill({ json: { configured: true, notice_version: "synthetic-v1" } }),
  )
  await page.route("**/api/v1/platform/ai/interviews", (r) =>
    r.fulfill({
      status: 201,
      json: {
        data: {
          id: 990111,
          version: 1,
          model: "command-a-03-2025",
          transcript: {
            turns: [
              {
                output: {
                  question: "How did you maintain records?",
                  feedback: [],
                  improvement: "",
                  summary: "",
                },
              },
            ],
          },
        },
      },
    }),
  )
  await page.goto("/ai-workspace")
  await page
    .getByRole("button", { name: "Mock interview", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Privacy & consent", exact: true })
    .click()
  const preferences = page.getByRole("dialog", {
    name: "AI privacy & response preferences",
  })
  await preferences.getByRole("checkbox").check()
  await preferences.getByRole("button", { name: "Done", exact: true }).click()
  const vacancy = page.getByRole("combobox", { name: "Selected vacancy" })
  const value = await vacancy.locator("option").nth(1).getAttribute("value")
  await vacancy.selectOption(value)
  await page
    .getByRole("button", { name: "Start five-question practice", exact: true })
    .click()
  const practice = page.getByRole("dialog", {
    name: "Five-question interview practice",
  })
  await expect(
    practice.getByRole("heading", { name: /How did you maintain records/ }),
  ).toBeVisible()
  await expect(practice).not.toContainText(
    /Cohere|command-a|Rubric:|Practice transcripts expire/,
  )
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const submit = await practice
      .getByRole("button", { name: "Submit answer & continue", exact: true })
      .boundingBox()
    const erase = await practice
      .getByRole("button", { name: "Delete this practice", exact: true })
      .boundingBox()
    if (width === 1440) expect(Math.abs(submit.y - erase.y)).toBeLessThan(2)
    expect(Math.abs(submit.height - erase.height)).toBeLessThan(2)
    await page.screenshot({
      path: `artifacts/workspace-refinement/interview-${width}.png`,
    })
  }
})

test("staff enable an interview outcome in its referral and keep replay admin-only", async ({
  page,
  account,
}) => {
  await provisionAndSignIn(account, page, "peso_staff")
  const row = {
    id: 990112,
    status: "interviewing",
    created_at: "2026-11-20T00:00:00Z",
    interview_at: "2026-11-20T01:00:00Z",
    outcome_enabled: false,
    user: { name: "Synthetic Interview Applicant" },
    vacancy: {
      id: 990113,
      title: "Synthetic Records Assistant",
      organization: "Synthetic Employer",
    },
  }
  await page.route("**/api/v1/platform/referrals**", async (r) => {
    if (r.request().method() === "PATCH") {
      const body = r.request().postDataJSON()
      row.outcome_enabled = body.enabled
      row.interview_result = body.result || row.interview_result || "pending"
      row.interview_result_notes = body.notes || ""
      return r.fulfill({ json: { data: row } })
    }
    return r.fulfill({
      json: { data: [row], current_page: 1, last_page: 1, total: 1 },
    })
  })
  await page.goto("/referrals")
  await expect(
    page.getByRole("button", { name: "Update interview outcome", exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole("switch", { name: "Show interview outcome", exact: true })
    .click()
  await expect(
    page.getByText("Awaiting decision", { exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Update interview outcome", exact: true })
    .click()
  const editor = page.getByRole("dialog", {
    name: "Interview outcome",
    exact: true,
  })
  await editor
    .getByRole("combobox", { name: "Interview decision" })
    .selectOption("accepted")
  await editor.getByRole("button", { name: "Save record", exact: true }).click()
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible()
  await page
    .getByRole("switch", { name: "Show interview outcome", exact: true })
    .click()
  await expect(page.getByText("Accepted", { exact: true })).toHaveCount(0)
  await page.goto("/settings")
  await expect(
    page.getByRole("button", {
      name: "Replay workspace tutorial",
      exact: true,
    }),
  ).toHaveCount(0)
})
