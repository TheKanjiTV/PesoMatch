import { test, expect, apiCall } from "./helpers.js"
import AxeBuilder from "@axe-core/playwright"
import { mkdir } from "node:fs/promises"
import { tutorialSteps } from "../../src/platform/tutorialSteps.js"

async function accessible(page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze()
  expect(
    result.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

test("charcoal dark mode and expanded appearance preferences persist", async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 320, height: 850 })
  await page.goto("/settings")
  await expect(
    page.getByRole("heading", { name: "Appearance", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Dark", exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "hc2")
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(24, 25, 26)",
  )
  await expect(page.locator("body")).toHaveCSS("color", "rgb(228, 230, 235)")
  await accessible(page)
  await page.getByRole("switch", { name: "Larger text", exact: true }).click()
  await page
    .getByRole("switch", { name: "Underline links", exact: true })
    .click()
  await page.getByRole("switch", { name: "Reduce motion", exact: true }).click()
  await page.reload()
  for (const name of ["Larger text", "Underline links", "Reduce motion"])
    await expect(page.getByRole("switch", { name, exact: true })).toBeChecked()
  await expect(page.locator("html")).toHaveCSS("font-size", "18px")
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced")
  await expect(page.locator("html")).toHaveAttribute("data-links", "underlined")
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
  await accessible(page)
  await mkdir("artifacts/refinements", { recursive: true })
  await page.screenshot({
    path: "artifacts/refinements/settings-dark-320.png",
    fullPage: true,
  })
  // Public home explicitly permits signed-in visitors with this query.
  await page.goto("/?public=1")
  await expect(page.locator(".scene-canvas")).toHaveAttribute(
    "data-rendered",
    "true",
  )
  const stage = await page.locator(".scene-canvas").getAttribute("data-stage")
  expect(stage).toMatch(/^[012]$/)
  await page.waitForTimeout(9000)
  expect(await page.locator(".scene-canvas").getAttribute("data-stage")).toBe(
    stage,
  )
  await page.goto("/settings")
  await page
    .getByRole("button", { name: "Reset appearance preferences" })
    .click()
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "hc1")
  await expect(
    page.getByRole("switch", { name: "Larger text", exact: true }),
  ).not.toBeChecked()
})

test("replay navigates to Overview and highlights real controls through every step", async ({
  page,
}) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 375, height: 850 })
  await page.goto("/settings")
  await page.getByRole("button", { name: "Replay workspace tutorial" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  const dialog = page.locator("dialog.workspace-walkthrough")
  await expect(dialog).toHaveClass("workspace-walkthrough")
  await expect(dialog.locator(".tour-spotlight rect")).toBeVisible()
  await accessible(page)
  await mkdir("artifacts/refinements", { recursive: true })
  await page.screenshot({
    path: "artifacts/refinements/overview-guide-375.png",
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  const desktopCoach = dialog.locator(".tour-coach")
  await expect(desktopCoach).toBeVisible()
  await expect
    .poll(async () => {
      const box = await desktopCoach.boundingBox()
      return (
        box.x >= 0 &&
        box.x + box.width <= 1440 &&
        box.y >= 0 &&
        box.y + box.height <= 900
      )
    })
    .toBe(true)
  await accessible(page)
  await page.screenshot({
    path: "artifacts/refinements/overview-guide-1440.png",
  })
  await page.setViewportSize({ width: 375, height: 850 })
  for (const { title } of tutorialSteps("jobseeker").slice(1)) {
    await dialog.getByRole("button", { name: "Next", exact: true }).click()
    await expect(
      dialog.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible()
    const coach = await dialog.locator(".tour-coach").boundingBox()
    expect(coach.x).toBeGreaterThanOrEqual(0)
    expect(coach.x + coach.width).toBeLessThanOrEqual(376)
    expect(coach.y + coach.height).toBeLessThanOrEqual(850)
  }
  await dialog.getByRole("button", { name: "Finish", exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole("button", { name: "Replay workspace tutorial" }),
  ).toBeFocused()
})

test("Later dismisses the same release across reloads while a different release is offered", async ({
  page,
}) => {
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  const announce = (version) =>
    page.evaluate(
      (version) =>
        window.dispatchEvent(
          new CustomEvent("peso:update", {
            detail: {
              version,
              worker: {
                postMessage: (message) => {
                  window.__updateMessage = message
                },
              },
            },
          }),
        ),
      version,
    )
  await announce("release-a")
  await expect(
    page.getByText("A new version is ready. Save your work before reloading."),
  ).toBeVisible()
  await page.getByRole("button", { name: "Later", exact: true }).click()
  await page.reload()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await announce("release-a")
  await expect(
    page.getByText("A new version is ready. Save your work before reloading."),
  ).toHaveCount(0)
  await announce("release-b")
  await expect(
    page.getByRole("button", { name: "Reload app", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Reload app", exact: true }).click()
  expect(await page.evaluate(() => window.__updateMessage)).toEqual({
    type: "SKIP_WAITING",
  })
  await page.evaluate(() => navigator.serviceWorker.ready)
  const version = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      const timeout = setTimeout(() => {
        channel.port1.close()
        resolve(null)
      }, 3000)
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout)
        channel.port1.close()
        resolve(event.data.version)
      }
      registration.active.postMessage({ type: "GET_VERSION" }, [channel.port2])
    })
  })
  expect(version).toMatch(/^[a-f0-9]{12}$/)
})

test("normal catalogs contain real sources and national statistics remain distinct from platform outcomes", async ({
  page,
  account,
}) => {
  for (const resource of ["vacancies", "training", "events"]) {
    const rows = (
      await (await apiCall(account.request, `/api/platform/${resource}`)).json()
    ).data
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => !row.is_sample && row.source_url)).toBe(true)
  }
  await page.goto("/labor-market")
  await expect(
    page.getByRole("heading", {
      name: "Philippine labor force indicators — August 2026",
    }),
  ).toBeVisible()
  await expect(page.getByText("94.7%", { exact: true })).toBeVisible()
  await expect(
    page.getByText(/Preliminary PSA Labor Force Survey/),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "View PSA source and definitions" }),
  ).toHaveAttribute("href", /openstat\.psa\.gov\.ph/)
  await page.goto("/events")
  await expect(
    page.getByRole("heading", { name: "PESO Maco Job Fair" }),
  ).toBeVisible()
  await expect(
    page.getByText(/opening time not published/).first(),
  ).toBeVisible()
  await expect(page.getByText("Illustrative sample")).toHaveCount(0)
})
