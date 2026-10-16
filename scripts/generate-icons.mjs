import { chromium } from "@playwright/test"
import { mkdir, readFile, copyFile } from "node:fs/promises"
const mark = await readFile("public/peso-mark.svg", "utf8")
await copyFile("public/peso-mark.svg", "public/favicon.svg")
await mkdir("public/icons", { recursive: true })
const browser = await chromium.launch({ channel: "msedge" })
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<html><body style="margin:0;display:grid;place-items:center;background:#123d35;width:100vw;height:100vh"><div style="width:68%;height:68%;display:grid;place-items:center">${mark}</div></body></html>`,
    )
    await page.screenshot({ path: `public/icons/peso-${size}.png` })
  }
} finally {
  await browser.close()
}
