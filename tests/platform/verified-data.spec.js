import { test, expect, apiCall } from "./helpers.js"

import AxeBuilder from "@axe-core/playwright"

test("official PESO vacancies show provenance, honest metadata and a working saved list", async ({
  page,

  account,
}) => {
  const vacancies = (
    await (
      await apiCall(account.request, "/api/v1/platform/vacancies?location=Pasay")
    ).json()
  ).data

  const official = vacancies.filter(
    (v) => !v.is_sample && v.external_application,
  )

  expect(official.length).toBeGreaterThanOrEqual(10)

  const vacancy = official.find((v) =>
    v.source_url.startsWith("https://pasay.gov.ph/peso-jobs/"),
  )

  expect(vacancy.source_url).toMatch(/^https:\/\/pasay.gov.ph\/peso-jobs\//)

  expect(vacancy.deadline).toBeNull()

  expect(vacancy.slots).toBeNull()

  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto(`/jobs/${vacancy.id}`)

  await expect(
    page.getByRole("link", {
      name: "View official source information",
    }),
  ).toHaveAttribute("href", vacancy.source_url)

  await expect(
    page.getByText("Not stated · confirm with employer", { exact: true }),
  ).toBeVisible()

  await expect(page.getByText("Listed pay", { exact: true })).toBeVisible()

  await expect(page.getByText("Not stated", { exact: true })).toHaveCount(2)

  const checked = new Date(vacancy.source_checked_at).toLocaleDateString(
    "en-PH",

    {
      timeZone: "Asia/Manila",

      month: "short",

      day: "numeric",

      year: "numeric",
    },
  )

  await expect(
    page.getByText(`Checked ${checked}`, { exact: false }),
  ).toBeVisible()

  await expect(
    page.getByRole("button", { name: "Request referral", exact: true }),
  ).toHaveCount(0)

  await page.getByRole("button", { name: "Save vacancy", exact: true }).click()

  await expect(
    page.getByRole("button", { name: "Unsave vacancy", exact: true }),
  ).toBeVisible()

  await page.reload()

  await expect(
    page.getByRole("button", { name: "Unsave vacancy", exact: true }),
  ).toBeVisible()

  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  )

  expect(
    (
      await new AxeBuilder({ page })

        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])

        .analyze()
    ).violations,
  ).toEqual([])

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true)

  await page.screenshot({
    path: "artifacts/revisions/official-vacancy-mobile.png",

    fullPage: true,
  })

  const result = await (
    await apiCall(account.request, "/api/v1/platform/matches")
  ).json()

  const matches = result.matches

  expect(result.total).toBeGreaterThanOrEqual(official.length)

  for (const match of matches)
    for (const course of match.training)
      for (const skill of course.addresses) {
        expect(match.assessment.missing_skills).toContain(skill)

        expect(course.program.skills).toContain(skill)
      }

  if (result.last_page > 1) {
    await page.goto("/matches")

    await expect(
      page.getByRole("button", { name: "Next page", exact: true }),
    ).toBeEnabled()

    const response = page.waitForResponse((r) =>
      r.url().includes("/api/v1/platform/matches?page=2"),
    )

    await page.getByRole("button", { name: "Next page", exact: true }).click()

    expect((await (await response).json()).current_page).toBe(2)

    await expect(
      page.getByText(`Page 2 of ${result.last_page} · ${result.total} records`),
    ).toBeVisible()

    await page

      .getByRole("button", {
        name: "Skills development recommendations",

        exact: true,
      })

      .click()

    await expect(
      page.getByRole("button", { name: "Next page", exact: true }),
    ).toHaveCount(0)
  }

  const courses = (
    await (await apiCall(account.request, "/api/v1/platform/training")).json()
  ).data

  const unmappedCourse = courses.find(
    (course) => course.external_enrollment && !course.skills.length,
  )

  if (unmappedCourse) {
    await page.goto(`/training/${unmappedCourse.id}`)

    await expect(
      page.getByText(
        "No skill topics mapped. Review the official course syllabus and entry requirements.",
      ),
    ).toBeVisible()

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)

    await page.screenshot({
      path: "artifacts/revisions/official-course-mobile.png",

      fullPage: true,
    })
  }
})
