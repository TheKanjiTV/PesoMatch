import { useState } from "react"

import { Link } from "react-router"

import { api, useResource } from "./api.js"

import { ResourceState } from "./ResourceState.jsx"

import { PrivacySkeleton } from "./LoadingStates.jsx"

import { Badge, Editor, Notice, human, date, secondaryStyle } from "./ui.jsx"

export function PrivacyRequests({ administration = false }) {
  const r = useResource(
    administration ? "/privacy/requests?scope=all" : "/privacy/requests",

    "/api",
  )

  const [editor, setEditor] = useState(null)

  const [message, setMessage] = useState("")

  return (
    <section className="mt-8 rounded-lg border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-primary">
        {administration ? "Privacy request review" : "Your privacy requests"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {administration
          ? "Review identity, retention obligations and the requested action before responding. A response records the review; it does not erase records or backups."
          : "Request access, correction, deletion or restriction of your information. Avoid including IDs, medical records or passwords. Requests need a human review; submitting one does not delete your account."}
      </p>
      {!administration && (
        <div className="mt-4 flex flex-wrap gap-4">
          <button className={secondaryStyle} onClick={() => setEditor({})}>
            Make a privacy request
          </button>
          <Link className={secondaryStyle} to="/privacy">
            Read the privacy notice
          </Link>
        </div>
      )}
      {message && (
        <div className="mt-4">
          <Notice>{message}</Notice>
        </div>
      )}
      {editor && (
        <Editor
          title={
            administration
              ? "Respond to privacy request"
              : "Make a privacy request"
          }
          initial={
            administration
              ? { status: "in_review", response: "" }
              : { kind: "access" }
          }
          fields={
            administration
              ? [
                  {
                    name: "status",

                    label: "Review status",

                    options: ["in_review", "completed", "declined"].map(
                      (value) => ({ value, label: human(value) }),
                    ),
                  },

                  {
                    name: "response",

                    label: "Response and action taken",

                    type: "textarea",

                    minLength: 10,

                    maxLength: 2000,
                  },
                ]
              : [
                  {
                    name: "kind",

                    label: "Request type",

                    options: [
                      "access",

                      "correction",

                      "deletion",

                      "restriction",

                      "question",
                    ].map((value) => ({ value, label: human(value) })),
                  },

                  {
                    name: "details",

                    label: "Details (optional)",

                    type: "textarea",

                    required: false,

                    maxLength: 2000,
                  },
                ]
          }
          onClose={() => setEditor(null)}
          onSave={async (v) => {
            await api(
              administration
                ? `/privacy/requests/${editor.id}`
                : "/privacy/requests",

              administration ? "PATCH" : "POST",

              v,

              "/api",
            )

            setMessage(
              administration
                ? "Privacy response recorded."
                : "Privacy request recorded. You can follow its status here.",
            )

            await r.reload()
          }}
        />
      )}
      <div className="mt-5">
        <ResourceState resource={r} skeleton={<PrivacySkeleton />}>
          {!r.data?.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No privacy requests yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {r.data.data.map((row) => (
                <li key={row.id} className="border-t border-border pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">
                      {human(row.kind)} · {date(row.created_at)}
                    </h3>
                    <Badge>{human(row.status)}</Badge>
                  </div>
                  {administration && (
                    <p className="mt-2 text-sm">
                      {row.user?.name || "Account no longer active"}
                    </p>
                  )}
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    Reference: {row.reference}
                  </p>
                  {row.details && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {row.details}
                    </p>
                  )}
                  {row.response && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      Response: {row.response}
                    </p>
                  )}
                  {administration &&
                    ["requested", "in_review"].includes(row.status) && (
                      <button
                        className={`${secondaryStyle} mt-3`}
                        onClick={() => setEditor(row)}
                      >
                        Review request
                      </button>
                    )}
                </li>
              ))}
            </ul>
          )}
        </ResourceState>
      </div>
    </section>
  )
}
