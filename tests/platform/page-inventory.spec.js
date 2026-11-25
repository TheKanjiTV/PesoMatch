import fs from "node:fs/promises"
import { test, expect, apiCall, provisionAndSignIn } from "./helpers.js"

test.use({ autoDismissAiPrivacy: false })

const shared = [
  "/dashboard",
  "/jobs",
  "/training",
  "/events",
  "/labor-market",
  "/settings",
]
const staffServices = [
  "/training-demand",
  "/referrals",
  "/enrollments",
  "/placements",
  "/outcomes",
  "/services",
  "/jobseekers",
]
const roleRoutes = {
  jobseeker: [
    ...shared,
    "/training-demand",
    "/ai-workspace",
    "/matches",
    "/referrals",
    "/enrollments",
    "/placements",
    "/outcomes",
    "/services",
    "/profile",
  ],
  peso_staff: [...shared, ...staffServices],
  admin: [...shared, ...staffServices, "/users", "/audit", "/archive"],
  employer: [...shared, "/referrals", "/placements"],
  training_provider: [...shared, "/enrollments"],
}

test("the page inventory includes every explicitly declared workspace route", async () => {
  const router = await fs.readFile("src/login.jsx", "utf8")
  const workspace = router.slice(
    router.indexOf("Component: PlatformLayout"),
    router.indexOf('path: "/jobseeker/onboarding/:step"'),
  )
  const declared = [...workspace.matchAll(/"(\/[a-z][a-z/-]*(?::id)?)"/g)].map(
    (match) => match[1].replace(/\/:id$/, ""),
  )
  const covered = new Set(Object.values(roleRoutes).flat())
  expect(declared.length).toBeGreaterThan(10)
  expect([...new Set(declared)].filter((route) => !covered.has(route))).toEqual(
    [],
  )
})

async function dismissOptionalPrivacy(page) {
  const notice = page.getByRole("dialog", {
    name: "AI privacy & response preferences",
  })
  if (await notice.isVisible())
    await notice.getByRole("button", { name: "Done" }).click()
}

for (const [role, routes] of Object.entries(roleRoutes)) {
  test(`${role}: every allowed workspace page loads on desktop and mobile without crashes or API errors`, async ({
    page,
    account,
  }) => {
    test.setTimeout(240000)
    if (role !== "jobseeker") await provisionAndSignIn(account, page, role)
    const errors = []
    const responses = []
    const checked = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("response", (response) => {
      const url = new URL(response.url())
      if (url.pathname.startsWith("/api/v1/") && response.status() >= 400)
        responses.push({ path: url.pathname, status: response.status() })
    })
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of routes) {
        await test.step(`${route} at ${width}px`, async () => {
          await page.goto(route)
          await page.waitForLoadState("networkidle")
          await dismissOptionalPrivacy(page)
          const destination = { "/labor-market": "/dashboard", "/matches": "/jobs", "/outcomes": "/referrals" }[route] || route
          await expect(page).toHaveURL(new RegExp(`${destination}$`))
          await expect(
            page.getByRole("heading", { name: "This page couldn't load" }),
          ).toHaveCount(0)
          await expect(page.locator("main h1")).toBeVisible()
          await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
          await expect(
            page.getByRole("button", {
              name: /Retry (loading|connection|page)/,
            }),
          ).toHaveCount(0)
          await expect(
            page.getByText(
              "Your account does not have access to this service.",
              { exact: true },
            ),
          ).toHaveCount(0)
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          ).toBe(true)
          expect(errors, `${role} ${route}: JavaScript errors`).toEqual([])
          expect(responses, `${role} ${route}: failed API responses`).toEqual(
            [],
          )
          checked.push({ route, width, status: "passed" })
        })
      }
    }
    await fs.mkdir("artifacts/page-inventory", { recursive: true })
    await fs.writeFile(
      `artifacts/page-inventory/${role}.json`,
      JSON.stringify(
        {
          role,
          checked,
          javascript_errors: errors,
          failed_api_responses: responses,
        },
        null,
        2,
      ),
    )
  })
}

test("training demand records a real topic, keeps it separate from enrollment, and staff can plan a draft", async ({
  page,
  account,
}) => {
  const topic = `Synthetic browser training demand ${Date.now()}`
  const before = await (
    await apiCall(account.request, "/api/v1/platform/enrollments")
  ).json()
  await page.goto("/training-demand")
  await page
    .getByRole("button", { name: "Request a training topic", exact: true })
    .click()
  await page.getByLabel("Training / skill topic", { exact: true }).fill(topic)
  await page.getByLabel("What would you like to learn?", { exact: true }).fill("Learn digital records for office work.")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByLabel("Preferred start date", { exact: true }).fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  await page.getByLabel("Preferred end date", { exact: true }).fill(new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10))
  await page.getByLabel("Preferred days and time", { exact: true }).fill("Saturday mornings")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("combobox", { name: "Training mode", exact: true }).selectOption("Online")
  await page.getByLabel("Preferred training location", { exact: true }).fill("Mansalay")
  await page.getByLabel("How will this training help you?", { exact: true }).fill("Prepare for office support work.")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("button", { name: "Submit training request", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: topic, exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: topic, exact: true }),
  ).toBeVisible()
  await fs.mkdir("artifacts/page-inventory", { recursive: true })
  await page.screenshot({
    path: "artifacts/page-inventory/training-demand-desktop.png",
  })
  const after = await (
    await apiCall(account.request, "/api/v1/platform/enrollments")
  ).json()
  expect(after.total).toBe(before.total)
  await provisionAndSignIn(account, page, "peso_staff")
  await page.goto("/training-demand")
  const row = page
    .locator("div")
    .filter({ has: page.getByRole("heading", { name: topic, exact: true }) })
    .filter({ has: page.getByRole("link", { name: "Plan a training intake" }) })
    .last()
  await row.getByRole("link", { name: "Plan a training intake" }).click()
  const draft = page.getByRole("dialog")
  await expect(
    draft.getByRole("textbox", { name: "Program title", exact: true }),
  ).toHaveValue(topic)
  await expect(draft.getByLabel("Publication status")).toHaveValue("draft")
})
