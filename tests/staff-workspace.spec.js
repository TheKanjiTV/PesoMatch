import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

async function enter(page, admin = false) {
  await page.goto("/peso/dashboard")

  await page
    .getByRole("button", {
      name: admin ? "Preview PESO Admin" : "Preview PESO Staff",
      exact: true,
    })
    .click()

  await expect(
    page.getByRole("heading", { name: "Staff Dashboard", exact: true }),
  ).toBeVisible()
}

async function saveAction(page, title) {
  const dialog = page.getByRole("dialog", { name: title, exact: true })
  await dialog.getByRole("button", { name: title, exact: true }).click()
  await expect(dialog).not.toBeVisible()
}

test("staff queue, review, referral and coordination follow the state path and preserve note privacy", async ({
  page,
}, info) => {
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  await enter(page)

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({
    path: info.outputPath("staff-dashboard-desktop.png"),
    fullPage: true,
  })

  await page.goto("/peso/assistance")
  await page
    .getByRole("textbox", {
      name: "Search jobseeker, reference, job, or employer",
    })
    .fill("PESO-DEMO-005")

  await expect(
    page.getByRole("row").filter({ hasText: "PESO-DEMO-005" }),
  ).toHaveCount(1)

  await page.goto("/peso/assistance/PESO-DEMO-005")
  await expect(
    page.getByRole("button", { name: "Record Employer Outcome", exact: true }),
  ).toHaveCount(0)

  await page.getByRole("button", { name: "Start Review", exact: true }).click()
  await saveAction(page, "Start Review")

  await page
    .getByRole("button", { name: "Request Information Update", exact: true })
    .click()
  let dialog = page.getByRole("dialog", {
    name: "Request Information Update",
    exact: true,
  })
  await dialog
    .getByLabel("What needs to be updated?", { exact: true })
    .selectOption("Contact Information")
  await dialog
    .getByLabel("Jobseeker-visible update", { exact: true })
    .fill("Public: please confirm your contact number.")
  await dialog
    .getByLabel("Internal staff note (optional, staff only)", { exact: true })
    .fill("PRIVATE-SENTINEL-REFERENCE")
  await saveAction(page, "Request Information Update")

  await expect(
    page.getByRole("button", { name: "Create Referral", exact: true }),
  ).toHaveCount(0)

  await page
    .getByRole("button", { name: "Resume PESO Review", exact: true })
    .click()
  await saveAction(page, "Start Review")

  await page
    .getByRole("button", { name: "Create Referral", exact: true })
    .click()
  dialog = page.getByRole("dialog", { name: "Create Referral", exact: true })
  await dialog.getByRole("checkbox").check()
  await saveAction(page, "Create Referral")

  await page
    .getByRole("button", { name: "Start Employer Coordination", exact: true })
    .click()
  dialog = page.getByRole("dialog", {
    name: "Record Employer Coordination",
    exact: true,
  })
  await dialog.getByLabel("Method", { exact: true }).selectOption("Phone")
  await dialog
    .getByLabel("Update type", { exact: true })
    .selectOption("Referral acknowledged")
  await dialog
    .getByLabel("Internal staff note (optional, staff only)", { exact: true })
    .fill("PRIVATE-COORDINATION-SENTINEL")
  await saveAction(page, "Record Employer Coordination")

  await page.getByRole("button", { name: "Add Follow-up", exact: true }).click()
  dialog = page.getByRole("dialog", { name: "Add Follow-up", exact: true })
  await dialog
    .getByLabel("Follow-up type", { exact: true })
    .selectOption("Email")
  await dialog
    .getByLabel("Follow-up result", { exact: true })
    .fill("Awaiting employer reply")
  await saveAction(page, "Add Follow-up")

  await page
    .getByRole("link", { name: "Preview Jobseeker Updates", exact: true })
    .click()
  await expect(
    page.getByText("Public: please confirm your contact number.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByText(/PRIVATE-.*SENTINEL/)).toHaveCount(0)

  await page.goto("/jobseeker/assistance/PESO-DEMO-005?example=1")
  await expect(page.getByText(/PRIVATE-.*SENTINEL/)).toHaveCount(0)
  await expect(
    page.getByText("Follow-up", { exact: true }).first(),
  ).toBeVisible()

  expect(errors).toEqual([])
})

test("training and employer outcome update the sample public journey and prevent a second terminal outcome", async ({
  page,
}) => {
  await enter(page)
  await page.goto("/peso/assistance/PESO-DEMO-001")

  await page
    .getByRole("button", { name: "Recommend Training", exact: true })
    .click()
  let dialog = page.getByRole("dialog", {
    name: "Recommend Training",
    exact: true,
  })
  await dialog.getByLabel("Training", { exact: true }).selectOption("excel")
  await dialog
    .getByLabel("Recommendation reason (visible to jobseeker)", { exact: true })
    .fill("Build the spreadsheet skill identified in this job's criteria.")
  await saveAction(page, "Recommend Training")

  await page
    .getByRole("button", { name: "Record Employer Outcome", exact: true })
    .click()
  dialog = page.getByRole("dialog", {
    name: "Record Employer Outcome",
    exact: true,
  })
  await dialog.getByLabel("Outcome", { exact: true }).selectOption("not_hired")
  await dialog
    .getByLabel("Jobseeker-visible update", { exact: true })
    .fill(
      "The employer selected another candidate. Continued support is available.",
    )
  await dialog.getByRole("checkbox").check()
  await saveAction(page, "Record Employer Outcome")

  await expect(
    page.getByRole("button", { name: "Record Employer Outcome", exact: true }),
  ).toHaveCount(0)

  await page.goto("/jobseeker/assistance/PESO-DEMO-001?example=1")
  await expect(
    page.getByRole("list", { name: "PESO assistance timeline" }).getByText(
      "The employer selected another candidate. Continued support is available.",
      { exact: true },
    ),
  ).toBeVisible()
})

test("staff cannot access Admin pages; Admin has a read-only audit trail and honest account placeholders", async ({
  page,
}, info) => {
  await enter(page)
  await expect(
    page.getByRole("link", { name: "Staff Accounts", exact: true }),
  ).toHaveCount(0)

  await page.goto("/peso/admin/staff")
  await expect(
    page.getByRole("heading", {
      name: "This area is for PESO Admin",
      exact: true,
    }),
  ).toBeVisible()

  await page.goto("/peso/profile")
  await page
    .getByRole("button", { name: "Change Preview Role", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Preview PESO Admin", exact: true })
    .click()

  await page.goto("/peso/admin/staff")
  await expect(
    page.getByRole("heading", { name: "Staff Accounts", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Edit Role Maria Santos", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")

  await page.goto("/peso/admin/audit-log")
  await expect(
    page.getByRole("heading", { name: "Audit Log", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Delete|Edit/, exact: false }),
  ).toHaveCount(0)

  await page.screenshot({
    path: info.outputPath("admin-audit-desktop.png"),
    fullPage: true,
  })
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(results.violations.map((v) => v.id)).toEqual([])
})

test("mobile staff queue and detail stay contained and workflow dialogs remain usable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await enter(page)
  await page.goto("/peso/assistance")
  await page.screenshot({
    path: info.outputPath("staff-queue-mobile.png"),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)

  await page.goto("/peso/assistance/PESO-DEMO-003")
  await page
    .getByRole("button", { name: "Request Information Update", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", {
      name: "Request Information Update",
      exact: true,
    }),
  ).toBeVisible()
  await page.screenshot({
    path: info.outputPath("staff-dialog-mobile.png"),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
})
