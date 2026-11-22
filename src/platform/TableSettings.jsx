import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { api, useResource, refreshTableSettings } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"
import { inputStyle, Notice, primaryStyle } from "./ui.jsx"

export function TableSettings() {
  const settings = useResource("/table-settings")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (saving) return
    const rows_per_page = Number(
      new FormData(event.currentTarget).get("rows_per_page"),
    )
    setSaving(true)
    setFeedback(null)
    try {
      await api("/table-settings", "PATCH", { rows_per_page })
      refreshTableSettings()
      setFeedback({ message: "Table settings saved for all accounts." })
    } catch (error) {
      setFeedback({ message: error.message, error: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-labelledby="table-settings"
      className="mb-6 rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="table-settings" className="text-base font-semibold text-primary">
        Table settings
      </h2>
      <p
        id="table-settings-help"
        className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground"
      >
        Choose 1–20 records per page for all tables and record lists, across
        every account. The default is 20. Page counts adjust automatically; all
        records remain available on later pages.
      </p>
      <div className="mt-5">
        <ResourceState
          resource={settings}
          paginate={false}
          skeleton={
            <p role="status" className="text-sm text-muted-foreground">
              Loading table settings…
            </p>
          }
        >
          {settings.data && (
            <form
              onSubmit={save}
              onChange={() => setFeedback(null)}
              className="space-y-4"
            >
              <label className="block max-w-xs space-y-1 text-sm">
                <span className="block">Rows per page</span>
                <input
                  className={inputStyle}
                  name="rows_per_page"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  required
                  disabled={saving}
                  defaultValue={settings.data.rows_per_page}
                  aria-describedby="table-settings-help"
                />
              </label>
              {feedback && (
                <Notice error={feedback.error}>{feedback.message}</Notice>
              )}
              <button type="submit" className={primaryStyle} disabled={saving}>
                {saving && (
                  <LoaderCircle
                    size={17}
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                )}
                {saving ? "Saving…" : "Save table settings"}
              </button>
            </form>
          )}
        </ResourceState>
      </div>
    </section>
  )
}
