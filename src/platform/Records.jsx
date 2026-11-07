import { useState } from "react"

import { CollectionNotice } from "./CollectionNotice.jsx"

import { Link, useSearchParams } from "react-router"

import { useAuth } from "../context/AuthContext.jsx"

import { api, useResource } from "./api.js"

import { ResourceState } from "./ResourceState.jsx"

import { DeleteDialog } from "./DeleteDialog.jsx"

import { RecordsSkeleton } from "./LoadingStates.jsx"

import {
  Badge,
  date,
  Editor,
  Empty,
  Heading,
  human,
  Notice,
  primaryStyle,
  dangerStyle,
  Sample,
  secondaryStyle,
  staffRole,
} from "./ui.jsx"

const field = (name, label, type = "text", extra = {}) => ({
  name,

  label,

  type,

  ...extra,
})

const notes = field("notes", "Notes / reason", "textarea", { minLength: 5 })

const configs = {
  referrals: {
    title: "Job Matching & Referral",

    description:
      "PESO reviews requests, refers candidates, and follows employer interview and offer updates.",
  },

  enrollments: {
    title: "Training Enrollment",

    description:
      "Follow enrollment review, confirmation, training progress, and provider-recorded completion.",
  },

  placements: {
    title: "Employment Facilitation & Placement",

    description:
      "Placements are recorded by PESO after an employer offer and evidence of the employment start.",
  },

  outcomes: {
    title: "Monitoring of Jobseeker Employment Outcomes",

    description:
      "Report current employment status. PESO verification is shown separately from self-reported information.",
  },

  services: {
    title: "PESO Services",

    description:
      "Request career counseling, assessments, orientation, livelihood referrals, reintegration, or employment program support.",
  },
}

const outcomeFields = [
  field("status", "Employment status", "text", {
    options: [
      "employed",

      "self_employed",

      "unemployed",

      "underemployed",

      "in_training",

      "not_in_labor_force",
    ],
  }),

  field("reported_on", "Status as of", "date"),

  field("organization", "Employer / business", "text", { required: false }),

  field("job_title", "Job title / occupation", "text", { required: false }),

  notes,
]

const referralNext = {
  requested: ["referred", "not_selected"],

  referred: ["interviewing", "offered", "not_selected"],

  interviewing: ["offered", "not_selected"],

  offered: ["not_selected"],
}

const enrollmentNext = {
  requested: ["confirmed", "rejected"],

  confirmed: ["in_progress"],

  in_progress: ["completed"],
}

const serviceNext = {
  requested: ["scheduled", "in_progress", "cancelled"],

  scheduled: ["in_progress", "completed", "cancelled"],

  in_progress: ["completed", "cancelled"],
}

const terminal = [
  "placed",

  "not_selected",

  "withdrawn",

  "completed",

  "rejected",

  "cancelled",
]

