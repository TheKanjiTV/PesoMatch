import { useState } from "react"
import { LoaderCircle } from "lucide-react"
import { api, useResource } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"
import { inputStyle, Notice, primaryStyle } from "./ui.jsx"

const stageNames = [
  "First lockout",
  "Second lockout",
  "Third and later lockouts",
]

export function LoginAttemptSettings() {
  const policy = useResource("/login-policy")
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const stages = stageNames.map((_, index) => ({
      attempts: Number(form.get(`attempts-${index}`)),
      lockout_minutes: Number(form.get(`minutes-${index}`)),
    }))

    setSaving(true)
    setFeedback(null)
    try {
      await api("/login-policy", "PATCH", { stages })
      setFeedback({ message: "Login attempt settings saved." })
    } catch (error) {
      setFeedback({ message: error.message, error: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      aria-labelledby="login-attempt-settings"
      className="mb-6 rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <h2
        id="login-attempt-settings"
        className="text-base font-semibold text-primary"
      >
        Login attempts
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Set how many failed sign-ins trigger each lockout and how long the wait
        lasts. These settings apply to all accounts. A successful sign-in resets
        the count.
      </p>
      <div className="mt-5">
        <ResourceState
          resource={policy}
          skeleton={
            <p role="status" className="text-sm text-muted-foreground">
              Loading login attempt settings…
            </p>
          }
        >
          {policy.data && (
            <form
              onSubmit={save}
              onChange={() => setFeedback(null)}
              className="space-y-4"
            >
              {policy.data.stages.map((stage, index) => (
                <fieldset
                  key={index}
                  disabled={saving}
                  className="border-b border-border pb-4"
                >
                  <legend className="mb-2 text-sm font-semibold">
                    {stageNames[index]}
                  </legend>
                  <div className="grid max-w-lg grid-cols-2 gap-3 sm:gap-4">
                    <label className="min-w-0 space-y-1 text-sm">
                      <span className="block">Failed attempts</span>
                      <input
                        className={inputStyle}
                        name={`attempts-${index}`}
                        type="number"
                        min={1}
                        max={20}
                        required
                        defaultValue={stage.attempts}
                      />
                    </label>
                    <label className="min-w-0 space-y-1 text-sm">
                      <span className="block">Lockout minutes</span>
                      <input
                        className={inputStyle}
                        name={`minutes-${index}`}
                        type="number"
                        min={1}
                        max={1440}
                        required
                        defaultValue={stage.lockout_minutes}
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
              <p className="text-sm leading-6 text-muted-foreground">
                Choose 1–20 attempts and 1–1,440 minutes per stage. Lockouts
                already in progress end at their original time.
              </p>
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
                {saving ? "Saving…" : "Save login attempt settings"}
              </button>
            </form>
          )}
        </ResourceState>
      </div>
    </section>
  )
}
