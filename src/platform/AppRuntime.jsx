import { useEffect, useState } from "react"
import { Link } from "react-router"
import { Download, RefreshCw, WifiOff } from "lucide-react"
import { primaryStyle, secondaryStyle } from "./ui.jsx"

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone ||
  navigator.userAgent.includes("PESOAndroid")

let installPrompt = null

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault()

  installPrompt = e

  window.dispatchEvent(new Event("peso:install-ready"))
})

window.addEventListener("appinstalled", () => {
  installPrompt = null

  window.dispatchEvent(new Event("peso:install-ready"))
})

export function InstallButton({ compact = false }) {
  const [installed, setInstalled] = useState(standalone),
    [, refresh] = useState(0),
    [busy, setBusy] = useState(false)

  useEffect(() => {
    const update = () => {
      setInstalled(standalone())

      refresh((n) => n + 1)
    }

    window.addEventListener("peso:install-ready", update)

    return () => window.removeEventListener("peso:install-ready", update)
  }, [])

  if (installed) return null

  async function install() {
    if (!installPrompt) return

    setBusy(true)

    const prompt = installPrompt

    try {
      await prompt.prompt()

      await prompt.userChoice
    } finally {
      installPrompt = null

      setBusy(false)

      refresh((n) => n + 1)
    }
  }

  const contents = (
    <>
      <Download size={17} />
      <span>{compact ? "Install" : "Install PESO app"}</span>
    </>
  )

  return installPrompt ? (
    <button disabled={busy} onClick={install} className={secondaryStyle}>
      {busy ? "Opening installer…" : contents}
    </button>
  ) : (
    <Link to="/app" className={secondaryStyle}>
      {contents}
    </Link>
  )
}

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)

    window.addEventListener("online", update)

    window.addEventListener("offline", update)

    return () => {
      window.removeEventListener("online", update)

      window.removeEventListener("offline", update)
    }
  }, [])

  return !online ? (
    <div role="status" className="connection-notice">
      <WifiOff size={18} />
      You’re offline. Connect to load or save service records.
    </div>
  ) : null
}

export function AppUpdate() {
  const [update, setUpdate] = useState(null)

  useEffect(() => {
    const receive = (e) => {
      const next = e.detail
      if (!next?.worker || !next.version) return
      try {
        if (localStorage.getItem("peso-dismissed-update") === next.version)
          return
      } catch {}
      setUpdate(next)
    }

    window.addEventListener("peso:update", receive)

    return () => window.removeEventListener("peso:update", receive)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem("peso-dismissed-update", update.version)
    } catch {}
    setUpdate(null)
  }

  return update ? (
    <section
      className="app-update"
      role="status"
      aria-label="App update available"
    >
      <div className="app-update-heading">
        <span className="app-update-icon">
          <RefreshCw size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Update ready</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Save your work, then reload to get the latest version.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button type="button" className={secondaryStyle} onClick={dismiss}>
          Later
        </button>
        <button
          type="button"
          className={primaryStyle}
          onClick={() => {
            window.dispatchEvent(new Event("peso:reload-update"))

            update.worker.postMessage({ type: "SKIP_WAITING" })
            dismiss()
          }}
        >
          <RefreshCw size={16} />
          Reload app
        </button>
      </div>
    </section>
  ) : null
}