export function RecordsPage({ kind }) {
  const { user } = useAuth(),
    staff = staffRole(user.role),
    jobseeker = user.role === "jobseeker"

  const r = useResource(`/${kind}`)

  const [removing, setRemoving] = useState(null)

  const [intakeSource, setIntakeSource] = useState(null)

  const intakePrograms = useResource(
    staff && intakeSource
      ? `/training?source_program_id=${intakeSource}`
      : "/summary",
  )

  const [editor, setEditor] = useState(null),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState("")

  const registry = useResource(
    staff && kind === "outcomes" ? "/jobseekers" : "/summary",
  )

  const summary = useResource("/summary")

  const config = configs[kind]

  const placements = useResource(
    kind === "outcomes" ? "/placements" : "/summary",
  )

  const [params] = useSearchParams()

  const records = (r.data?.data || []).filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  )

  function start(row, action = "update") {
    if (kind === "enrollments")
      setIntakeSource(row?.program?.external_enrollment ? row.program.id : null)

    let fields = [],
      initial = {},
      path = `/${kind}/${row?.id}`,
      method = "PATCH",
      heading = "Update record",
      help = "Every update is saved to Laravel and recorded in the audit log."

    if (kind === "referrals") {
      if (action === "placement") {
        path += "/placement"

        method = "POST"

        heading = "Verify employment placement"

        fields = [
          field("started_on", "Employment start date", "date"),

          field("employment_type", "Employment type", "text", {
            options: [
              "Full-time",

              "Part-time",

              "Contractual",

              "Seasonal",

              "Internship",
            ],
          }),

          field("follow_up_on", "Follow-up date", "date"),

          field("evidence", "Verification evidence / source", "textarea", {
            minLength: 10,
          }),
        ]

        help =
          "Confirm employment with the employer or jobseeker before recording placement. Record the evidence source."
      } else {
        let options = jobseeker ? ["withdrawn"] : referralNext[row.status] || []

        if (user.role === "employer")
          options = options.filter((s) => s !== "referred")

        heading = "Update referral"

        fields = [
          field("status", "Next referral status", "text", { options }),

          field(
            "interview_at",

            "Interview date & time (Philippine time)",

            "datetime-local",

            { required: false },
          ),

          notes,
        ]

        if (row.vacancy?.external_application && staff)
          fields.push(
            field(
              "source_confirmation",

              "Employer contact, date, current opening and application instructions (required before referring)",

              "textarea",

              { required: false, minLength: 20, maxLength: 2000 },
            ),
          )

        initial = { status: options[0] }
      }
    } else if (kind === "enrollments") {
      heading = "Update training enrollment"

      const options = jobseeker
        ? ["withdrawn"]
        : enrollmentNext[row.status] || []

      fields = [
        field("status", "Enrollment status", "text", { options }),

        field(
          "certificate_reference",

          "Provider completion reference",

          "text",

          { required: false },
        ),

        notes,
      ]

      if (row.program?.external_enrollment && staff)
        fields.push(
          field(
            "intake_program_id",

            "Verified local intake (required for confirmation)",

            "text",

            { required: false, options: [] },
          ),
        )

      initial = { status: options[0] }

      help =
        "Provider completion reference is required when marking training completed. This record does not issue a TESDA National Certificate."
    } else if (kind === "outcomes") {
      if (action === "verify") {
        path += "/verify"

        heading = "Verify employment outcome"

        fields = [
          field(
            "verification_notes",

            "Evidence / verification source",

            "textarea",

            { minLength: 10 },
          ),
        ]
      } else {
        heading = "Report employment status"

        path = "/outcomes"

        method = "POST"

        fields = [
          ...(staff
            ? [
                field("user_id", "Jobseeker", "text", {
                  options: (registry.data?.data || []).map((u) => ({
                    value: u.id,

                    label: u.name,
                  })),
                }),
              ]
            : []),

          field("placement_id", "Related placement (optional)", "text", {
            required: false,

            options: (placements.data?.data || []).map((p) => ({
              value: p.id,

              label: `#${p.id} · ${p.user?.name} · ${p.referral?.vacancy?.title}`,
            })),
          }),

          ...outcomeFields,
        ]

        initial = {
          reported_on: new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Manila",
          }),

          placement_id: params.get("placement") || "",

          user_id: params.get("jobseeker") || "",
        }

        help =
          "Report the current status and how it was obtained. Link a placement to complete its due follow-up. A report remains unverified until a PESO officer verifies it."
      }
    } else if (kind === "services") {
      if (!row) {
        heading = "Request PESO assistance"

        path = "/services"

        method = "POST"

        fields = [
          field("service", "PESO service", "text", {
            options: summary.data?.services_catalog || [],
          }),

          field("details", "Tell PESO what support you need", "textarea", {
            minLength: 10,
          }),
        ]
      } else {
        heading = "Update PESO service request"

        fields = [
          field("status", "Service status", "text", {
            options: jobseeker ? ["cancelled"] : serviceNext[row.status],
          }),

          ...(staff
            ? [
                field("assigned_to", "Assigned PESO officer ID", "number", {
                  required: false,

                  min: 1,
                }),

                field(
                  "appointment_at",

                  "Appointment (Philippine time)",

                  "datetime-local",

                  { required: false },
                ),
              ]
            : []),

          field(
            "staff_notes",

            jobseeker
              ? "Cancellation reason"
              : "Service notes / referral destination",

            "textarea",
          ),
        ]

        initial = {
          status: jobseeker ? "cancelled" : serviceNext[row.status]?.[0],
        }
      }
    }

    setEditor({
      key: `${row?.id || "new"}-${action}`,

      title: heading,

      fields,

      initial,

      path,

      method,

      help,
    })
  }

  async function save(data) {
    const body = { ...data }

    if (body.interview_at) body.interview_at += ":00+08:00"

    if (body.appointment_at) body.appointment_at += ":00+08:00"

    if (body.intake_program_id === "") body.intake_program_id = null

    if (body.assigned_to === "") body.assigned_to = null

    if (body.placement_id === "") body.placement_id = null

    await api(editor.path, editor.method, body)

    setMessage("Record saved successfully.")

    await r.reload()
  }

  return (
    <>
      <Heading
        {...config}
        action={
          kind === "outcomes" ? (
            <button
              disabled={!placements.data || (staff && !registry.data)}
              className={primaryStyle}
              onClick={() => start()}
            >
              Report employment status
            </button>
          ) : kind === "services" && jobseeker ? (
            <button
              disabled={!summary.data}
              className={primaryStyle}
              onClick={() => start()}
            >
              Request PESO assistance
            </button>
          ) : null
        }
      />
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {removing && (
        <DeleteDialog
          type="enrollment"
          record={{ ...removing, title: removing.program?.title }}
          onClose={() => setRemoving(null)}
          onDeleted={async () => {
            setMessage(
              "Enrollment request removed; active requests are withdrawn.",
            )

            await r.reload()
          }}
        />
      )}
      {staff && intakeSource && editor && (
        <div className="mb-5">
          <Notice>
            <div>
              Create a provider-confirmed intake before confirming this request.{" "}
              <Link
                className="font-bold underline"
                to={`/training/${intakeSource}`}
              >
                Open source program and create verified intake
              </Link>
              .
            </div>
          </Notice>
        </div>
      )}
      {editor && (
        <>
          <CollectionNotice kind="records" />
          <Editor
            key={editor.key}
            title={editor.title}
            fields={editor.fields.map((f) =>
              f.name === "intake_program_id"
                ? {
                    ...f,

                    options: (intakePrograms.data?.data || [])

                      .filter(
                        (p) =>
                          !p.external_enrollment && p.status === "published",
                      )

                      .map((p) => ({
                        value: p.id,

                        label: `${p.title} · ${date(p.starts_on)} · ${p.provider}`,
                      })),
                  }
                : f,
            )}
            initial={editor.initial}
            help={editor.help}
            onSave={save}
            onClose={() => setEditor(null)}
          />
        </>
      )}
      {kind === "enrollments" && (
        <div className="mb-6">
          <Notice>
            An enrollment request does not reserve a place. The provider
            confirms eligibility and capacity. Completion is recorded separately
            from formal competency assessment or National Certification.
          </Notice>
        </div>
      )}
      <label className="mb-6 block">
        <span className="sr-only">Search service records</span>
        <input
          className="min-h-11 w-full rounded-md border border-border bg-card px-4 text-sm sm:max-w-lg"
          placeholder="Search name, title, status or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <ResourceState resource={r} skeleton={<RecordsSkeleton kind={kind} />}>
        {!records.length ? (
          <Empty title="No service records found">
            {kind === "referrals" ? (
              <>
                Explore{" "}
                <Link
                  to="/jobs"
                  className="font-semibold text-primary underline"
                >
                  vacancies
                </Link>{" "}
                and request a PESO referral.
              </>
            ) : kind === "enrollments" ? (
              <>
                Explore{" "}
                <Link
                  to="/training"
                  className="font-semibold text-primary underline"
                >
                  training programs
                </Link>{" "}
                and submit an enrollment request.
              </>
            ) : kind === "placements" ? (
              "Verified placements will appear after a referral results in an employment offer."
            ) : (
              "Submit a record to start tracking your progress."
            )}
          </Empty>
        ) : (
          <div className="space-y-4">
            {records.map((row) => {
              const related =
                kind === "referrals"
                  ? row.vacancy
                  : kind === "enrollments"
                    ? row.program
                    : kind === "placements"
                      ? row.referral?.vacancy
                      : kind === "outcomes"
                        ? row.placement?.referral?.vacancy
                        : null

              const heading = related?.title || row.service || human(row.status)

              return (
                <article
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {kind === "placements" ? "Placement" : "Record"} #
                        {String(row.id).padStart(5, "0")} ·{" "}
                        {date(row.created_at)}
                      </p>
                      <h2 className="text-lg font-semibold text-primary">
                        {heading}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {staff || !jobseeker ? row.user?.name : ""}
                        {related
                          ? `${
                              !jobseeker ? " · " : ""
                            }${related.organization || related.provider}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        {kind === "placements"
                          ? "Verified placement"
                          : human(row.status)}
                      </Badge>
                      {kind === "outcomes" && (
                        <Badge sample={!row.verified_at}>
                          {row.verified_at
                            ? "PESO verified"
                            : "Reported · not verified"}
                        </Badge>
                      )}
                      <Sample record={related} />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-5 border-t border-border pt-5 text-sm sm:grid-cols-2">
                    {row.notes && (
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Latest notes
                        </p>
                        <p className="record-emphasis mt-2 whitespace-pre-wrap leading-6">
                          {row.notes}
                        </p>
                      </div>
                    )}
                    {row.details && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Requested support
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-6">
                          {row.details}
                        </p>
                      </div>
                    )}
                    {row.staff_notes && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          PESO response
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-6">
                          {row.staff_notes}
                        </p>
                      </div>
                    )}
                    {row.assignee && (
                      <div>Assigned officer: {row.assignee.name}</div>
                    )}
                    {row.interview_at && (
                      <div className="record-emphasis">
                        Interview:{" "}
                        {new Date(row.interview_at).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}
                      </div>
                    )}
                    {row.appointment_at && (
                      <div>
                        Appointment:{" "}
                        {new Date(row.appointment_at).toLocaleString("en-PH", {
                          timeZone: "Asia/Manila",
                        })}
                      </div>
                    )}
                    {row.certificate_reference && (
                      <div>
                        Provider completion reference:{" "}
                        {row.certificate_reference}
                      </div>
                    )}
                    {kind === "placements" && (
                      <>
                        <div>
                          Started: {date(row.started_on)} ·{" "}
                          {row.employment_type}
                        </div>
                        <div>Follow-up due: {date(row.follow_up_on)}</div>
                        <div className="sm:col-span-2">
                          Verification: {row.evidence}
                        </div>
                      </>
                    )}
                    {kind === "outcomes" && (
                      <>
                        <div>As of: {date(row.reported_on)}</div>
                        <div>
                          {row.organization || "No employer reported"}
                          {row.job_title ? ` · ${row.job_title}` : ""}
                        </div>
                        {row.verification_notes && (
                          <div className="sm:col-span-2">
                            Verification: {row.verification_notes}
                          </div>
                        )}
                      </>
                    )}
                    {row.match_snapshot && (
                      <div className="sm:col-span-2 text-xs text-muted-foreground">
                        Referral assessment snapshot: {row.match_snapshot.score}
                        % alignment · matched{" "}
                        {row.match_snapshot.matched_skills.join(", ") ||
                          "no declared skills"}{" "}
                        · gaps{" "}
                        {row.match_snapshot.missing_skills.join(", ") ||
                          "none listed"}
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {kind === "enrollments" &&
                      row.status !== "completed" &&
                      (jobseeker ||
                        ["withdrawn", "rejected"].includes(row.status)) && (
                        <button
                          className={dangerStyle}
                          onClick={() => setRemoving(row)}
                        >
                          Delete enrollment request
                        </button>
                      )}
                    {related && (
                      <Link
                        className={`${secondaryStyle} action-view`}
                        to={`/${
                          kind === "enrollments" ? "training" : "jobs"
                        }/${related.id}`}
                      >
                        View {kind === "enrollments" ? "program" : "vacancy"}
                      </Link>
                    )}
                    {["referrals", "enrollments", "services"].includes(kind) &&
                      !terminal.includes(row.status) && (
                        <button
                          className={secondaryStyle}
                          onClick={() => start(row)}
                        >
                          {jobseeker
                            ? kind === "services"
                              ? "Cancel request"
                              : "Withdraw request"
                            : "Update status"}
                        </button>
                      )}
                    {kind === "referrals" &&
                      row.status === "offered" &&
                      staff && (
                        <button
                          className={primaryStyle}
                          onClick={() => start(row, "placement")}
                        >
                          Verify placement
                        </button>
                      )}
                    {kind === "outcomes" && !row.verified_at && staff && (
                      <button
                        className={secondaryStyle}
                        onClick={() => start(row, "verify")}
                      >
                        Verify report
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {kind === "placements" && !records.length && (
          <article
            aria-label="Placement workflow example"
            className="mt-6 rounded-lg border border-border bg-card p-6"
          >
            <Badge sample>
              Illustrative placement example · not a real employment record
            </Badge>
            <h2 className="mt-4 text-xl font-bold text-primary">
              Office Assistant · one placement example
            </h2>
            <p className="mt-3 font-semibold">PESO Bansud, Oriental Mindoro</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Employer offer → verified employment start → recorded placement →
              scheduled follow-up. A real record appears here when PESO verifies
              the offer and start-date evidence. No person, employer outcome or
              verified placement count has been invented.
            </p>
          </article>
        )}
      </ResourceState>
    </>
  )
}
