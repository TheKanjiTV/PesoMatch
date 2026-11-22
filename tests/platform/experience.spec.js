import { test as publicTest, expect } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"

import { test } from "./helpers.js"

import fs from "node:fs/promises"

async function accessible(page) {
  const result = await new AxeBuilder({ page })

    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

    .analyze()

  expect(
    result.violations.map((v) => ({
      id: v.id,

      nodes: v.nodes.map((n) => ({
        target: n.target,

        summary: n.failureSummary,
      })),
    })),
  ).toEqual([])

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)
}

publicTest(
  "HC1 HC2 public pages, directional account motion and 3D controls",

  async ({ page }) => {
    const errors = []

    page.on("pageerror", (e) => errors.push(e.message))

    await fs.mkdir("artifacts/experience", { recursive: true })

    await page.setViewportSize({ width: 1440, height: 1000 })

    await page.goto("/")

    await expect(
      page.locator('.scene-canvas[data-rendered="true"]'),
    ).toBeVisible()

    await expect(page.locator(".scene-toolbar button")).toHaveCount(2)

    await expect(
      page.locator(".scene-caption, .scene-stages, .scene-heading"),
    ).toHaveCount(0)

    await expect(page.locator(".pathway-scene")).toHaveCSS(
      "border-top-width",
      "0px",
    )

    await page.getByRole("button", { name: "Pause 3D animation" }).click()

    await expect(
      page.getByRole("button", { name: "Play 3D animation" }),
    ).toBeVisible()

    await page.getByRole("button", { name: "Reset 3D view" }).click()

    for (const theme of ["hc1", "hc2"]) {
      if (theme === "hc2")
        await page.getByRole("button", { name: "Switch to dark mode" }).click()

      await expect(
        page.getByRole("combobox", { name: "Contrast theme" }),
      ).toHaveCount(0)

      await expect(
        page.getByRole("switch", { name: "Larger text" }),
      ).toHaveCount(0)

      await expect(page.locator("html")).toHaveAttribute("data-contrast", theme)

      await page.screenshot({
        path: `artifacts/experience/landing-${theme}.png`,

        fullPage: true,
      })

      await accessible(page)
    }

    await page.getByRole("link", { name: "Sign in", exact: true }).click()

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(page.locator("html")).toHaveAttribute(
      "data-page-transition",

      "forward",
    )

    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    )

    await accessible(page)

    await page.getByRole("link", { name: "Back to Home", exact: true }).click()

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Good work",
    )

    await expect(page.locator("html")).toHaveAttribute(
      "data-page-transition",

      "back",
    )

    await page.getByRole("link", { name: "Register", exact: true }).click()

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(page.locator("html")).toHaveAttribute(
      "data-page-transition",

      "forward",
    )

    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    )

    await accessible(page)

    await page.getByRole("link", { name: "Back to Home", exact: true }).click()

    await expect(page.locator("html")).toHaveAttribute(
      "data-page-transition",

      "back",
    )

    await page.setViewportSize({ width: 390, height: 844 })

    await page.emulateMedia({ reducedMotion: "reduce" })

    await page.goto("/")

    await expect(
      page.locator('.scene-canvas[data-rendered="true"]'),
    ).toBeVisible()

    await accessible(page)

    await page.screenshot({
      path: "artifacts/experience/landing-mobile-hc2.png",

      fullPage: true,
    })

    await page.goto("/app")

    await expect(
      page.locator('.phone-canvas[data-rendered="true"]'),
    ).toBeVisible()

    expect(
      await page.locator(".phone-stage").evaluate((el) => el.offsetHeight),
    ).toBeLessThanOrEqual(480)

    await expect(
      page.getByRole("button", { name: "Pause phone animation" }),
    ).toBeVisible()

    await accessible(page)

    await page.screenshot({
      path: "artifacts/experience/install-mobile.png",

      fullPage: true,
    })

    expect(errors).toEqual([])
  },
)

