import { test, expect, apiCall } from "./helpers.js"
import AxeBuilder from "@axe-core/playwright"

test("official nationwide vacancies show provenance, honest metadata and a working saved list", async ({
  page,
  account,
}) => {
  const vacancies = (
    await (await apiCall(account.request, "/api/platform/vacancies")).json()
  ).data
  const official = vacancies.filter(
    (v) => !v.is_sample && v.external_application,
  )
  expect(official.length).toBeGreaterThanOrEqual(10)
  const vacancy = official.find((v) => v.source_salary)
  expect(vacancy.source_url).toMatch(
    /^https:\/\/philjobnet.gov.ph\/job-vacancies\/job\//,
  )
  expect(vacancy.deadline).toBeNull()
  expect(vacancy.slots).toBeNull()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/jobs/${vacancy.id}`)
  await expect(
    page.getByRole("link", { name: "View official listing & apply" }),
  ).toHaveAttribute("href", vacancy.source_url)
  await expect(
    page.getByText("Not stated · confirm with employer", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText(/pay period not stated/)).toBeVisible()
  const checked = new Date(vacancy.source_checked_at).toLocaleDateString(
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
  const matches = (
    await (await apiCall(account.request, "/api/platform/matches")).json()
  ).matches
  expect(matches.some((m) => m.vacancy.id === vacancy.id)).toBe(true)
  for (const match of matches)
    for (const course of match.training)
      for (const skill of course.addresses) {
        expect(match.assessment.missing_skills).toContain(skill)
        expect(course.program.skills).toContain(skill)
      }
})
