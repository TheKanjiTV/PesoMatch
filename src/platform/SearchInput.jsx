import { useEffect, useId, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { inputStyle } from "./ui.jsx"
import { normalizeSearch, searchError, SEARCH_LIMIT } from "./search.js"

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions = [],
  loading = false,
}) {
  const id = useId()
  const input = useRef(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const error = searchError(value)
  const visible = open && !error && suggestions.length > 0

  useEffect(() => {
    const shortcut = (event) => {
      const editing = event.target.closest?.(
        "input, textarea, select, [contenteditable='true']",
      )
      if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") ||
        (event.key === "/" &&
          !editing &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey)
      ) {
        event.preventDefault()
        input.current?.focus()
      }
    }
    document.addEventListener("keydown", shortcut)
    return () => document.removeEventListener("keydown", shortcut)
  }, [])
  useEffect(() => setActive(-1), [value, suggestions.join("\n")])
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" })
  }, [active, id])

  function choose(next) {
    onChange(next)
    setOpen(false)
    setActive(-1)
    input.current?.focus()
  }

  return (
    <div className="relative min-w-0 flex-1 basis-full sm:basis-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-4 text-muted-foreground"
        size={17}
      />
      <input
        ref={input}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        maxLength={SEARCH_LIMIT}
        aria-autocomplete="list"
        aria-expanded={Boolean(visible)}
        aria-controls={visible ? `${id}-list` : undefined}
        aria-activedescendant={
          visible && active >= 0 ? `${id}-option-${active}` : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        value={value}
        placeholder={placeholder}
        className={`${inputStyle} pl-10 pr-12`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault()
            setOpen(true)
            if (suggestions.length)
              setActive((current) =>
                current < 0
                  ? event.key === "ArrowDown"
                    ? 0
                    : suggestions.length - 1
                  : (current +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      suggestions.length) %
                    suggestions.length,
              )
          } else if (event.key === "Enter") {
            event.preventDefault()
            if (!error)
              choose(
                visible && active >= 0
                  ? suggestions[active]
                  : normalizeSearch(value),
              )
          } else if (event.key === "Escape") {
            event.preventDefault()
            setOpen(false)
            setActive(-1)
          } else if (event.key === "Tab") setOpen(false)
        }}
      />
      {value && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()}`}
          className="absolute right-0 top-0 grid min-h-12 min-w-12 place-items-center rounded-lg text-muted-foreground hover:text-primary"
          onClick={() => choose("")}
        >
          <X size={18} />
        </button>
      )}
      <p
        id={`${id}-hint`}
        className="mt-2 text-xs leading-5 text-muted-foreground"
      >
        Ctrl+K or / to search · ↑ ↓ select · Enter apply · Esc close · Max{" "}
        {SEARCH_LIMIT} characters.
      </p>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm text-error-ink"
        >
          {error}
        </p>
      )}
      {visible && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute top-12 z-20 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => {
            const start = suggestion
              .toLocaleLowerCase()
              .indexOf(normalizeSearch(value).toLocaleLowerCase())
            const end = start + normalizeSearch(value).length
            return (
              <li
                key={suggestion}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={active === index}
                className={`cursor-pointer break-words px-4 py-3 text-base ${
                  active === index
                    ? "bg-secondary text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
              >
                {start < 0 ? (
                  suggestion
                ) : (
                  <>
                    {suggestion.slice(0, start)}
                    <strong>{suggestion.slice(start, end)}</strong>
                    {suggestion.slice(end)}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <span role="status" className="sr-only">
        {error
          ? "Search needs a correction."
          : loading
            ? "Searching…"
            : visible
              ? `${suggestions.length} suggestions available.`
              : ""}
      </span>
    </div>
  )
}
