import { useEffect, useRef, useState } from "react"
import { api } from "./api.js"
import { Modal } from "./Modal.jsx"
import { dangerStyle, inputStyle, Notice, secondaryStyle } from "./ui.jsx"

export function PermanentDeleteDialog({ record, onClose, onDeleted }) {
  const [intent, setIntent] = useState(null)
  const [remaining, setRemaining] = useState(5)
  const [confirmed, setConfirmed] = useState(false)
  const [expired, setExpired] = useState(false)
  const [revision, setRevision] = useState(0)
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)
  useEffect(() => {
    let active = true,
      timer
    setIntent(null)
    setRemaining(5)
    setExpired(false)
    setConfirmed(false)
    setError("")
    api("/archive/delete-intents", "POST", { type: record.type, id: record.id })
      .then((result) => {
        if (!active) return
        setIntent(result)
        const ready = Date.now() + result.wait_seconds * 1000
        const expires = Date.now() + 300000
        timer = setInterval(() => {
          setRemaining(Math.max(0, Math.ceil((ready - Date.now()) / 1000)))
          setExpired(Date.now() >= expires)
        }, 150)
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [record.type, record.id, revision])
  async function remove(e) {
    e.preventDefault()
    // Read the actual password control so password-manager autofill works even
    // when the browser does not dispatch React's usual change event.
    const currentPassword = new FormData(e.currentTarget).get(
      "archive-administrator-password",
    )
    if (
      !intent ||
      remaining ||
      expired ||
      !confirmed ||
      !currentPassword ||
      submitting.current
    )
      return
    submitting.current = true
    setPassword(String(currentPassword))
    setBusy(true)
    setError("")
    try {
      await api(`/archive/${record.type}/${record.id}`, "DELETE", {
        confirmation_token: intent.token,
        confirmation_name: intent.label,
        current_password: currentPassword,
      })
      await onDeleted()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
      submitting.current = false
    }
  }
  const linked = Object.entries(intent?.impact || {}).filter(
    ([, count]) => count > 0,
  )
  return (
    <Modal
      title="Delete permanently?"
      size="compact"
      busy={busy}
      onClose={onClose}
      initialFocusSelector="[data-cancel]"
    >
      <form onSubmit={remove} className="space-y-5" autoComplete="off">
        <div className="space-y-2 border-b border-border pb-5">
          <p className="break-words font-semibold">
            {intent?.label || record.label}
          </p>
          {record.context && (
            <p className="break-words text-sm text-muted-foreground">
              {record.context}
            </p>
          )}
        </div>
        <p className="text-sm leading-6">
          This record will be permanently removed and cannot be restored.
        </p>
        {linked.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {linked.map(([type, count]) => (
              <li key={type}>
                {count} {type.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        )}
        {record.type === "account" && (
          <p className="text-xs leading-6 text-muted-foreground">
            Owned catalog listings and audit records remain. Personal profile
            data, private résumé, sessions and linked service requests are
            removed.
          </p>
        )}
        {record.type === "vacancy" && (
          <p className="text-xs leading-6 text-muted-foreground">
            Independent employment reports remain; links to removed placements
            are cleared.
          </p>
        )}
        {record.type === "training" && (
          <p className="text-xs leading-6 text-muted-foreground">
            Separate source intakes and training topic requests remain; their
            source link is cleared.
          </p>
        )}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-muted p-4 text-sm font-semibold leading-6">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-primary"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={busy}
          />
          <span>I understand this deletion cannot be undone.</span>
        </label>
        <label className="block text-sm font-semibold">
          Your current administrator password
          <input
            className={`${inputStyle} mt-2`}
            type="password"
            name="archive-administrator-password"
            required
            autoComplete="current-password"
            defaultValue=""
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        <p role="status" className="text-sm leading-6 text-muted-foreground">
          {!intent
            ? error
              ? "Deletion confirmation could not load. Review it again to continue."
              : "Loading deletion confirmation…"
            : expired
              ? "Confirmation expired. Review it again to continue."
              : remaining > 0
                ? `You can confirm deletion in ${remaining} seconds.`
                : !confirmed
                  ? "Check the confirmation above to continue."
                  : !password
                    ? "Enter your administrator password to continue."
                    : "Ready to permanently delete this record."}
        </p>
        {error && <Notice error>{error}</Notice>}
        {((!intent && error) || expired || (error && intent)) && (
          <button
            type="button"
            className={secondaryStyle}
            disabled={busy}
            onClick={() => setRevision((value) => value + 1)}
          >
            Review confirmation again
          </button>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <button
            type="button"
            data-cancel
            className={secondaryStyle}
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={dangerStyle}
            disabled={!intent || remaining > 0 || expired || busy || !confirmed}
          >
            {busy
              ? "Deleting…"
              : remaining
                ? `Delete permanently (${remaining})`
                : "Delete permanently"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
