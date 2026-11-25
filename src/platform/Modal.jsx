import { useEffect, useId, useRef } from "react"
import { X } from "lucide-react"

let openDialogs = 0
let originalOverflow = ""

export function Modal({
  title,
  onClose,
  busy = false,
  size = "wide",
  initialFocusSelector,
  children,
}) {
  const ref = useRef(null)
  const heading = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    if (initialFocusSelector)
      dialog.querySelector(initialFocusSelector)?.focus({ preventScroll: true })
    if (openDialogs === 0) originalOverflow = document.body.style.overflow
    openDialogs += 1
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      openDialogs -= 1
      if (openDialogs === 0) document.body.style.overflow = originalOverflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={heading}
      className={`workspace-modal ${
        size !== "wide" ? `workspace-modal-${size}` : ""
      }`}
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!busy) onClose()
      }}
    >
      <div className="workspace-modal-header">
        <h2
          id={heading}
          tabIndex={-1}
          className="font-display text-2xl text-primary"
        >
          {title}
        </h2>
        <button
          type="button"
          data-dismiss-dialog
          autoFocus
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>
      <div className="workspace-modal-body">{children}</div>
    </dialog>
  )
}
