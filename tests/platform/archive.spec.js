import fs from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { test, expect, apiCall, provisionAndSignIn } from "./helpers.js"

test("administrator archives and restores vacancy drafts and terminal enrollment history", async ({
  page,
  account,
  workflowCatalog,
}) => {
  test.setTimeout(180000)
  await provisionAndSignIn(account, page, "admin")
  const paths = []
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname
    if (path.startsWith("/api/")) paths.push(path)
  })
  await page.goto(`/jobs?id=${workflowCatalog.vacancy.id}`)
  await page
    .locator("article")
    .filter({ hasText: workflowCatalog.vacancy.title })
    .getByRole("button", { name: "Archive vacancy", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await expect(
    dialog.getByRole("button", { name: /Archive \(\d+\)/ }),
  ).toBeDisabled()
  await dialog
    .getByRole("button", { name: "Archive item", exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await page.goto("/archive")
  await page.getByLabel("Record type", { exact: true }).selectOption("vacancy")
  await page
    .getByLabel("Search archived records", { exact: true })
    .fill(workflowCatalog.vacancy.title)
  const row = page
    .locator("tbody tr")
    .filter({ hasText: workflowCatalog.vacancy.title })
  await expect(row).toHaveCount(1)
  await fs.mkdir("artifacts/archive", { recursive: true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page
      .locator("main")
      .screenshot({ path: `artifacts/archive/vacancy-${width}.png` })
  }
  await row.getByRole("button", { name: /^Restore vacancy/ }).click()
  await expect(
    page.getByText("Record restored as a draft. Review before publishing.", {
      exact: true,
    }),
  ).toBeVisible()
  const restored = await (
    await apiCall(
      account.request,
      `/api/v1/platform/vacancies?id=${workflowCatalog.vacancy.id}`,
    )
  ).json()
  expect(restored.data[0].status).toBe("draft")
  await page.goto("/audit")
  await page
    .getByLabel("Activity category", { exact: true })
    .selectOption("business")
  await expect(
    page.locator("tbody tr").filter({ hasText: "vacancy.restored" }).filter({ has: page.getByRole("cell", { name: `vacancies #${workflowCatalog.vacancy.id}`, exact: true }) }),
  ).toBeVisible()
  expect(paths.length).toBeGreaterThan(4)
  expect(paths.every((path) => path.startsWith("/api/v1/"))).toBe(true)
  const assisted = await apiCall(
    account.request,
    `/api/v1/platform/training/${workflowCatalog.program.id}/participants`,
    "POST",
    {
      walk_in_name: "Synthetic Archive Walk-in",
      municipality: "Mansalay",
      participant_reference: `SYNTH-ARCH-${account.user.id}`,
      consent: true,
      notes: "Synthetic consent and archive workflow verification.",
    },
  )
  expect(assisted.status()).toBe(201)
  const enrollment = (await assisted.json()).data
  expect(
    (
      await apiCall(
        account.request,
        `/api/v1/platform/enrollments/${enrollment.id}`,
        "PATCH",
        {
          status: "withdrawn",
          notes: "Synthetic archive workflow verification.",
        },
      )
    ).status(),
  ).toBe(200)
  await page.goto("/enrollments")
  await page
    .locator("article")
    .filter({ hasText: workflowCatalog.program.title })
    .filter({ hasText: "Synthetic Archive Walk-in" })
    .getByRole("button", { name: "Archive enrollment", exact: true })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Archive item", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.goto("/archive")
  await page
    .getByLabel("Record type", { exact: true })
    .selectOption("enrollment")
  await page
    .getByLabel("Search archived records", { exact: true })
    .fill(workflowCatalog.program.title)
  await page
    .getByRole("button", {
      name: `Restore enrollment ${workflowCatalog.program.title}`,
      exact: true,
    })
    .click()
  await expect(
    page.getByText(
      "Enrollment history restored. Its terminal status is unchanged.",
      { exact: true },
    ),
  ).toBeVisible()
})

test("account archive revokes access and password-protected restore requires a new login", async ({
  page,
  account,
  playwright,
}) => {
  test.setTimeout(180000)
  await provisionAndSignIn(account, page, "admin")
  const stamp = Date.now()
  const email = `platform.${stamp}.archivetarget@example.test`
  const created = await apiCall(
    account.request,
    "/api/v1/platform/users",
    "POST",
    {
      first_name: "000Synthetic",
      last_name: `Archive Target ${stamp}`,
      email,
      role: "employer",
      password: account.password,
      password_confirmation: account.password,
      current_password: account.password,
    },
  )
  expect(created.status()).toBe(201)
  const target = (await created.json()).data
  const targetRequest = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:8443",
  })
  try {
    expect(
      (
        await apiCall(targetRequest, "/api/v1/auth/login", "POST", {
          email,
          password: account.password,
        })
      ).status(),
    ).toBe(200)
    await page.goto("/users")
    const row = page.locator("tbody tr").filter({ hasText: email })
    // The global list can span multiple pages; this fixture's name sorts first.
    await expect(row).toHaveCount(1)
    await row
      .getByRole("button", { name: "Archive account", exact: true })
      .click()
    let dialog = page.getByRole("dialog")
    await dialog
      .getByLabel("Your current administrator password", { exact: true })
      .fill(account.password)
    await dialog
      .getByRole("button", { name: "Archive item", exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    expect((await apiCall(targetRequest, "/api/v1/auth/user")).status()).toBe(
      401,
    )
    await page.goto("/archive")
    await page
      .getByLabel("Record type", { exact: true })
      .selectOption("account")
    await page
      .getByLabel("Search archived records", { exact: true })
      .fill(email)
    await page
      .getByRole("button", {
        name: `Restore account ${target.name}`,
        exact: true,
      })
      .click()
    dialog = page.getByRole("dialog")
    await dialog
      .getByLabel(/^Your current administrator password/)
      .fill(account.password)
    await dialog
      .getByRole("button", { name: "Restore account", exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    await expect(
      page.getByText("Account restored. A new sign-in is required.", {
        exact: true,
      }),
    ).toBeVisible()
    expect((await apiCall(targetRequest, "/api/v1/auth/user")).status()).toBe(
      401,
    )
    expect(
      (
        await apiCall(targetRequest, "/api/v1/auth/login", "POST", {
          email,
          password: account.password,
        })
      ).status(),
    ).toBe(200)
    const history = await (
      await apiCall(targetRequest, "/api/v1/auth/history")
    ).json()
    expect(history.data.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "auth.account_archived",
        "auth.account_restored",
        "auth.sessions_revoked",
      ]),
    )
  } finally {
    execFileSync(
      "php",
      [
        fileURLToPath(new URL("./cleanup.php", import.meta.url)),
        String(target.id),
        email,
      ],
      {
        cwd: fileURLToPath(new URL("../../backend", import.meta.url)),
        windowsHide: true,
        stdio: "pipe",
      },
    )
    await targetRequest.dispose()
  }
})

test("Archive handles loading failures, empty results and pagination", async ({
  page,
  account,
}) => {
  await provisionAndSignIn(account, page, "admin")
  let fail = true,
    empty = false
  await page.route("**/api/v1/platform/archive?*", (route) => {
    if (fail)
      return route.fulfill({ status: 503, json: { message: "Unavailable" } })
    const current = Number(
      new URL(route.request().url()).searchParams.get("page"),
    )
    return route.fulfill({
      json: {
        data: empty
          ? []
          : [
              {
                id: current,
                type: "vacancy",
                label: `Synthetic archive ${current}`,
                context: "Synthetic fixture",
                status: "closed",
                archived_at: "2026-11-23T14:00:00+08:00",
              },
            ],
        current_page: current,
        last_page: empty ? 1 : 2,
        total: empty ? 0 : 2,
      },
    })
  })
  await page.goto("/archive")
  await expect(
    page.getByRole("button", { name: "Retry loading", exact: true }),
  ).toBeVisible()
  fail = false
  await page.getByRole("button", { name: "Retry loading", exact: true }).click()
  await expect(
    page.getByText("Synthetic archive 1", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Next page", exact: true }).click()
  await expect(
    page.getByText("Synthetic archive 2", { exact: true }),
  ).toBeVisible()
  empty = true
  await page.getByLabel("Record type", { exact: true }).selectOption("training")
  await expect(
    page.getByRole("heading", {
      name: "No archived records found",
      exact: true,
    }),
  ).toBeVisible()
})
