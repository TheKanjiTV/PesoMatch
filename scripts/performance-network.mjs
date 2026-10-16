import { chromium, request } from "@playwright/test"
import { readFile, writeFile } from "node:fs/promises"
import { apiCall } from "../tests/fixtures.js"
const label = process.argv[2] || "baseline"
const origin = process.env.PESO_AUDIT_ORIGIN || "http://127.0.0.1:8443"
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Use a local preview and a disposable account.")
const folder = new URL("../.local/performance/", import.meta.url)
const fixture = JSON.parse(
  await readFile(new URL("fixture.json", folder), "utf8"),
)
const api = await request.newContext({ baseURL: origin })
if ((await apiCall(api, "/api/auth/login", "POST", fixture)).status() !== 200)
  throw Error("Fixture login failed")
const browser = await chromium.launch({ channel: "msedge", headless: true })
const context = await browser.newContext({
  storageState: await api.storageState(),
})
const responses = [],
  errors = [],
  pending = []
context.on("response", (r) =>
  pending.push(
    (async () => {
      const u = new URL(r.url())
      if (u.origin !== origin) return
      await r.finished()
      const sizes = await r
        .request()
        .sizes()
        .catch(() => ({ responseBodySize: 0 }))
      responses.push({
        path: u.pathname,
        worker: !!r.request().serviceWorker(),
        bytes: Math.max(0, sizes.responseBodySize),
        status: r.status(),
      })
    })(),
  ),
)
const page = await context.newPage()
page.on("pageerror", (e) => errors.push(e.message))
const eventsReady = page.waitForResponse(r => new URL(r.url()).pathname === "/api/platform/events")
await page.goto(origin + "/dashboard")
await page.getByRole("heading", { level: 1 }).waitFor()
if (!page.url().endsWith("/dashboard"))
  throw Error(
    JSON.stringify({
      url: page.url(),
      api: responses.filter((r) => r.path.startsWith("/api/")),
      errors,
    }),
  )
await page.evaluate(() => navigator.serviceWorker.ready)
await eventsReady
await page.waitForTimeout(2000)
await Promise.all(pending)
const result = {
  origin,
  responses,
  errors,
  apiCounts: responses
    .filter((r) => r.path.startsWith("/api/"))
    .reduce((a, r) => ((a[r.path] = (a[r.path] || 0) + 1), a), {}),
  jsRequests: responses.filter((r) => r.path.endsWith(".js")).length,
  jsBodyBytes: responses
    .filter((r) => r.path.endsWith(".js"))
    .reduce((s, r) => s + r.bytes, 0),
  workerBodyBytes: responses
    .filter((r) => r.worker)
    .reduce((s, r) => s + r.bytes, 0),
}
await writeFile(
  new URL(label + "-network.json", folder),
  JSON.stringify(result, null, 2),
)
console.log(JSON.stringify(result))
await browser.close()
await api.dispose()
