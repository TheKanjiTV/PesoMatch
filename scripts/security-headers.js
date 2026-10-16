import { createHash } from "node:crypto"
import { readFileSync, statSync } from "node:fs"
import { writeFile } from "node:fs/promises"
import { resolve, sep } from "node:path"

const common = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

function policy(html) {
  const hashes = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => `'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`)
  return `default-src 'self'; script-src 'self' ${hashes.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`
}

export function pesoSecurityHeaders() {
  return {
    name: "peso-security-headers",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        for (const [key, value] of Object.entries(common))
          res.setHeader(key, value)
        next()
      })
    },
    configurePreviewServer(server) {
      const directory = resolve(server.config.root, server.config.build.outDir)
      const assetDirectory = resolve(directory, "assets")
      server.middlewares.use((req, res, next) => {
        for (const [key, value] of Object.entries(common))
          res.setHeader(key, value)
        // Laravel returns a stricter policy for JSON; it does not serve the SPA.
        if (!/^\/(api|sanctum)(\/|$)/.test(req.url || ""))
          res.setHeader(
            "Content-Security-Policy",
            policy(readFileSync(resolve(directory, "index.html"), "utf8")),
          )
        let pathname
        try {
          pathname = decodeURIComponent((req.url || "/").split("?")[0])
        } catch {
          res.statusCode = 400
          res.setHeader("Cache-Control", "no-store")
          res.end("Invalid request path.")
          return
        }
        if (pathname.startsWith("/assets/")) {
          const file = resolve(assetDirectory, pathname.slice(8))
          if (
            !file.startsWith(assetDirectory + sep) ||
            !statSync(file, { throwIfNoEntry: false })?.isFile()
          ) {
            // Missing scripts must be 404, never the SPA's HTML fallback.
            res.statusCode = 404
            res.setHeader("Content-Type", "text/plain; charset=utf-8")
            res.setHeader("Cache-Control", "no-store")
            res.end(
              "Application asset unavailable. Reload the page to get the current version.",
            )
            return
          }
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        } else if (
          ["/sw.js", "/manifest.webmanifest", "/index.html"].includes(
            pathname,
          ) ||
          (!/^\/(api|sanctum)(\/|$)/.test(pathname) &&
            String(req.headers.accept || "").includes("text/html"))
        ) {
          res.setHeader("Cache-Control", "no-cache")
        }
        next()
      })
    },
    async closeBundle() {
      const csp = policy(readFileSync("dist/index.html", "utf8"))
      await writeFile(
        "dist/security-headers.conf",
        Object.entries({ ...common, "Content-Security-Policy": csp })
          .map(([key, value]) => `add_header ${key} "${value}" always;`)
          .join("\n") + "\n",
      )
    },
  }
}
