import { useEffect } from "react"
import { useRouteError } from "react-router"
import { Brand, primaryStyle, secondaryStyle } from "./ui.jsx"

export function RouteErrorPage() {
  const error = useRouteError()
  const unavailableChunk =
    /dynamically imported module|importing a module script failed|loading chunk .+ failed/i.test(
      String(error?.message || ""),
    )
  useEffect(() => {
    document.title = "Page unavailable | PESO Employment Services"
  }, [])
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto max-w-3xl px-6 py-8">
        <Brand />
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl text-primary">
          This page couldn't load
        </h1>
        <p
          role="alert"
          className="mt-5 max-w-xl leading-7 text-muted-foreground"
        >
          {unavailableChunk
            ? "A required page file could not be loaded after an update or connection interruption. Save any work in other tabs, then retry to load the current version."
            : "Check your connection and retry. If this keeps happening, return to the public home."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className={primaryStyle}
            onClick={() => window.location.reload()}
          >
            Retry page
          </button>
          <a className={secondaryStyle} href="/">
            Back to home
          </a>
        </div>
      </main>
    </div>
  )
}
