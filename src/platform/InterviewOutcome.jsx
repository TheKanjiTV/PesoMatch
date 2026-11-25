import { useState } from "react"
import { api } from "./api.js"
import { Badge, Editor, Notice, secondaryStyle } from "./ui.jsx"

const labels = {
  pending: "Awaiting decision",
  accepted: "Accepted",
  not_accepted: "Not accepted",
}

export function InterviewOutcome({ referral, staff, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const eligible =
    referral.interview_at &&
    new Date(referral.interview_at) <= new Date() &&
    ["interviewing", "offered", "not_selected", "placed"].includes(
      referral.status,
    )
  if (!eligible && !referral.outcome_enabled) return null
  async function toggle() {
    setBusy(true)
    setError("")
    try {
      await api(`/referrals/${referral.id}/interview-outcome`, "PATCH", {
        enabled: !referral.outcome_enabled,
      })
      await onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className="mt-5 border-t border-border pt-5"
      aria-label="Interview outcome"
    >
      {staff && (
        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            role="switch"
            className="size-5 accent-primary"
            aria-label="Show interview outcome"
            checked={Boolean(referral.outcome_enabled)}
            disabled={busy || !eligible}
            onChange={toggle}
          />
          Show interview outcome
        </label>
      )}
      {error && <Notice error>{error}</Notice>}
      {referral.outcome_enabled && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Interview outcome</h3>
            <Badge>{labels[referral.interview_result] || labels.pending}</Badge>
            {referral.interview_result_notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm">
                {referral.interview_result_notes}
              </p>
            )}
          </div>
          {staff && (
            <button
              type="button"
              className={secondaryStyle}
              onClick={() => setEditing(true)}
            >
              Update interview outcome
            </button>
          )}
        </div>
      )}
      {editing && (
        <Editor
          title="Interview outcome"
          fields={[
            {
              name: "result",
              label: "Interview decision",
              options: Object.entries(labels).map(([value, label]) => ({
                value,
                label,
              })),
            },
            {
              name: "notes",
              label: "Decision notes",
              type: "textarea",
              required: false,
              maxLength: 2000,
            },
          ]}
          initial={{
            result: referral.interview_result || "pending",
            notes: referral.interview_result_notes || "",
          }}
          onClose={() => setEditing(false)}
          onSave={async (values) => {
            await api(`/referrals/${referral.id}/interview-outcome`, "PATCH", {
              ...values,
              enabled: true,
            })
            await onChanged()
          }}
        />
      )}
    </section>
  )
}
