import { useRef } from "react"

export function ViewTabs({ items, value, onChange, label }) {
  const refs = useRef([])

  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-5 flex gap-1 overflow-x-auto border-b border-border"
    >
      {items.map(([key, name], i) => (
        <button
          key={key}
          ref={(node) => {
            refs.current[i] = node
          }}
          role="tab"
          id={`tab-${key}`}
          aria-selected={value === key}
          aria-controls={value === key ? `panel-${key}` : undefined}
          tabIndex={value === key ? 0 : -1}
          onClick={() => onChange(key)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return

            event.preventDefault()

            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : (i + (event.key === "ArrowRight" ? 1 : -1) + items.length) %
                    items.length

            onChange(items[next][0])

            refs.current[next]?.focus()
          }}
          className={`min-h-12 shrink-0 border-b-2 px-3 text-xs ${
            value === key
              ? "border-primary bg-secondary/60 font-semibold text-primary"
              : "border-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
