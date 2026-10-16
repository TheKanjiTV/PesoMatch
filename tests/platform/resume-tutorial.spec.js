import { test, expect, apiCall, provision } from "./helpers.js"

import AxeBuilder from "@axe-core/playwright"

import fs from "node:fs/promises"

function resumePdf() {
  const stream =
    "BT /F1 12 Tf 40 750 Td (Local Test Resume. Skills: Microsoft Excel spreadsheets and PHP programming. Contact 09171234567.) Tj ET"

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n",
    offsets = []

  objects.forEach((o, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`
  })

  const xref = pdf.length

  pdf +=
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return Buffer.from(pdf)
}

async function accessible(page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  )

  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

test("PDF review persists skills and official courses have honest external enrollment", async ({
  page,
  account,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto("/profile")

  await page.getByLabel("Résumé PDF · up to 5 MB").setInputFiles({
    name: "local-resume.pdf",
    mimeType: "application/pdf",
    buffer: resumePdf(),
  })

  await page.getByRole("button", { name: "Analyze PDF", exact: true }).click()

  await expect(
    page.getByText("PDF analyzed. Review the evidence before adding skills."),
  ).toBeVisible()

  await expect(
    page
      .locator(".resume-panel")
      .getByRole("checkbox", { name: /Microsoft Excel/ }),
  ).toBeChecked()

  await page.getByRole("button", { name: "Add reviewed skills" }).click()

  await expect(
    page.getByRole("status").filter({ hasText: "Reviewed skills added" }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByText("local-resume.pdf", { exact: true }),
  ).toBeVisible()

  await accessible(page)

  await fs.mkdir("artifacts/revisions", { recursive: true })

  await page.screenshot({
    path: "artifacts/revisions/resume-mobile.png",
    fullPage: true,
  })

  const resume = await (
    await apiCall(account.request, "/api/jobseeker/resume")
  ).json()

  expect(resume.data.path).toBeUndefined()

  expect(resume.data.applied_at).toBeTruthy()

  const programs = (
    await (await apiCall(account.request, "/api/platform/training")).json()
  ).data

  const official = programs.filter(
    (p) =>
      !p.is_sample &&
      p.external_enrollment &&
      p.source_url.startsWith("https://e-tesda.gov.ph/"),
  )

  expect(official.length).toBeGreaterThanOrEqual(18)

  await page.goto(`/training/${official[0].id}`)

  await expect(
    page.getByRole("link", { name: "Open official course & enroll" }),
  ).toHaveAttribute("href", official[0].source_url)

  await expect(
    page.getByRole("button", { name: "Request enrollment" }),
  ).toHaveCount(0)

  const checked = new Date(official[0].source_checked_at).toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  )
  await expect(
    page.getByText(`Checked ${checked}`, { exact: false }),
  ).toBeVisible()

  await accessible(page)

  await page.goto("/profile")

  await page.getByRole("button", { name: "Delete PDF" }).click()

  await expect(
    page.getByRole("status").filter({ hasText: "Résumé deleted" }),
  ).toBeVisible()

  await page.reload()

  await expect(page.getByText("local-resume.pdf", { exact: true })).toHaveCount(
    0,
  )
})

test.describe("New user guidance", () => {
  test.use({ tourComplete: false })

  test("first-visit tutorial, replay, dismissal and mobile service transitions", async ({
    page,
    account,
  }) => {
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    // A fresh disposable account has no tutorial completion preference.

    await page.addInitScript(() => {
      const original = Element.prototype.animate

      Element.prototype.animate = function (...args) {
        if (this.tagName === "MAIN")
          window.__pageMoves = (window.__pageMoves || 0) + 1
        return original.apply(this, args)
      }
    })

    await page.setViewportSize({ width: 390, height: 844 })

    await page.goto("/dashboard")

    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("button", { name: "Close tutorial" }).click()

    await page.goto("/settings")

    await page
      .getByRole("button", { name: "Replay workspace tutorial" })
      .click()

    await expect(page.getByRole("dialog")).toBeVisible()

    await expect(
      page.getByRole("heading", { name: "Welcome to your PESO workspace" }),
    ).toBeVisible()

    await accessible(page)

    await page.screenshot({
      path: "artifacts/revisions/tutorial-mobile.png",
      fullPage: true,
    })

    await page.getByRole("button", { name: "Next", exact: true }).click()

    await expect(
      page.getByRole("heading", { name: "Start with your résumé" }),
    ).toBeVisible()

    await page
      .getByRole("button", { name: "Skip tutorial", exact: true })
      .click()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    await expect(
      page.getByRole("button", { name: "Replay workspace tutorial" }),
    ).toBeFocused()

    await page
      .getByRole("button", { name: "Replay workspace tutorial" })
      .click()

    await page.getByRole("button", { name: "Close tutorial" }).click()

    await page.reload()

    await expect(page.getByRole("dialog")).not.toBeVisible()

    expect(
      (await (await apiCall(account.request, "/api/auth/user")).json()).user
        .dashboard_tour_completed_at,
    ).toBeTruthy()

    const moves = await page.evaluate(() => window.__pageMoves || 0)

    await page.getByRole("button", { name: "Open all services" }).click()

    await expect(page.locator(".workspace-sidebar")).toHaveClass(/drawer-open/)

    await expect(page.locator(".workspace-sidebar")).toHaveCSS(
      "transition-duration",
      "0.3s, 0.3s",
    )

    await page
      .getByRole("navigation", { name: "Employment services" })
      .getByRole("link", { name: "Job Matching", exact: true })
      .click()

    await expect(page).toHaveURL(/\/matches$/)

    await expect(page.locator(".workspace-sidebar")).toHaveClass(
      /drawer-closed/,
    )

    expect(await page.evaluate(() => window.__pageMoves || 0)).toBeGreaterThan(
      moves,
    )

    await page.getByRole("button", { name: "Open all services" }).click()

    await page.keyboard.press("Escape")

    await expect(page.locator(".workspace-sidebar")).toHaveClass(
      /drawer-closed/,
    )
    expect(errors).toEqual([])
  })
})

test("staff entrance opens assigned employee and administrator workspaces", async ({
  page,
  account,
}) => {
  await page.goto("/dashboard")

  await page.getByRole("button", { name: "Sign out", exact: true }).click()

  for (const role of ["peso_staff", "admin"]) {
    provision(account.email, role)

    await page.goto("/staff/login")

    await expect(
      page.getByRole("heading", { name: "Your service desk awaits." }),
    ).toBeVisible()

    await page.setViewportSize({
      width: role === "admin" ? 390 : 1440,
      height: 900,
    })

    await accessible(page)

    await page.screenshot({
      path: `artifacts/revisions/staff-${role}.png`,
      fullPage: true,
    })

    await page.getByLabel("Email Address").fill(account.email)

    await page
      .locator('input[autocomplete="current-password"]')
      .fill(account.password)

    await page.getByRole("button", { name: "Log In", exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard$/)

    await expect(page.locator(".workspace-identity")).toContainText(
      role === "admin" ? "Administrator" : "PESO officer",
    )

    if (role === "admin") {
      await page.goto("/users")

      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Account Access",
      )
    }

    if (role === "peso_staff")
      await page.getByRole("button", { name: "Sign out", exact: true }).click()
  }
})
