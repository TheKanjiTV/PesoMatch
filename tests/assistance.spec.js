import { test, expect } from "./fixtures.js"

import AxeBuilder from "@axe-core/playwright"

async function accessible(page) {
  expect(
    (
      await new AxeBuilder({ page })

        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

        .analyze()
    ).violations,
  ).toEqual([])

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
}

async function withdraw(page) {
  await page

    .getByRole("button", { name: "Withdraw Request", exact: true })

    .click()

  await page

    .getByRole("dialog")

    .getByRole("button", { name: "Withdraw Request", exact: true })

    .click()

  await expect(page.locator("#assistance-status")).toContainText(
    "Outcome Recorded",
  )
}

for (const width of [1440, 390]) {
  test(`assistance request, persistence, notification, withdrawal and recovery ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })

    const featureRequests = []

    page.on("request", (request) => {
      if (
        /\/api\/(?:jobseeker\/assistance|jobs\/[^/]+\/assistance|referrals|applications)/.test(
          request.url(),
        )
      )
        featureRequests.push(request.url())
    })

    await page.goto("/jobseeker/assistance")

    await expect(
      page.getByRole("heading", { name: "No PESO assistance requests yet" }),
    ).toBeVisible()

    await page.getByRole("button", { name: "How It Works" }).click()

    await expect(page.getByRole("dialog")).toContainText(
      "The employer makes the final hiring decision.",
    )

    await page.keyboard.press("Escape")

    await expect(
      page.getByRole("button", { name: "How It Works" }),
    ).toBeFocused()

    await page.goto("/jobseeker/jobs/customer-service")

    await page

      .getByRole("button", { name: "Request PESO Assistance", exact: true })

      .click()

    const dialog = page.getByRole("dialog")

    await expect(
      dialog.getByRole("button", { name: "Submit Request" }),
    ).toBeDisabled()

    await expect(
      dialog.getByRole("heading", { name: "Profile Readiness" }),
    ).toBeVisible()

    await dialog

      .getByLabel("Note for PESO assistance (optional)")

      .fill("Please advise on suitable next steps.")

    await dialog.getByRole("checkbox").check()

    await accessible(page)

    await page.screenshot({
      path: `test-results/screenshots/assistance-request-${width}.png`,

      fullPage: true,
    })

    await dialog.getByRole("button", { name: "Submit Request" }).click()

    await expect(dialog).toContainText("Employment assistance requested")

    await expect(dialog).toContainText("PESO-DEMO-")

    await dialog.getByRole("link", { name: "View Assistance Status" }).click()

    await expect(page.locator("#assistance-status")).toContainText(
      "Request Received",
    )

    const path = new URL(page.url()).pathname

    await expect(
      page.getByText("Please advise on suitable next steps."),
    ).toBeVisible()

    await accessible(page)

    await page.screenshot({
      path: `test-results/screenshots/assistance-details-${width}.png`,

      fullPage: true,
    })

    await page.reload()

    await expect(page.locator("#assistance-status")).toContainText(
      "Request Received",
    )

    await page

      .getByRole("button", { name: /^Notifications, \d+ unread$/ })

      .click()

    await page

      .getByRole("region", { name: "Notifications", exact: true })

      .getByRole("link", { name: /Assistance request received/ })

      .click()

    await expect(page).toHaveURL(new RegExp(path + "$"))

    await page.goto("/jobseeker/jobs/customer-service")

    await expect(
      page.getByRole("button", {
        name: "Request PESO Assistance",

        exact: true,
      }),
    ).toHaveCount(0)

    await page

      .getByRole("link", { name: "View PESO Assistance", exact: true })

      .click()

    await expect(page).toHaveURL(new RegExp(path + "$"))

    await page

      .getByRole("button", { name: "Withdraw Request", exact: true })

      .click()

    await page

      .getByRole("dialog")

      .getByRole("button", { name: "Keep Request" })

      .click()

    await expect(page.locator("#assistance-status")).toContainText(
      "Request Received",
    )

    await withdraw(page)

    await page.getByRole("button", { name: "Undo", exact: true }).click()

    await expect(page.locator("#assistance-status")).toContainText(
      "Request Received",
    )

    await page.goto("/dashboard")

    await expect(page.locator('[data-tour="assistance"]')).toContainText(
      "Active Assistance / 1",
    )

    await page

      .locator('[data-tour="assistance"]')

      .getByRole("link", { name: "View Status" })

      .click()

    await withdraw(page)

    await expect(
      page.getByRole("list", { name: "PESO assistance timeline" }),
    ).toContainText("Not reached")

    await page

      .getByRole("link", { name: "Back to PESO Assistance", exact: true })

      .click()

    await expect(
      page.getByRole("tab", { name: "History (1)" }),
    ).toHaveAttribute("aria-selected", "true")

    await expect(
      page.getByRole("tab", { name: "Active Assistance (0)" }),
    ).toBeVisible()

    await page.goto("/dashboard")

    await expect(
      page.getByText("Request Withdrawn. User withdrew request."),
    ).toBeVisible()

    expect(featureRequests).toEqual([])
  })
}

test("read-only sample stages, outcomes, training return and profile action", async ({
  page,
}) => {
  await page.goto("/jobseeker/assistance?examples=1")

  await expect(
    page.getByRole("tab", { name: "Active Assistance (7)" }),
  ).toBeVisible()

  await expect(page.getByRole("tab", { name: "History (5)" })).toBeVisible()

  await accessible(page)

  await page.screenshot({
    path: "test-results/screenshots/assistance-list.png",

    fullPage: true,
  })

  await page.getByRole("tab", { name: "History (5)" }).click()

  await expect(
    page.getByText(/Outcome: Needs Additional Training/).first(),
  ).toBeVisible()

  await page.goto("/jobseeker/assistance/PESO-DEMO-009?example=1")

  await expect(
    page.getByRole("heading", { name: "Employment Outcome", exact: true }),
  ).toBeVisible()

  await expect(
    page.getByText(/This outcome does not end your employment journey/),
  ).toBeVisible()

  await expect(
    page.getByRole("button", { name: "Withdraw Request" }),
  ).toHaveCount(0)

  await expect(page.getByLabel("Demo status", { exact: true })).toHaveCount(0)

  await page.goto("/jobseeker/assistance/PESO-DEMO-011?example=1")

  await page.getByRole("link", { name: "View Training", exact: true }).click()

  await expect(page).toHaveURL(
    /training\/excel\?assistance=PESO-DEMO-011&assistanceExample=1/,
  )

  await page.reload()

  await page

    .getByRole("link", { name: "Back to PESO Assistance", exact: true })

    .click()

  await expect(page).toHaveURL(/assistance\/PESO-DEMO-011\?example=1$/)

  await page.goto("/jobseeker/assistance/PESO-DEMO-012?example=1")

  await page.getByRole("link", { name: "View Suggested Job" }).click()

  await expect(page).toHaveURL(/jobs\/administrative$/)

  await page.goto("/jobseeker/assistance/PESO-DEMO-002?example=1")

  await page.getByRole("link", { name: "Update Profile", exact: true }).click()

  await expect(page).toHaveURL(/onboarding\/1\?review=1&returnTo=/)

  await page.getByRole("button", { name: "Save changes", exact: true }).click()

  await expect(page).toHaveURL(/assistance\/PESO-DEMO-002\?example=1$/)

  await expect(page.locator("#assistance-status")).toContainText(
    "Action Required",
  )

  await page.setViewportSize({ width: 320, height: 900 })

  await accessible(page)

  await page.screenshot({
    path: "test-results/screenshots/assistance-action-320.png",

    fullPage: true,
  })
})

test("loading, errors, unknown request and failed submission preserve recoverable state", async ({
  page,
}) => {
  await page.goto("/jobseeker/assistance?preview=loading")

  await expect(
    page.getByRole("status", { name: "Loading assistance request" }).first(),
  ).toBeVisible()

  await page.goto("/jobseeker/assistance?preview=error")

  await page.getByRole("button", { name: "Try Again" }).click()

  await expect(
    page.getByRole("heading", { name: "No PESO assistance requests yet" }),
  ).toBeVisible()

  await page.goto("/jobseeker/assistance/not-owned")

  await expect(
    page.getByRole("heading", { name: "Assistance request not found" }),
  ).toBeVisible()

  await page.goto("/jobseeker/assistance/PESO-DEMO-001?example=1&preview=error")

  await page.getByRole("button", { name: "Try Again" }).click()

  await expect(page.locator("#assistance-status")).toContainText(
    "Employer Coordination",
  )

  await page.goto("/jobseeker/jobs/customer-service?preview=request-error")

  await page

    .getByRole("button", { name: "Request PESO Assistance", exact: true })

    .click()

  const dialog = page.getByRole("dialog")

  await dialog

    .getByLabel("Note for PESO assistance (optional)")

    .fill("Keep my note after failure.")

  await dialog.getByRole("checkbox").check()

  await dialog.getByRole("button", { name: "Submit Request" }).click()

  await expect(dialog.getByRole("alert")).toContainText(
    "We couldn't submit your request.",
  )

  await expect(
    dialog.getByLabel("Note for PESO assistance (optional)"),
  ).toHaveValue("Keep my note after failure.")

  await expect(dialog.getByRole("checkbox")).toBeChecked()

  await dialog.getByRole("button", { name: "Submit Request" }).click()

  await dialog.getByRole("button", { name: "Return to Job" }).click()

  await expect(
    page.getByRole("link", { name: "View PESO Assistance", exact: true }),
  ).toBeFocused()
})
