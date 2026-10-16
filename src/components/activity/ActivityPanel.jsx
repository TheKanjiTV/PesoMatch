import { useId } from "react"

import { X } from "lucide-react"

export function ActivityPanel({ id, title, onClose, children, footer }) {
  const heading = useId()

  return (
    <section
      id={id}
      aria-labelledby={heading}
      className="fixed inset-x-3 top-[60px] z-50 mt-2 flex max-h-[calc(100dvh-90px)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:w-[360px]"
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-3">
        <h2 id={heading} className="text-xl font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title.toLowerCase()}`}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <X size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-border p-2 text-center">
          {footer}
        </div>
      )}
    </section>
  )
}

export function ActivityTabs({ value, onChange }) {
  return (
    <div className="mb-3 flex gap-2" aria-label="Activity filters">
      {["all", "unread"].map((tab) => (
        <button
          key={tab}
          aria-pressed={value === tab}
          onClick={() => onChange(tab)}
          className={`min-h-11 rounded-full px-4 text-sm font-medium ${
            value === tab
              ? "bg-secondary text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {tab === "all" ? "All" : "Unread"}
        </button>
      ))}
    </div>
  )
}