test("HC2 all jobseeker screens, larger text and mobile application navigation", async ({
  page,
}) => {
  await fs.mkdir("artifacts/experience", { recursive: true })

  await page.setViewportSize({ width: 1440, height: 1000 })

  await page.goto("/dashboard")

  await expect(
    page.getByRole("status").filter({ hasText: /^Loading/ }),
  ).toHaveCount(0)

  await page.getByRole("button", { name: "Switch to dark mode" }).click()

  await expect(page.locator("#workspace-main h1")).toHaveCSS(
    "font-weight",

    "500",
  )

  await expect(
    page.getByRole("status").filter({ hasText: /^Loading/ }),
  ).toHaveCount(0)

  await page.screenshot({
    path: "artifacts/experience/dashboard-hc2.png",

    fullPage: true,
  })

  await accessible(page)

  await page.getByRole("button", { name: "Switch to light mode" }).click()

  await page.screenshot({
    path: "artifacts/experience/dashboard-hc1.png",

    fullPage: true,
  })

  await accessible(page)

  await page.getByRole("button", { name: "Switch to dark mode" }).click()

  await page.setViewportSize({ width: 390, height: 844 })

  await expect(page.getByRole("switch", { name: "Larger text" })).toHaveCount(0)

  const name = await page.locator(".workspace-identity p").first().textContent()

  await expect(page.locator(".workspace-sidebar")).not.toContainText(name)

  await page.goto("/settings")

  await page.getByRole("switch", { name: "Larger text", exact: true }).click()

  await expect(page.getByRole("switch", { name: "Larger text" })).toBeChecked()

  await page.reload()

  await expect(page.locator("html")).toHaveAttribute("data-text-size", "large")

  await expect(page.locator("html")).toHaveAttribute("data-contrast", "hc2")

  for (const route of [
    "/dashboard",

    "/jobs",

    "/training",

    "/matches",

    "/referrals",

    "/enrollments",

    "/placements",

    "/outcomes",

    "/services",

    "/events",

    "/labor-market",

    "/profile",

    "/settings",

    "/jobseeker/onboarding/1?review=1",

    "/jobseeker/onboarding/2?review=1",

    "/jobseeker/onboarding/3?review=1",

    "/jobseeker/onboarding/4?review=1",

    "/jobseeker/onboarding/5?review=1",
  ]) {
    await page.goto(route)

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await expect(
      page.getByRole("status").filter({ hasText: /^Loading/ }),
    ).toHaveCount(0)

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)

    if (
      ["/dashboard", "/jobs", "/training", "/profile", "/settings"].includes(
        route,
      ) ||
      route.includes("onboarding")
    )
      await accessible(page)
  }

  await page.goto("/dashboard")

  await page

    .getByRole("navigation", { name: "Mobile app navigation" })

    .getByRole("link", { name: "Home", exact: true })

    .click()

  await expect(page).toHaveURL(/\/dashboard/)

  await page.screenshot({
    path: "artifacts/experience/dashboard-mobile-hc2.png",

    fullPage: true,
  })

  await page.getByRole("button", { name: "Open all services" }).click()

  await expect(
    page.getByRole("navigation", { name: "Employment services" }),
  ).toBeVisible()

  await page

    .getByRole("navigation", { name: "Employment services" })

    .getByRole("link", { name: "Training Enrollment", exact: true })

    .click()

  await expect(page).toHaveURL(/\/enrollments/)

  await page.setViewportSize({ width: 320, height: 700 })

  await accessible(page)
})

publicTest(
  "PWA manifest, safe offline fallback and no cached personal API records",

  async ({ page, context }) => {
    await page.goto("/app")

    const manifest = await (await page.request.get("/manifest.webmanifest"))

      .json()

    expect(manifest.display).toBe("standalone")

    for (const icon of manifest.icons) {
      const response = await page.request.get(icon.src)

      expect(response.ok()).toBe(true)

      expect(response.headers()["content-type"]).toContain("image/png")
    }

    await page.evaluate(() => navigator.serviceWorker.ready)

    await page.reload()

    await page.waitForFunction(() => !!navigator.serviceWorker.controller)

    await page.request.get("/api/v1/public/catalog")

    const cached = await page.evaluate(async () => {
      const names = await caches.keys()

      return (
        await Promise.all(
          names.map(async (n) =>
            (await (await caches.open(n)).keys()).map(
              (r) => new URL(r.url).pathname,
            ),
          ),
        )
      )

        .flat()
    })

    expect(
      cached.some((p) => p.startsWith("/api/v1/") || p.startsWith("/sanctum/")),
    ).toBe(false)

    await context.setOffline(true)

    await page.goto("/jobs")

    await expect(
      page.getByRole("heading", { name: "Your next step is still here." }),
    ).toBeVisible()

    await expect(page.getByText(/no requests are queued/)).toBeVisible()

    await context.setOffline(false)

    await page.getByRole("button", { name: "Try again" }).click()

    await expect(page).toHaveURL(/\/login/)
  },
)

publicTest(
  "3D folio advances automatically and pause holds the selected page",

  async ({ page }) => {
    await page.goto("/")

    await page.locator('.scene-canvas[data-rendered="true"]').waitFor()

    await page.locator(".pathway-scene").scrollIntoViewIfNeeded()

    await expect(page.locator(".scene-canvas")).toHaveAttribute(
      "data-stage",
      "1",
      { timeout: 12000 },
    )

    await page.getByRole("button", { name: "Pause 3D animation" }).click()

    await page.waitForTimeout(8500)

    await expect(page.locator(".scene-canvas")).toHaveAttribute(
      "data-stage",
      "1",
    )

    await page.getByRole("button", { name: "Play 3D animation" }).click()

    await expect(page.locator(".scene-canvas")).toHaveAttribute(
      "data-stage",
      "2",
      { timeout: 12000 },
    )
  },
)
