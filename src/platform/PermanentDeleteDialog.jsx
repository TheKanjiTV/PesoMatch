import { useEffect, useState } from "react"
import { api } from "./api.js"
import { Modal } from "./Modal.jsx"
import { dangerStyle, inputStyle, Notice, secondaryStyle } from "./ui.jsx"

export function PermanentDeleteDialog({ record, onClose, onDeleted }) {
  const [intent, setIntent] = useState(null)
  const [remaining, setRemaining] = useState(5)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true,
      timer
    api("/archive/delete-intents", "POST", { type: record.type, id: record.id })
      .then((result) => {
        if (!active) return
        setIntent(result)
        const ready = Date.now() + result.wait_seconds * 1000
        timer = setInterval(
          () =>
            setRemaining(Math.max(0, Math.ceil((ready - Date.now()) / 1000))),
          150,
        )
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [record.type, record.id])
  async function remove(e) {
    e.preventDefault()
    if (!intent || remaining || busy || name !== intent.label) return
    setBusy(true)
    setError("")
    try {
      await api(`/archive/${record.type}/${record.id}`, "DELETE", {
        confirmation_token: intent.token,
        confirmation_name: name,
        current_password: password,
      })
      await onDeleted()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const linked = Object.entries(intent?.impact || {}).filter(
    ([, count]) => count > 0,
  )
  return (
    <Modal
      title={`Permanently delete ${record.label}?`}
      size="compact"
      busy={busy}
      onClose={onClose}
      initialFocusSelector="[data-cancel]"
    >
      <form onSubmit={remove} className="space-y-5">
        <p className="text-sm leading-6">
          This cannot be restored. The archived record and its linked records
          listed below will be permanently removed.
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
        <label className="block text-sm font-semibold">
          Type the complete record name
          <input
            className={`${inputStyle} mt-2`}
            required
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
          <span className="mt-2 block break-words text-xs font-normal text-muted-foreground">
            {intent?.label || record.label}
          </span>
        </label>
        <label className="block text-sm font-semibold">
          Your current administrator password
          <input
            className={`${inputStyle} mt-2`}
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        {error && <Notice error>{error}</Notice>}
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
            disabled={
              !intent ||
              remaining > 0 ||
              busy ||
              name !== intent.label ||
              !password
            }
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
