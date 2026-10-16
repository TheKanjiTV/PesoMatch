// Anonymous primary-source snapshots for human review; never import scraped
// content blindly or send an authenticated platform session to another site.
import { mkdir, writeFile } from "node:fs/promises"
const folder = new URL("../.local/source-review/", import.meta.url)
await mkdir(folder, { recursive: true })
const sources = [
  ["jobs", "https://philjobnet.gov.ph/job-vacancies"],
  [
    "tesda-communication",
    "https://e-tesda.gov.ph/course/index.php?categoryid=37",
  ],
  [
    "tesda-catalog",
    "https://e-tesda.gov.ph/course/search.php?perpage=all&search=ID",
  ],
  ["dole-events", "https://ro11.dole.gov.ph/job-fair-schedules/"],
]
for (const [name, url] of sources) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const html = await response.text()
    await writeFile(new URL(`${name}.html`, folder), html)
    console.log(
      JSON.stringify({
        name,
        url,
        status: response.status,
        bytes: html.length,
        links: [
          ...new Set(
            [
              ...html.matchAll(
                /href=["']([^"']*(?:job-vacancies\/job|course\/view\.php)[^"']*)["']/g,
              ),
            ].map((match) => match[1]),
          ),
        ].slice(0, 25),
      }),
    )
  } catch (error) {
    console.log(JSON.stringify({ name, error: error.name }))
  }
}
