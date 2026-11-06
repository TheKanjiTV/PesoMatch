import { useEffect, useState } from "react"
import { Link } from "react-router"
import { accountRequest } from "../services/account.js"
import { Notice } from "./ui.jsx"

export function isPhilJobNet(url) {
  try {
    return new URL(url).hostname === "philjobnet.gov.ph"
  } catch {
    return false
  }
}

export function useVacancySource(enabled = true) {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    if (!enabled) return
    let active = true
    const check = () => {
      if (document.visibilityState === "hidden") return
      accountRequest("/api/public/vacancy-source-status")
        .then((result) => {
          if (active) setStatus(result)
        })
        .catch(() => {
          if (active) setStatus({ status: "unknown" })
        })
    }
    check()
    const timer = setInterval(check, 10 * 60 * 1000)
    window.addEventListener("online", check)
    window.addEventListener("focus", check)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener("online", check)
      window.removeEventListener("focus", check)
    }
  }, [enabled])
  return status
}

export function VacancySourceNotice({ status }) {
  if (status?.status === "reachable") return null
  const checked = status?.checked_at
    ? new Date(status.checked_at).toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null
  return (
    <div className="mb-5">
      <Notice>
        <div>
          <p className="font-semibold">
            {status?.status === "unavailable"
              ? "PhilJobNet is currently unavailable from PesoMatch."
              : "Current PhilJobNet access has not been confirmed."}
          </p>
          <p className="mt-1">
            PhilJobNet listings here were imported earlier and are not live
            vacancy confirmations. A source error does not confirm that a
            position is closed. Review the saved details and ask PESO for
            application guidance.
          </p>
          {checked && (
            <p className="mt-1 text-xs">
              Portal access checked {checked} (Philippine time)
              {status.http_status ? ` · HTTP ${status.http_status}` : ""}.
              Individual listing check dates are shown separately.
            </p>
          )}
          <Link
            to="/help"
            className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            View official support options
          </Link>
        </div>
      </Notice>
    </div>
  )
}
