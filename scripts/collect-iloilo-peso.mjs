// Read the official Iloilo PESO/CFO public board through its normal browser UI.
// No sign-in, form submission, profile forwarding, or hidden API is used.
import { chromium } from "@playwright/test"
import fs from "node:fs/promises"
import crypto from "node:crypto"

const base =
  "https://iloiloprovince.balinkbayan.gov.ph/available-job-opportunities"
const browser = await chromium.launch({ channel: "msedge", headless: true })
try {
  const page = await browser.newPage()
  const response = await page.goto(base, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  if (response?.status() !== 200)
    throw Error("Official board unavailable; existing catalog preserved")
  await page.locator(".company .job strong").first().waitFor({ timeout: 30000 })
  const cards = await page.locator(".company").evaluateAll((nodes) =>
    nodes.map((card) => ({
      organization: card.querySelector(".company-head h3")?.textContent?.trim(),
      overseas: Boolean(card.querySelector(".overseas-head")),
      roles: [...card.querySelectorAll(".job strong")].map((n) =>
        n.textContent.trim(),
      ),
      application: card.querySelector("a.apply-btn")?.getAttribute("href"),
      detail: card.querySelector("a.details-btn")?.getAttribute("href"),
    })),
  )
  const stamp = new Date().toISOString()
  const html = await page.content()
  const rows = [],
    excluded = []
  const encode = (value) =>
    encodeURIComponent(value).replace(
      /[!'()*-]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    )
  for (const card of cards) {
    if (
      !card.organization ||
      !card.roles.length ||
      !card.application?.startsWith("https://")
    ) {
      excluded.push({
        organization: card.organization,
        reason: "No complete public application instructions",
      })
      continue
    }
    for (const title of card.roles) {
      const url =
        base +
        "#:~:text=" +
        encode(card.organization) +
        "&text=" +
        encode(title)
      if (url.length > 690) {
        excluded.push({
          organization: card.organization,
          title,
          reason: "Source lookup URL exceeds supported length",
        })
        continue
      }
      rows.push({
        title: title.slice(0, 160),
        organization: card.organization.slice(0, 160),
        location: card.overseas
          ? "Overseas · country not disclosed · Iloilo PESO source"
          : "Work site not disclosed · Iloilo PESO source",
        industry: "See official qualifications",
        employment_type: "See official listing",
        source_posted_on: null,
        source_salary: null,
        slots: null,
        deadline: null,
        skills: [],
        description: `The official Iloilo PESO / Commission on Filipinos Overseas board lists ${title} under ${card.organization}. ${
          card.overseas
            ? "This is an overseas recruitment reference; the public board does not identify the destination country. Verify the agency license, approved job order and current recruitment status with DMW and PESO."
            : "Confirm the actual work site and current hiring status with PESO or the employer."
        } The board provides an application link, but does not publish a closing date, remaining slots, pay or full qualifications in this view. Details link to an external social-media post. This entry is not a confirmation that applications remain open.`,
        source_url: url,
        source_page_url: base,
        source_name: "Iloilo Provincial PESO · CFO BaLinkBayan",
        checked_at: stamp,
        availability: "confirm_availability",
        work_scope: card.overseas ? "overseas_reference" : "local_reference",
      })
    }
  }
  const unique = [...new Map(rows.map((r) => [r.source_url, r])).values()]
  if (!unique.length)
    throw Error("No reviewed records; existing catalog preserved")
  const report = {
    review_date: new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    }),
    source_url: base,
    source_name: "Iloilo Provincial PESO · CFO BaLinkBayan",
    http_status: 200,
    checked_at: stamp,
    sha256: crypto.createHash("sha256").update(html).digest("hex"),
    observed_company_cards: cards.length,
    included_records: unique.length,
    overseas_references: unique.filter(
      (r) => r.work_scope === "overseas_reference",
    ).length,
    excluded,
    limits:
      "Official-board references only; current intake, remaining slots, country and deadlines are not confirmed. No agency licensing claim is inferred.",
  }
  const folder = new URL("../backend/database/data/", import.meta.url)
  const existingPath = new URL("verified-vacancies.json", folder)
  const existing = JSON.parse(await fs.readFile(existingPath, "utf8"))
  const merged = [
    ...existing.filter((r) => !r.source_url.startsWith(base)),
    ...unique,
  ]
  await fs.writeFile(existingPath, JSON.stringify(merged, null, 2) + "\n")
  await fs.writeFile(
    new URL("verified-iloilo-vacancies.json", folder),
    JSON.stringify(unique, null, 2) + "\n",
  )
  await fs.writeFile(
    new URL("verified-iloilo-vacancy-coverage.json", folder),
    JSON.stringify(report, null, 2) + "\n",
  )
  await fs.mkdir(new URL("../.local/nationwide-review/", import.meta.url), {
    recursive: true,
  })
  await fs.writeFile(
    new URL(
      "../.local/nationwide-review/iloilo-public-board.html",
      import.meta.url,
    ),
    html,
  )
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}
