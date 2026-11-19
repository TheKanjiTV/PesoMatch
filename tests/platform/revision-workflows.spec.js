import fs from "node:fs/promises"
import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const staff = {
  id: 990001,
  name: "Synthetic PESO Staff",
  first_name: "Synthetic",
  role: "peso_staff",
  dashboard_tour_completed_at: "2026-11-19T00:00:00Z",
}
const program = {
  id: 990002,
  title: "Computer Literacy",
  provider: "PESO / Mansalay partnership",
  location: "Mansalay",
  mode: "In person",
  description: "Synthetic browser fixture only.",
  requirements: "Participant consent",
  skills: ["Computer Literacy"],
  capacity: 2,
  occupied_places: 1,
  pending_requests: 0,
  starts_on: "2027-02-01",
  ends_on: "2027-02-05",
  schedule: "Weekdays",
  fee: 0,
  status: "published",
  external_enrollment: false,
}
const vacancy = {
  id: 990003,
  title: "Office Assistant",
  organization: "Synthetic employer",
  location: "Mansalay",
  industry: "Services",
  employment_type: "Full-time",
  description: "Record customer requests.",
  skills: ["Computer Literacy"],
  slots: 1,
  deadline: "2027-02-01",
  status: "published",
}

test.beforeEach(async () => {
  await fs.mkdir("artifacts/revision-2026-11-19", { recursive: true })
})

async function mock(context, role = "peso_staff", configured = false) {
  const user = { ...staff, role }
  const participants = []
  let practice = null
  const list = (data) => ({
    data,
    total: data.length,
    current_page: 1,
    last_page: 1,
  })
  await context.route("**/sanctum/csrf-cookie", (r) =>
    r.fulfill({ status: 204 }),
  )
  await context.route("**/api/**", async (r) => {
    const req = r.request(),
      path = new URL(req.url()).pathname
    let json = {}
    if (path === "/api/auth/user")
      json = { user, onboarding: { completed: true } }
    else if (path === "/api/platform/summary")
      json = {
        saved: [],
        counts: {},
        referrals: 0,
        enrollments: 0,
        placements: 0,
        services: 0,
      }
    else if (path === "/api/platform/training")
      json = list([{ ...program, occupied_places: 1 + participants.length }])
    else if (path === "/api/platform/vacancies") json = list([vacancy])
    else if (path === `/api/platform/training/${program.id}/participants`) {
      if (req.method() === "POST")
        participants.push({
          id: 1,
          ...req.postDataJSON(),
          status: "confirmed",
        })
      json = list(participants)
    } else if (path === "/api/platform/ai/status")
      json = {
        configured,
        notice_version: "cohere-employment-v1",
        notice:
          "With consent, minimized profile facts and selected vacancy are sent to Cohere.",
      }
    else if (path === "/api/platform/ai/adviser")
      json = {
        model: "command-a-03-2025",
        generated: true,
        data: {
          relevant_evidence: [
            {
              evidence_id: "skill-1",
              quote: "Computer Literacy",
              relevance: "Relevant to office tasks.",
            },
          ],
          not_stated: ["License is not stated."],
          questions: ["Can you describe an office task?"],
          steps: ["Discuss the stated requirements with PESO."],
          training_ids: [program.id],
          training: [{ ...program, url: `/training/${program.id}` }],
        },
      }
    else if (path === "/api/platform/ai/resume-review")
      json = {
        model: "command-a-03-2025",
        scope: "Extracted excerpt only.",
        data: {
          relevance: "Office tasks are relevant.",
          clarity: "Use concrete wording.",
          completeness: "Results are not stated.",
          questions: ["What requests did you record?"],
          suggestions: [
            {
              original: "I recorded requests.",
              revision: "Recorded requests.",
              reason: "Concise wording.",
            },
          ],
        },
      }
    else if (path === "/api/platform/ai/interviews") {
      practice = {
        id: 99,
        version: 1,
        model: "command-a-03-2025",
        completed_at: null,
        transcript: {
          turns: [
            {
              output: {
                question: "How did you record customer requests?",
                feedback: [],
                improvement: "",
                summary: "",
              },
            },
          ],
        },
      }
      json = { data: practice }
    } else if (path === "/api/platform/ai/interviews/99/answer") {
      const input = req.postDataJSON()
      practice.transcript.turns.at(-1).answer = input.answer
      const last = practice.version === 5
      practice.transcript.turns.push({
        output: {
          question: last ? "" : "Which details did you record?",
          feedback: [
            "relevance",
            "clarity",
            "specific_examples",
            "organization",
          ].map((criterion) => ({
            criterion,
            score: 3,
            evidence_quote: input.answer,
            comment: "Your answer states an action.",
          })),
          improvement: "Explain the request using your actual facts.",
          summary: last
            ? "You practised explaining your own records work."
            : "",
        },
      })
      practice.version++
      if (last) practice.completed_at = "2026-11-19T00:00:00Z"
      json = { data: practice }
    } else if (path === "/api/platform/users") json = list([user])
    else if (path === "/api/platform/login-policy")
      json = {
        stages: [
          { attempts: 5, lockout_minutes: 15 },
          { attempts: 3, lockout_minutes: 30 },
          { attempts: 2, lockout_minutes: 60 },
        ],
      }
    else if (path === "/api/platform/referrals")
      json = list([
        { id: 1, user, vacancy, status: "requested", created_at: "2026-11-19" },
      ])
    else if (path === "/api/platform/enrollments")
      json = list([
        { id: 1, user, program, status: "requested", created_at: "2026-11-19" },
      ])
    else if (path === "/api/platform/events") json = list([])
    else if (path === "/api/platform/outcomes") json = list([])
    else if (path === "/api/platform/placements") json = list([])
    else if (path === "/api/platform/jobseekers") json = list([])
    return r.fulfill({ json })
  })
  return participants
}

