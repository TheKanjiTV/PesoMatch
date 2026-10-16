import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import { fileURLToPath, URL } from "node:url"
import { pesoPwa } from "./scripts/pwa-build.js"
import { pesoSecurityHeaders } from "./scripts/security-headers.js"

const accountProxy = {
  "/api": {
    target: process.env.VITE_LARAVEL_PROXY_URL || "http://127.0.0.1:8000",
    changeOrigin: false,
  },

  "/sanctum": {
    target: process.env.VITE_LARAVEL_PROXY_URL || "http://127.0.0.1:8000",
    changeOrigin: false,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pesoPwa(), pesoSecurityHeaders()],

  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  // Open preview/PWA tabs may still request chunks from the previous build.
  // Keep content-hashed files available while publishing the new index.
  build: { emptyOutDir: false },

  server: {
    host: "127.0.0.1",

    port: 8443,

    strictPort: true,

    proxy: accountProxy,

    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem,key}",
        "**/.git/**",
        "**/backend/**",
        "**/.local/**",
        "**/android/**",
        "**/node_modules/**/.env*",
      ],
    },

    watch: {
      ignored: [
        "**/backend/**",
        "**/logs/**",
        "**/test-results/**",
        "**/playwright-report/**",
      ],
    },
  },

  preview: {
    host: "127.0.0.1",

    port: 8443,

    strictPort: true,

    proxy: accountProxy,
  },
})
