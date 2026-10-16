import { useEffect, useRef, useState } from "react"

import { useNavigate } from "react-router"

import { Clock, Search, X } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { MotionPresence } from "../common/MotionPresence.jsx"

export function GlobalSearch({ onOpen }) {
  const { searchHistory, setSearchHistory, jobs } = useDashboard()

  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false)

  const root = useRef(null),
    navigate = useNavigate()

  useEffect(() => {
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }

    document.addEventListener("pointerdown", outside)

    return () => document.removeEventListener("pointerdown", outside)
  }, [])

  function search(value) {
    const term = value.trim().slice(0, 120)

    if (term)
      setSearchHistory((previous) =>
        [term, ...previous.filter((item) => item !== term)].slice(0, 8),
      )

    setOpen(false)

    setQuery(term)

    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const suggestions = jobs

    .filter(
      (job) =>
        !query ||
        `${job.title} ${job.category}`

          .toLowerCase()

          .includes(query.toLowerCase()),
    )

    .slice(0, 4)

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <form
        onSubmit={(e) => {
          e.preventDefault()

          search(query)
        }}
        className="flex h-10 items-center rounded-lg bg-white px-2 text-foreground"
      >
        <Search size={16} className="shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)

            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)

            onOpen?.()
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false)

              e.stopPropagation()
            }
          }}
          aria-label="Search PesoMatch"
          placeholder="Search"
          maxLength={120}
          className="min-w-0 flex-1 bg-transparent p-2 text-xs outline-none placeholder:text-muted-foreground"
        />
      </form>
      <MotionPresence open={open}>
        <div
          id="global-search-suggestions"
          className="fixed inset-x-3 top-[60px] z-50 mt-2 max-w-[calc(100vw-24px)] lg:absolute lg:inset-x-auto lg:left-0 lg:top-full lg:w-[380px] rounded-xl border border-border bg-white p-4 text-foreground shadow-xl"
        >
          {searchHistory.length > 0 && (
            <>
              <div className="flex justify-between text-xs font-semibold">
                <h2>Recent searches</h2>
                <button
                  onClick={() => setSearchHistory([])}
                  className="text-primary"
                >
                  Clear history
                </button>
              </div>
              <ul className="mt-2">
                {searchHistory.slice(0, 4).map((term) => (
                  <li key={term} className="flex items-center">
                    <button
                      onClick={() => search(term)}
                      className="flex min-h-11 flex-1 items-center gap-3 text-left text-xs"
                    >
                      <Clock size={16} />
                      {term}
                    </button>
                    <button
                      aria-label={`Remove search ${term}`}
                      onClick={() =>
                        setSearchHistory((previous) =>
                          previous.filter((item) => item !== term),
                        )
                      }
                      className="grid size-10 place-items-center"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className="mb-2 mt-2 text-xs font-semibold">
            {query ? "Matching searches" : "Try searching for"}
          </h2>
          {suggestions.map((job) => (
            <button
              key={job.id}
              onClick={() => search(job.title)}
              className="flex min-h-11 w-full items-center gap-3 text-left text-xs"
            >
              <Search size={16} className="shrink-0 text-muted-foreground" />
              {job.title}
            </button>
          ))}
          {!suggestions.length && (
            <button
              onClick={() => search(query)}
              className="min-h-11 text-xs text-primary"
            >
              Search for “{query}”
            </button>
          )}
          <p className="mt-3 border-t border-border pt-3 text-[10px] leading-5 text-muted-foreground">
            Suggestions use sample opportunities. Match scores are predefined.
          </p>
        </div>
      </MotionPresence>
    </div>
  )
}
