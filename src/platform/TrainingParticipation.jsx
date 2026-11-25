import { Modal } from "./Modal.jsx"
import {
  TrainingRequestWizard,
  TrainingRequestDetails,
} from "./TrainingRequestWizard.jsx"
import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { api, useResource } from "./api.js"
import { useAuth } from "../context/AuthContext.jsx"
import { RecordLink } from "./RecordLink.jsx"
import { ResourceState } from "./ResourceState.jsx"
import { TableSkeleton } from "./LoadingStates.jsx"
import {
  Badge,
  Editor,
  Notice,
  primaryStyle,
  secondaryStyle,
  dangerStyle,
} from "./ui.jsx"

export function TrainingParticipants({ program, onChanged }) {
  const r = useResource(`/training/${program.id}/participants`)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState("")
  return (
    <section className="mt-6 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Participant roster</h3>
        <button
          className={primaryStyle}
          disabled={
            program.status !== "published" ||
            program.external_enrollment ||
            Number(program.occupied_places) >= program.capacity
          }
          onClick={() => setAdding(true)}
        >
          Enroll participant / walk-in
        </button>
      </div>
      <p className="my-3 text-sm text-muted-foreground">
        Record the participant's consent and a unique office roster reference. A
        confirmed place counts toward capacity. A walk-in does not need an
        online account.
      </p>
      {message && <Notice>{message}</Notice>}
      {adding && (
        <Editor
          title={`Enroll participant: ${program.title}`}
          fields={[
            {
              name: "user_id",
              label: "Existing jobseeker account ID (optional)",
              type: "number",
              min: 1,
              required: false,
            },
            {
              name: "walk_in_name",
              label: "Walk-in full name (required without account ID)",
              required: false,
              maxLength: 160,
            },
            {
              name: "municipality",
              label: "Municipality / partner area",
              maxLength: 160,
            },
            {
              name: "participant_reference",
              label: "Unique office roster reference",
              maxLength: 100,
            },
            {
              name: "consent",
              label: "Participant consent recorded",
              options: [
                {
                  value: "yes",
                  label:
                    "Yes — participant agreed to enrollment and data sharing with this provider",
                },
              ],
            },
            {
              name: "notes",
              label: "Enrollment verification / consent record",
              type: "textarea",
              minLength: 10,
              maxLength: 2000,
            },
          ]}
          onClose={() => setAdding(false)}
          onSave={async (v) => {
            await api(`/training/${program.id}/participants`, "POST", {
              ...v,
              user_id: v.user_id || null,
              consent: v.consent === "yes",
            })
            setMessage(
              "Participant enrolled. The confirmed place is included in capacity.",
            )
            await r.reload()
            await onChanged?.()
          }}
        />
      )}
      <ResourceState resource={r} skeleton={<TableSkeleton columns={3} />}>
        {!r.data?.data?.length ? (
          <p className="py-5 text-sm">
            No participants recorded yet. Add consenting walk-ins or review
            incoming enrollment applications.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {r.data.data.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap justify-between gap-3 py-4"
              >
                <span>
                  {e.user?.name || e.walk_in_name} ·{" "}
                  {e.municipality || "Area not stated"}
                  <span className="block text-xs text-muted-foreground">
                    {e.participant_reference || "Self-service application"}
                  </span>
                </span>
                <Badge>{e.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </ResourceState>
    </section>
  )
}

export function TrainingDemandPage() {
  const [params] = useSearchParams()
  const initialTopic = params.get("topic") || ""
  const sourceId = params.get("source_program_id") || ""
  const { user } = useAuth()
  const r = useResource("/training-demands")
  const [adding, setAdding] = useState(
    user.role === "jobseeker" && Boolean(initialTopic),
  )
  const [message, setMessage] = useState("")
  const [expanded, setExpanded] = useState(null)
  const [archiving, setArchiving] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function archive() {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      const result = await api(
        user.role === "jobseeker"
          ? `/training-demands/${archiving.id}/archive`
          : "/training-demands/archive-topic",
        "POST",
        user.role === "jobseeker" ? {} : { topic_key: archiving.topic_key },
      )
      setMessage(result.message)
      setArchiving(null)
      setExpanded(null)
      await r.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <h1 className="mb-4 font-display text-3xl text-primary">
        Training demand & planning
      </h1>
      {user.role === "jobseeker" && (
        <button
          className={`${primaryStyle} my-5`}
          onClick={() => setAdding(true)}
        >
          Request a training topic
        </button>
      )}
      {message && <Notice>{message}</Notice>}
      {archiving && (
        <Modal
          title={`Archive ${archiving.topic}?`}
          size="compact"
          busy={busy}
          onClose={() => setArchiving(null)}
          initialFocusSelector="[data-cancel]"
        >
          <p className="mb-5 text-sm leading-6">
            {user.role === "jobseeker"
              ? "Archive this training request?"
              : `Archive ${archiving.interested_jobseekers} active request(s) for this topic?`}{" "}
            An administrator can restore requests from Archive & Restore.
          </p>
          {error && <Notice error>{error}</Notice>}
          <div className="flex flex-wrap justify-end gap-3">
            <button
              data-cancel
              className={secondaryStyle}
              disabled={busy}
              onClick={() => setArchiving(null)}
            >
              Cancel
            </button>
            <button className={dangerStyle} disabled={busy} onClick={archive}>
              {busy ? "Archiving…" : "Archive request"}
            </button>
          </div>
        </Modal>
      )}
      {adding && (
        <TrainingRequestWizard
          initial={{
            topic: initialTopic,
            ...(sourceId && { source_program_id: Number(sourceId) }),
          }}
          onClose={() => setAdding(false)}
          onSubmitted={async () => {
            setAdding(false)
            setMessage("Training topic request submitted.")
            await r.reload()
          }}
        />
      )}
      <ResourceState resource={r} skeleton={<TableSkeleton columns={2} />}>
        <div className="mt-5 divide-y divide-border rounded-lg border border-border bg-card px-5">
          {!r.data?.data?.length && (
            <p className="py-5">No training interest recorded yet.</p>
          )}
          {r.data?.data?.map((d) => (
            <div
              key={d.topic_key}
              className="flex flex-wrap justify-between gap-3 py-5"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{d.topic}</h2>
                {user.role === "jobseeker" && (
                  <TrainingRequestDetails request={d} />
                )}
                {user.role !== "jobseeker" && (
                  <button
                    className={`${secondaryStyle} mt-3`}
                    onClick={() =>
                      setExpanded(expanded === d.topic_key ? null : d.topic_key)
                    }
                  >
                    {expanded === d.topic_key
                      ? "Hide requests"
                      : "View requests"}
                  </button>
                )}
                {expanded === d.topic_key && (
                  <DemandRequests topic={d.topic_key} />
                )}
                <div className="mt-3 flex flex-wrap gap-3">
                  {d.source_program_id && (
                    <RecordLink
                      to={`/training/${d.source_program_id}`}
                      className="text-sm font-semibold underline"
                    >
                      View source listing
                    </RecordLink>
                  )}
                  {user.role !== "jobseeker" && (
                    <Link
                      className="text-sm font-semibold underline"
                      to={`/training?create=training&topic=${encodeURIComponent(d.topic)}`}
                    >
                      Plan a training intake
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {user.role !== "jobseeker" && (
                  <span>{d.interested_jobseekers} interested jobseeker(s)</span>
                )}
                <button
                  className={secondaryStyle}
                  onClick={() => {
                    setError("")
                    setArchiving(d)
                  }}
                >
                  {user.role === "jobseeker"
                    ? "Archive request"
                    : "Archive topic"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/training" className={secondaryStyle}>
            Browse training catalog
          </Link>
          <Link to="/enrollments" className={secondaryStyle}>
            View actual enrollments
          </Link>
        </div>
      </ResourceState>
    </>
  )
}

function DemandRequests({ topic }) {
  const r = useResource(
    `/training-demands?topic_key=${encodeURIComponent(topic)}`,
  )
  return (
    <ResourceState resource={r} skeleton={<TableSkeleton columns={2} />}>
      {r.data?.data?.map((row) => (
        <section key={row.id} className="mt-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">
            {row.name || "Archived account"}
          </h3>
          <TrainingRequestDetails request={row} />
        </section>
      ))}
    </ResourceState>
  )
}
