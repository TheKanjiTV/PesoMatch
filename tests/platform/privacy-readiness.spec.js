import { test as publicTest, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { test, apiCall } from "./helpers.js"

async function accessible(page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  )
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze()
  expect(
    results.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

async function focusedControlVisible(page) {
  expect(
    await page.evaluate(() => {
      const control = document.activeElement
      if (!control?.matches("a,button,input,select,textarea")) return true
      const r = control.getBoundingClientRect(),
        x = r.left + r.width / 2,
        y = r.top + r.height / 2
      const top = document.elementFromPoint(x, y)
      return (
        x >= 0 &&
        x < innerWidth &&
        y >= 0 &&
        y < innerHeight &&
        !!top &&
        (control === top || control.contains(top))
      )
    }),
  ).toBe(true)
}

publicTest(
  "official help is source-attributed, available without login and accessible in both themes",
  async ({ page }) => {
    const externalRequests = []
    page.on("request", (r) => {
      if (new URL(r.url()).origin !== "http://127.0.0.1:8443")
        externalRequests.push(r.url())
    })
    for (const theme of ["hc1", "hc2"]) {
      await page.addInitScript(
        (theme) =>
          localStorage.setItem("peso-appearance", JSON.stringify({ theme })),
        theme,
      )
      await page.setViewportSize({ width: 320, height: 800 })
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto("/help")
      await expect(
        page.getByRole("heading", {
          name: "Help & official contacts",
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        page.getByText(/does not identify them as PesoMatch's operator/),
      ).toBeVisible()
      await expect(
        page.locator('a[href="https://pasay.gov.ph/job-openings/"]'),
      ).toBeVisible()
      await expect(
        page.locator('a[href="mailto:contactcenter@tesda.gov.ph"]'),
      ).toBeVisible()
      await expect(
        page.locator('a[href="https://ble.dole.gov.ph/peso-directory/"]'),
      ).toHaveAttribute("rel", "noopener noreferrer")
      await accessible(page)
      await page
        .getByRole("link", { name: /Find your local PESO: official source/ })
        .focus()
      await focusedControlVisible(page)
    }
    expect(externalRequests).toEqual([])
  },
)

test("collection notices precede profile resume and service inputs and enrollment evidence persists", async ({
  page,
  account,
  workflowCatalog,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/jobseeker/onboarding/1?review=1")
  const notice = page.getByRole("complementary", {
    name: "Privacy before you submit",
  })
  await expect(notice).toContainText("under 18")
  await expect(
    notice.getByRole("link", { name: /Read the privacy notice/ }),
  ).toHaveAttribute("target", "_blank")
  await accessible(page)
  await page.goto("/profile")
  await expect(
    page
      .locator(".resume-panel")
      .getByRole("complementary", { name: "Privacy before you submit" }),
  ).toContainText("optional")
  await page.goto("/services")
  await page
    .getByRole("button", { name: "Request PESO assistance", exact: true })
    .click()
  await expect(
    page.getByRole("complementary", { name: "Privacy before you submit" }),
  ).toContainText("Avoid unrelated IDs")
  await accessible(page)
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  const { program } = workflowCatalog
  await page.goto(`/training/${program.id}`)
  await expect(
    page.getByRole("complementary", { name: "Privacy before you submit" }),
  ).toContainText("named provider")
  await expect(page.getByRole("checkbox")).not.toBeChecked()
  await expect(
    page.getByRole("button", {
      name: "Apply for this training intake",
      exact: true,
    }),
  ).toBeDisabled()
  await accessible(page)
  await page.getByRole("checkbox").check()
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith(`/training/${program.id}/enroll`) &&
        r.request().method() === "POST",
    ),
    page
      .getByRole("button", {
        name: "Apply for this training intake",
        exact: true,
      })
      .click(),
  ])
  expect(response.status()).toBe(201)
  const evidence = (await response.json()).data
  expect(evidence.consent_notice_version).toBe(
    "enrollment-review-2026-10-13-v1",
  )
  expect(evidence.consent_recipient).toBe(program.provider)
  expect(Number.isFinite(Date.parse(evidence.consent_accepted_at))).toBe(true)
})

test.describe("Privacy before profile completion", () => {
  test.use({ completeProfile: false, tourComplete: false })
  test("incomplete users can request deletion and see an explicit irreversible-action label", async ({
    page,
    account,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/jobseeker\/onboarding\/1$/)
    await page
      .getByRole("complementary", { name: "Privacy before you submit" })
      .getByRole("link", { name: "Account Settings", exact: true })
      .click()
    await expect(page).toHaveURL(/\/settings$/)
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await page.getByRole("button", { name: "Switch to dark mode" }).click()
    await page.getByRole("switch", { name: "Larger text" }).click()
    const opener = page.getByRole("button", {
      name: "Make a privacy request",
      exact: true,
    })
    await opener.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByLabel("Request type")).toBeFocused()
    await page.getByLabel("Request type").selectOption("deletion")
    await page
      .getByLabel("Details (optional)")
      .fill("Please review deletion of this disposable incomplete account.")
    await page.getByRole("button", { name: "Save record", exact: true }).click()
    await expect(
      page.getByText(
        "Privacy request recorded. You can follow its status here.",
        { exact: true },
      ),
    ).toBeVisible()
    await expect(opener).toBeFocused()
    await focusedControlVisible(page)
    expect((await apiCall(account.request, "/api/auth/user")).status()).toBe(
      200,
    )
    const deletion = page.getByRole("button", {
      name: "Delete account",
      exact: true,
    })
    await deletion.click()
    await expect(
      page.getByRole("button", {
        name: "Delete account permanently",
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Save record", exact: true }),
    ).toHaveCount(0)
    await accessible(page)
    await page.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(deletion).toBeFocused()
    await focusedControlVisible(page)
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab")
      await focusedControlVisible(page)
    }
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/jobseeker\/onboarding\/1$/)
  })
})
