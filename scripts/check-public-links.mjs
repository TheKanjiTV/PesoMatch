// Read-only public source check. Never sends account cookies or private data.
import { readFile, writeFile, mkdir } from "node:fs/promises"
const paths = [
  "../backend/database/data/verified-vacancies.json",
  "../backend/database/data/verified-training.json",
  "../backend/database/data/verified-international-training.json",
  "../backend/database/data/verified-events.json",
  "../backend/database/data/verified-public-resources.json",
]
const urls = new Set()
for (const path of paths)
  for (const record of JSON.parse(
    await readFile(new URL(path, import.meta.url), "utf8"),
  ))
    urls.add(record.source_url)
const help = await readFile(
  new URL("../src/app/auth/OfficialHelp.jsx", import.meta.url),
  "utf8",
)
for (const [, url] of help.matchAll(/source:\s*"(https:[^"]+)"/g)) urls.add(url)
urls.add("https://privacy.gov.ph/data-subject-rights/")
const queue = [...urls],
  results = []
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      const parsed = new URL(url)
      if (
        parsed.protocol !== "https:" ||
        !/^(pasay\.gov\.ph|negrosjobs\.mis-negros\.com|www\.camarinessur\.gov\.ph|ormindoro\.gov\.ph|iloiloprovince\.balinkbayan\.gov\.ph|mwo-osaka\.dmw\.gov\.ph|e-tesda\.gov\.ph|ble\.dole\.gov\.ph|www\.tesda\.gov\.ph|privacy\.gov\.ph|ro11\.dole\.gov\.ph|openstat\.psa\.gov\.ph|docs\.google\.com)$/.test(
          parsed.hostname,
        )
      )
        throw Error("Unexpected public source host")
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          redirect: "follow",
          headers: { "User-Agent": "PesoMatch-public-link-audit/1.0" },
        })
        await response.body?.cancel()
        const restricted = /\/login\b/i.test(new URL(response.url).pathname)
        results.push({
          url,
          status: response.status,
          finalUrl: response.url,
          result: restricted
            ? "AUTHENTICATION_REQUIRED"
            : response.ok
              ? "REACHABLE"
              : [404, 410].includes(response.status)
                ? "BROKEN"
                : "INCONCLUSIVE",
        })
      } catch (error) {
        results.push({
          url,
          result: "INCONCLUSIVE",
          reason: error.cause?.code || error.name,
        })
      }
      console.log(`${results.length}/${urls.size} public sources checked`)
    }
  }),
)
const directory = new URL("../.local/", import.meta.url)
await mkdir(directory, { recursive: true })
await writeFile(
  new URL("ui-public-links.json", directory),
  JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2),
)
console.log(
  JSON.stringify(
    results.reduce(
      (counts, row) => ({
        ...counts,
        [row.result]: (counts[row.result] || 0) + 1,
      }),
      {},
    ),
  ),
)
for (const row of results.filter((row) => row.result !== "REACHABLE"))
  console.log(JSON.stringify(row))
