import { readFile, writeFile } from "node:fs/promises"
const folder = new URL("../.local/source-review/", import.meta.url)
const html = await readFile(new URL("jobs.html", folder), "utf8")
const urls = new Set(
  [...html.matchAll(/href=["']([^"']*job-vacancies\/job[^"']*)["']/g)].map(
    (match) => new URL(match[1], "https://philjobnet.gov.ph").href,
  ),
)
const existing = JSON.parse(
  await readFile(
    new URL(
      "../backend/database/data/verified-vacancies.json",
      import.meta.url,
    ),
    "utf8",
  ),
)
for (const row of existing) urls.add(row.source_url)
const queue = [...urls]
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      if (new URL(url).hostname !== "philjobnet.gov.ph")
        throw Error("Unexpected host")
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(20000),
        })
        const html = await response.text()
        const id = new URL(url).pathname.split("-").at(-1)
        await writeFile(new URL(`job-${id}.html`, folder), html)
        console.log(
          JSON.stringify({ url, status: response.status, bytes: html.length }),
        )
      } catch (error) {
        console.log(JSON.stringify({ url, error: error.name }))
      }
    }
  }),
)
