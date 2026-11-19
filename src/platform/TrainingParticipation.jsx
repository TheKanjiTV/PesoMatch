import { useState } from "react"
import { api, useResource } from "./api.js"
import { useAuth } from "../context/AuthContext.jsx"
import { ResourceState } from "./ResourceState.jsx"
import { TableSkeleton } from "./LoadingStates.jsx"
import { Badge, Editor, Notice, primaryStyle, secondaryStyle } from "./ui.jsx"

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
  const { user } = useAuth()
  const r = useResource("/training-demands")
  const [adding, setAdding] = useState(false)
  return (
    <>
      <h1 className="mb-4 font-display text-3xl text-primary">
        Training demand & planning
      </h1>
      <Notice>
        Training interest is a planning signal. PESO decides which programs can
        be offered with partners, schedules and resources. An interest request
        does not create enrollment or reserve a place.
      </Notice>
      {user.role === "jobseeker" && (
        <button
          className={`${primaryStyle} my-5`}
          onClick={() => setAdding(true)}
        >
          Request a training topic
        </button>
      )}
      {adding && (
        <Editor
          title="Request a training topic"
          fields={[
            {
              name: "topic",
              label: "Training / skill topic",
              minLength: 3,
              maxLength: 160,
            },
          ]}
          onClose={() => setAdding(false)}
          onSave={async (v) => {
            await api("/training-demands", "POST", v)
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
              <span className="font-semibold">{d.topic}</span>
              {user.role !== "jobseeker" && (
                <span>{d.interested_jobseekers} interested jobseeker(s)</span>
              )}
            </div>
          ))}
        </div>
        <a href="/training" className={`${secondaryStyle} mt-5`}>
          Browse offered training
        </a>
      </ResourceState>
    </>
  )
}
