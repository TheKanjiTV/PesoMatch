import { useEffect, useId, useRef, useState } from "react"

import { api } from "./api.js"

import { dangerStyle, inputStyle, Notice, secondaryStyle } from "./ui.jsx"

export function DeleteDialog({ type, record, onClose, onDeleted }) {
  const dialog = useRef(null)

  const heading = useId(),
    help = useId()

  const [token, setToken] = useState("")

  const [remaining, setRemaining] = useState(5)

  const [password, setPassword] = useState("")

  const [error, setError] = useState("")

  const [busy, setBusy] = useState(false)

  const submitting = useRef(false)

  useEffect(() => {
    const previous = document.activeElement

    dialog.current?.showModal()

    dialog.current?.querySelector("[data-cancel]")?.focus()

    let alive = true,
      interval

    api("/delete-intents", "POST", { type, id: record.id })

      .then((result) => {
        if (!alive) return

        setToken(result.token)

        const ready = Date.now() + result.wait_seconds * 1000

        interval = setInterval(
          () =>
            setRemaining(Math.max(0, Math.ceil((ready - Date.now()) / 1000))),

          150,
        )
      })

      .catch((failure) => {
        if (alive) setError(failure.message)
      })

    return () => {
      alive = false

      clearInterval(interval)

      previous?.isConnected && previous.focus()
    }
  }, [type, record.id])

  async function remove(event) {
    event.preventDefault()

    if (!token || remaining || submitting.current) return

    submitting.current = true

    setBusy(true)

    setError("")

    try {
      await api(`/remove/${type}/${record.id}`, "DELETE", {
        confirmation_token: token,

        ...(type === "account" ? { current_password: password } : {}),
      })

      await onDeleted()

      onClose()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)

      submitting.current = false
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={heading}
      aria-describedby={help}
      className="delete-dialog"
      onCancel={(event) => {
        if (busy) event.preventDefault()
        else onClose()
      }}
    >
      <form onSubmit={remove} className="space-y-5">
        <h2 id={heading} className="font-display text-2xl text-primary">
          Are you sure you want to archive{" "}
          {record.title || record.name || "this enrollment"}?
        </h2>
        <p id={help} className="text-sm leading-6 text-muted-foreground">
          {type === "account"
            ? "This disables sign-in and revokes sessions while preserving personal records. An administrator can restore the account from Archive & Restore. Permanent personal-data deletion remains separate in Account Settings."
            : type === "enrollment"
              ? "An active request will be withdrawn and removed from your list. Completed training remains as history."
              : "This removes the item from the active catalog and preserves linked history. An administrator can restore it as a draft from Archive & Restore. A later source import does not restore it automatically."}
        </p>
        {type === "account" && (
          <label className="block text-sm font-semibold">
            Your current administrator password
            <input
              type="password"
              autoComplete="current-password"
              required
              className={`${inputStyle} mt-2`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}
        <p role="status" className="font-semibold">
          {!token
            ? "Preparing confirmation…"
            : remaining
              ? `Please review this action. Archive unlocks in ${remaining} seconds.`
              : "You can now confirm archiving."}
        </p>
        {error && <Notice error>{error}</Notice>}
        <div className="flex flex-wrap gap-3">
          <button
            data-cancel
            type="button"
            className={`${secondaryStyle} action-cancel`}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={dangerStyle}
            disabled={!token || remaining > 0 || busy}
          >
            {busy
              ? "Archiving…"
              : remaining
                ? `Archive (${remaining})`
                : "Archive item"}
          </button>
        </div>
      </form>
    </dialog>
  )
}
