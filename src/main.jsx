import React from "react"

import ReactDOM from "react-dom/client"

import Login from "./login.jsx"

import "./index.css"
import "./styles/monochrome.css"
import { announceUpdate } from "./platform/pwaUpdates.js"

if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  !navigator.userAgent.includes("PESOAndroid")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const announce = () => {
          if (registration.waiting && navigator.serviceWorker.controller)
            announceUpdate(registration.waiting)
        }
        announce()
        registration.addEventListener("updatefound", () =>
          registration.installing?.addEventListener("statechange", announce),
        )
      })
      .catch(() => {
        /* Online service remains available when installation is unsupported. */
      })
    let reloading = false,
      requestedUpdate = false
    window.addEventListener("peso:reload-update", () => {
      requestedUpdate = true
    })
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return
      if (navigator.serviceWorker.controller && requestedUpdate) {
        reloading = true
        location.reload()
      }
    })
  })
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
)