test("PESO staff add forms, catalog preview and assisted participant enrollment use accessible modals", async ({
  page,
  context,
}) => {
  const participants = await mock(context)
  await page.goto("/training")
  await page.getByRole("button", { name: "Add training program" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("textbox", { name: "Program title" }).fill("New program")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Add training program" }),
  ).toBeFocused()
  await page.getByRole("link", { name: "View program", exact: true }).click()
  const detail = page.getByRole("dialog")
  await expect(detail).toBeVisible()
  await expect(page).toHaveURL(/\/training$/)
  await expect(
    detail.getByText("1 available / 2 places", { exact: false }),
  ).toBeVisible()
  await detail
    .getByRole("button", { name: "Enroll participant / walk-in" })
    .click()
  const form = page.getByRole("dialog").last()
  await form
    .getByRole("textbox", { name: "Walk-in full name", exact: false })
    .fill("Synthetic Attendee")
  await form
    .getByRole("textbox", { name: "Municipality / partner area" })
    .fill("Mansalay")
  await form
    .getByRole("textbox", { name: "Unique office roster reference" })
    .fill("BROWSER-001")
  await form.getByLabel("Participant consent recorded").selectOption("yes")
  await form
    .getByRole("textbox", { name: "Enrollment verification / consent record" })
    .fill("Synthetic participant consent recorded for isolated test.")
  await form.getByRole("button", { name: "Save record" }).click()
  await expect(page.getByText("Synthetic Attendee · Mansalay")).toBeVisible()
  expect(participants).toHaveLength(1)
  const axe = await new AxeBuilder({ page })
    .include("dialog[open]")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(axe.violations).toEqual([])
  await detail.evaluate((dialog) => {
    dialog.scrollTop = 0
  })
  await page.screenshot({
    path: "artifacts/revision-2026-11-19/training-desktop.png",
    fullPage: false,
  })
})

test("vacancy, referral and enrollment details plus status forms open as modals", async ({
  page,
  context,
}) => {
  await mock(context)
  await page.goto("/jobs")
  await page.getByRole("button", { name: "Add vacancy" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("link", { name: "View vacancy", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("button", { name: "Update vacancy status" }).click()
  await expect(
    page.getByRole("dialog").last().getByLabel("Publication status"),
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page.keyboard.press("Escape")
  for (const [path, name] of [
    ["/referrals", "View vacancy"],
    ["/enrollments", "View program"],
  ]) {
    await page.goto(path)
    await page.getByRole("link", { name, exact: true }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page).toHaveURL(new RegExp(path + "$"))
    await page.keyboard.press("Escape")
    await page
      .getByRole("button", { name: "Update status", exact: true })
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
  }
})

test("account creation, employment report and event forms are modal", async ({
  page,
  context,
}) => {
  await mock(context, "admin")
  await page.goto("/users")
  await page.getByRole("button", { name: "Add new account" }).click()
  await expect(
    page.getByRole("dialog").getByLabel("Account role"),
  ).toBeVisible()
  await expect(
    page.getByRole("option", { name: "PESO Staff", exact: true }),
  ).toHaveCount(1)
  await page.keyboard.press("Escape")
  await page.goto("/events")
  await page.getByRole("button", { name: "Add event / program" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.goto("/outcomes")
  await page.getByRole("button", { name: "Report employment status" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("AI has explicit unavailable state and consent-gated model suggestions on mobile", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mock(context, "jobseeker", false)
  await page.goto("/ai-workspace")
  await expect(
    page.getByText("AI model unavailable:", { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Generate career advice" }),
  ).toBeDisabled()
  await page.screenshot({
    path: "artifacts/revision-2026-11-19/ai-unavailable-mobile.png",
    fullPage: true,
  })
  await context.unroute("**/api/**")
  await mock(context, "jobseeker", true)
  await page.reload()
  await page.getByLabel("Selected vacancy").selectOption(String(vacancy.id))
  await expect(
    page.getByRole("button", { name: "Generate career advice" }),
  ).toBeDisabled()
  await page.getByRole("checkbox", { name: "I consent", exact: false }).check()
  await page.getByRole("button", { name: "Generate career advice" }).click()
  await expect(page.getByText("License is not stated.")).toBeVisible()
  await page.getByRole("button", { name: "Résumé review", exact: true }).click()
  await page
    .getByRole("button", { name: "Review résumé for this vacancy" })
    .click()
  await page.getByRole("button", { name: "Accept suggestion" }).click()
  await expect(
    page.getByLabel("Accepted statements", { exact: false }),
  ).toHaveValue("Recorded requests.")
  await page.getByRole("button", { name: "Reject suggestion" }).click()
  await expect(
    page.getByLabel("Accepted statements", { exact: false }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy()
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  expect(axe.violations).toEqual([])
  await page.screenshot({
    path: "artifacts/revision-2026-11-19/ai-review-mobile.png",
    fullPage: true,
  })
})

test("text interview submits actual answers one at a time and reaches final practice summary", async ({
  page,
  context,
}) => {
  await mock(context, "jobseeker", true)
  await page.goto("/ai-workspace")
  await page
    .getByRole("button", { name: "Mock interview", exact: true })
    .click()
  await page.getByLabel("Selected vacancy").selectOption(String(vacancy.id))
  await page.getByRole("checkbox", { name: "I consent", exact: false }).check()
  await page
    .getByRole("button", { name: "Start five-question practice" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Question 1:", exact: false }),
  ).toBeVisible()
  for (let i = 1; i <= 5; i++) {
    await page
      .getByRole("textbox", { name: "Your answer", exact: true })
      .fill(`I recorded request ${i}.`)
    await page.getByRole("button", { name: "Submit answer & continue" }).click()
    await expect(
      page.getByRole("heading", {
        name: `Feedback on answer ${i}`,
        exact: true,
      }),
    ).toBeVisible()
  }
  await expect(
    page.getByRole("heading", { name: "Final practice summary" }),
  ).toBeVisible()
  await expect(
    page.getByRole("textbox", { name: "Your answer", exact: true }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(() => localStorage.getItem("ai-practice")),
  ).toBeNull()
})
