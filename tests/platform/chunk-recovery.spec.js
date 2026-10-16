import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { execFileSync } from "node:child_process"
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../../", import.meta.url))
const read = (path) =>
  readFile(new URL(`../../${path}`, import.meta.url), "utf8")
const entry = (html) => html.match(/src="([^"]+\.js)"/)?.[1]
const assets = (worker) =>
  JSON.parse(worker.match(/const ASSETS=(\[[^\n]+\]);/)[1])
const release = (worker) => worker.match(/const VERSION='([a-f0-9]+)'/)[1]
function build() {
  execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
    cwd: root,
    windowsHide: true,
    stdio: "pipe",
  })
}

test.describe
  .serial("release-safe lazy routes", () => {
    test.beforeEach(async ({ request }) => {
      const html = await (
        await request.get("/", { headers: { Accept: "text/html" } })
      ).text()
      test.skip(
        html.includes("/@vite/client"),
        "Rebuild retention and static headers require production preview, not the Vite development server.",
      )
    })
    test("an open landing can load its original auth chunk after rebuilding, without release churn", async ({
      page,
      request,
    }) => {
      test.setTimeout(180000)
      const before = entry(await read("dist/index.html"))
      const originalAuth = assets(await read("dist/sw.js")).find((path) =>
        /\/AuthPages-/.test(path),
      )
      expect(originalAuth).toBeTruthy()
      const errors = [],
        requests = []
      page.on("pageerror", (error) => errors.push(error.message))
      page.on("request", (req) => requests.push(new URL(req.url()).pathname))
      await page.goto("/")
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      expect(requests.some((path) => /AuthPages-/.test(path))).toBe(false)
      build()
      const firstWorker = await read("dist/sw.js")
      const after = entry(await read("dist/index.html"))
      for (const path of [before, originalAuth]) {
        const response = await request.get(path)
        expect(response.status()).toBe(200)
        expect(response.headers()["content-type"]).toMatch(/javascript/)
        expect(response.headers()["cache-control"]).toContain("immutable")
      }
      await page.getByRole("link", { name: "Sign in", exact: true }).click()
      await expect(
        page.getByRole("heading", { name: "Welcome back." }),
      ).toBeVisible()
      expect(requests).toContain(originalAuth)
      expect(errors).toEqual([])
      const markerName = `previous-release-probe-${Date.now()}.js`
      const marker = new URL(`../../dist/assets/${markerName}`, import.meta.url)
      await writeFile(
        marker,
        "// Disposable previous-release retention probe.\n",
        "utf8",
      )
      try {
        build()
        expect(await readFile(marker, "utf8")).toContain("retention probe")
        const secondWorker = await read("dist/sw.js")
        expect(release(secondWorker)).toBe(release(firstWorker))
        expect(assets(secondWorker)).not.toContain(`/assets/${markerName}`)
        expect(
          assets(secondWorker).some((path) => /AuthPages-/.test(path)),
        ).toBe(true)
        expect(assets(secondWorker).some((path) => /\.css$/.test(path))).toBe(
          true,
        )
        await mkdir("artifacts/chunk-recovery", { recursive: true })
        await writeFile(
          "artifacts/chunk-recovery/build-retention.json",
          JSON.stringify(
            {
              entryBefore: before,
              entryAfter: after,
              entryChanged: before !== after,
              originalAuth,
              originalAssetsReachable: true,
              identicalRebuildVersionStable: true,
              retainedFilesExcludedFromCurrentWorker: true,
            },
            null,
            2,
          ),
        )
      } finally {
        await unlink(marker)
      }
    })

    test("missing auth modules show accessible recovery and retry loads the form", async ({
      page,
    }) => {
      const pattern = /\/assets\/AuthPages-[^/]+\.js$/
      await page.route(pattern, (route) => route.abort("failed"))
      await page.goto("/login")
      await expect(
        page.getByRole("heading", { name: "This page couldn't load" }),
      ).toBeVisible()
      await expect(page.getByRole("alert")).toContainText("required page file")
      await expect(page.getByText("Unexpected Application Error!")).toHaveCount(
        0,
      )
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([])
      await page.unroute(pattern)
      await page.getByRole("button", { name: "Retry page" }).click()
      await expect(
        page.getByRole("heading", { name: "Welcome back." }),
      ).toBeVisible()
      await expect(page.getByLabel("Email Address")).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await mkdir("artifacts/chunk-recovery", { recursive: true })
      await page.screenshot({
        path: "artifacts/chunk-recovery/login-recovered.png",
        fullPage: true,
      })
      await page.locator("#auth-main").screenshot({
        path: "artifacts/chunk-recovery/login-form.png",
      })
    })

    test("missing assets are genuine uncached 404s and public auth routes still work", async ({
      page,
      request,
    }) => {
      for (const path of [
        "/assets/AuthPages-BNC0sYh1.js",
        "/assets/missing-regression.css",
      ]) {
        const response = await request.get(path)
        expect(response.status()).toBe(404)
        expect(response.headers()["content-type"]).toContain("text/plain")
        expect(response.headers()["cache-control"]).toBe("no-store")
        expect(response.headers()["x-content-type-options"]).toBe("nosniff")
        expect(await response.text()).not.toContain("<html")
      }
      for (const path of ["/login", "/sw.js", "/manifest.webmanifest"]) {
        const response = await request.get(path, {
          headers: { Accept: "text/html" },
        })
        expect(response.status()).toBe(200)
        expect(response.headers()["cache-control"]).toBe("no-cache")
      }
      const errors = []
      page.on("pageerror", (error) => errors.push(error.message))
      await page.setViewportSize({ width: 375, height: 850 })
      for (const [path, heading] of [
        ["/login", "Welcome back."],
        ["/register", "Create your account."],
        ["/staff/login", "Your service desk awaits."],
      ]) {
        await page.goto(path)
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          heading,
        )
        await expect(page.getByLabel("Email Address")).toBeVisible()
      }
      expect(errors).toEqual([])
    })
  })
