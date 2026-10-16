// Local-only reproducible authenticated audit. Lighthouse is isolated in .local,
// never an application dependency. Reports/state contain test-only data.
import { chromium, request } from "@playwright/test"
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { fileURLToPath } from "node:url"
import { apiCall, personal, education, preferences } from "../tests/fixtures.js"

const label = process.argv[2] || "baseline"
const origin = process.env.PESO_AUDIT_ORIGIN || "http://127.0.0.1:8443"
if (!["127.0.0.1", "localhost"].includes(new URL(origin).hostname))
  throw Error("Use a local preview and a disposable account.")
const folder = new URL("../.local/performance/", import.meta.url)
await mkdir(folder, { recursive: true })
const fixturePath = new URL("fixture.json", folder)
let fixture
try {
  fixture = JSON.parse(await readFile(fixturePath, "utf8"))
} catch {}
const api = await request.newContext({ baseURL: origin })
if (label === "cleanup") {
  if (fixture)
    execFileSync(
      "php",
      [
        fileURLToPath(
          new URL("../tests/platform/cleanup.php", import.meta.url),
        ),
        String(fixture.id),
        fixture.email,
      ],
      { windowsHide: true },
    )
  await api.dispose()
  await unlink(fixturePath).catch(() => {})
  console.log("Disposable performance account removed.")
  process.exit(0)
}
if (!fixture) {
  fixture = {
    email: `platform.${Date.now()}.${randomBytes(5).toString("hex")}@example.test`,
    password: randomBytes(22).toString("base64url") + "aA1!",
  }
  const registered = await apiCall(api, "/api/auth/register", "POST", {
    first_name: "Platform",
    last_name: "Check",
    email: fixture.email,
    password: fixture.password,
    terms_accepted: true,
    password_confirmation: fixture.password,
  })
  if (registered.status() !== 201)
    throw Error("Could not create audit fixture.")
  fixture.id = (await registered.json()).user.id
  await writeFile(fixturePath, JSON.stringify(fixture))
}
if ((await apiCall(api, "/api/auth/login", "POST", fixture)).status() !== 200)
  throw Error("Audit login failed.")
if (
  !(await (await apiCall(api, "/api/auth/user")).json()).onboarding.completed
) {
  for (const [section, data] of [
    ["personal", personal("Platform")],
    ["education", education],
    [
      "skills",
      { skills: [1, 2, 3], certifications: [], languages: [], licenses: [] },
    ],
    ["work-experience", { has_experience: false, experiences: [] }],
    ["preferences", preferences],
  ]) {
    if (
      (
        await apiCall(
          api,
          `/api/jobseeker/onboarding/${section}`,
          "PATCH",
          data,
        )
      ).status() !== 200
    )
      throw Error(`Fixture ${section} failed.`)
  }
  if (
    (
      await apiCall(api, "/api/jobseeker/onboarding/complete", "POST")
    ).status() !== 200
  )
    throw Error("Fixture completion failed.")
}
await apiCall(api, "/api/auth/preferences", "PATCH", {
  dashboard_tour_completed: true,
})
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--remote-debugging-port=9222"],
})
const context = await browser.newContext({
  storageState: await api.storageState(),
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send("Network.enable")
await cdp.send("Network.setCacheDisabled", { cacheDisabled: true })
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
await page.goto(`${origin}/dashboard`)
await page.getByRole("heading", { level: 1 }).waitFor()
if (!page.url().endsWith("/dashboard"))
  throw Error("Audit did not reach authenticated dashboard.")
await page.screenshot({
  path: fileURLToPath(new URL(`${label}-mobile.png`, folder)),
  fullPage: true,
})
await page.setViewportSize({ width: 1440, height: 1000 })
await page.screenshot({
  path: fileURLToPath(new URL(`${label}-desktop.png`, folder)),
  fullPage: true,
})
await page.goto("about:blank")
await context.close()
// Only disposable fixture cookies enter the private ignored raw reports.
// Storage reset remains enabled for comparable cold navigations.
const cookie = (await api.storageState()).cookies
  .map((c) => `${c.name}=${c.value}`)
  .join("; ")
const { default: lighthouse } =
  await import("../.local/performance-tools/node_modules/lighthouse/core/index.js")
const reports = []
for (let n = 1; n <= 3; n++) {
  const result = await lighthouse(`${origin}/dashboard`, {
    port: 9222,
    output: ["json", "html"],
    logLevel: "error",
    extraHeaders: { Cookie: cookie },
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  })
  if (result.lhr.runtimeError)
    throw Error(JSON.stringify(result.lhr.runtimeError))
  if (!result.lhr.finalDisplayedUrl.endsWith("/dashboard"))
    throw Error("Lighthouse lost authentication.")
  await writeFile(new URL(`${label}-${n}.json`, folder), result.report[0])
  await writeFile(new URL(`${label}-${n}.html`, folder), result.report[1])
  const a = result.lhr.audits,
    network = a["network-requests"].details.items
  const js = network.filter((r) => r.resourceType === "Script"),
    images = network.filter((r) => r.resourceType === "Image")
  const apiRequests = network
    .filter((r) => new URL(r.url).pathname.startsWith("/api/"))
    .map((r) => ({
      path: new URL(r.url).pathname,
      ms: Math.round(r.networkEndTime - r.networkRequestTime),
    }))
  const summary = {
    run: n,
    version: result.lhr.lighthouseVersion,
    url: result.lhr.finalDisplayedUrl,
    performance: result.lhr.categories.performance.score * 100,
    accessibility: result.lhr.categories.accessibility.score * 100,
    bestPractices: result.lhr.categories["best-practices"].score * 100,
    seo: result.lhr.categories.seo.score * 100,
    FCP: a["first-contentful-paint"].numericValue,
    LCP: a["largest-contentful-paint"].numericValue,
    TBT: a["total-blocking-time"].numericValue,
    CLS: a["cumulative-layout-shift"].numericValue,
    jsTransfer: js.reduce((s, r) => s + r.transferSize, 0),
    imageTransfer: images.reduce((s, r) => s + r.transferSize, 0),
    scriptRequests: js.length,
    apiRequests,
    largestScripts: js
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 6)
      .map((r) => ({ path: new URL(r.url).pathname, bytes: r.transferSize })),
    errors,
  }
  reports.push(summary)
  console.log(JSON.stringify(summary))
}
await writeFile(
  new URL(`${label}-summary.json`, folder),
  JSON.stringify(reports, null, 2),
)
await browser.close()
await api.dispose()
