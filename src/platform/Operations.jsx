import { DeleteDialog } from "./DeleteDialog.jsx"

import { RecordPages } from "./RecordPages.jsx"

import { TableSettings } from "./TableSettings.jsx"

import { LoginAttemptSettings } from "./LoginAttemptSettings.jsx"

import { useState } from "react"

import { Link } from "react-router"

import { Download } from "lucide-react"

import { useAuth } from "../context/AuthContext.jsx"

import { api, useResource, useSearchQuery } from "./api.js"

import { SearchInput } from "./SearchInput.jsx"

import { searchSuggestions } from "./search.js"

import { ResourceState } from "./ResourceState.jsx"

import {
  LaborMarketSkeleton,
  RegistrySkeleton,
  TableSkeleton,
} from "./LoadingStates.jsx"

import {
  Badge,
  Contact,
  date,
  dateTime,
  authenticationAction,
  Editor,
  Empty,
  Heading,
  human,
  inputStyle,
  Notice,
  primaryStyle,
  dangerStyle,
  addStyle,
  roles,
  Sample,
  Source,
  secondaryStyle,
  staffRole,
} from "./ui.jsx"

export function RegistryPage() {
  const [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState(null)

  const query = useSearchQuery(search)

  const r = useResource(`/jobseekers?search=${encodeURIComponent(query)}`)

  const rows = r.data?.data || []

  return (
    <>
      <Heading title="Jobseeker Registration & Profiling" description="" />
      <div className="mb-6 max-w-xl">
        <SearchInput
          label="Search jobseekers"
          placeholder="Search name, email or municipality…"
          value={search}
          onChange={setSearch}
          loading={r.loading}
          suggestions={searchSuggestions(
            rows.map((row) => ({
              ...row,

              municipality: row.jobseeker_profile?.municipality,
            })),

            search,

            ["name", "email", "municipality"],
          )}
        />
      </div>
      <ResourceState resource={r} skeleton={<RegistrySkeleton />}>
        {!rows.length ? (
          <Empty title="No registered jobseekers found" />
        ) : (
          <div className="space-y-3">
            {rows.map((u) => (
              <article
                key={u.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-primary">
                      {u.name}
                    </h2>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Jobseeker #{u.id} · <Contact value={u.email} />
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>
                      {u.jobseeker_profile?.profile_completed_at
                        ? "Profile complete"
                        : "Setup in progress"}
                    </Badge>
                    <button
                      className={secondaryStyle}
                      aria-expanded={expanded === u.id}
                      onClick={() =>
                        setExpanded(expanded === u.id ? null : u.id)
                      }
                    >
                      Review profile
                    </button>
                  </div>
                </div>
                {expanded === u.id && (
                  <dl className="mt-5 grid gap-5 border-t border-border pt-5 text-sm sm:grid-cols-2">
                    {[
                      [
                        "Location",

                        [
                          u.jobseeker_profile?.barangay,

                          u.jobseeker_profile?.municipality,

                          u.jobseeker_profile?.province,
                        ]

                          .filter(Boolean)

                          .join(", "),
                      ],

                      ["Contact", u.jobseeker_profile?.mobile_number],

                      [
                        "Skills",

                        u.jobseeker_profile?.skills

                          ?.map((s) => s.name)

                          .join(", "),
                      ],

                      [
                        "Education",

                        u.jobseeker_profile?.education?.highest_attainment,
                      ],

                      [
                        "Preferred occupations",

                        u.jobseeker_profile?.preferences?.occupations

                          ?.map((s) => s.value)

                          .join(", "),
                      ],

                      [
                        "Preferred location",

                        u.jobseeker_profile?.preferences?.preferred_location,
                      ],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <dt className="text-xs text-muted-foreground">{l}</dt>
                        <dd className="mt-2 leading-6">
                          {l === "Contact" ? (
                            <Contact value={v} phone />
                          ) : (
                            v || "Not provided"
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            ))}
          </div>
        )}
      </ResourceState>
    </>
  )
}

export function AccessPage() {
  const r = useResource("/users")

  const [adding, setAdding] = useState(false)

  const [removing, setRemoving] = useState(null)

  const { user } = useAuth()

  const [editor, setEditor] = useState(null),
    [message, setMessage] = useState("")

  return (
    <>
      {removing && (
        <DeleteDialog
          type="account"
          record={removing}
          onClose={() => setRemoving(null)}
          onDeleted={async () => {
            setMessage(
              "Account archived and sessions revoked. Restore it from Archive & Restore.",
            )

            await r.reload()
          }}
        />
      )}
      <Heading
        action={
          <div className="flex flex-wrap gap-3">
            <Link className={secondaryStyle} to="/archive">
              Open Archive
            </Link>
            <button className={addStyle} onClick={() => setAdding(true)}>
              Add new account
            </button>
          </div>
        }
        title="Account Access & Responsibilities"
        description=""
      />
      {adding && (
        <Editor
          title="Add new account"
          help="Give the account holder their temporary password through your approved private channel. No email is sent automatically."
          fields={[
            { name: "first_name", label: "First name", maxLength: 80 },

            { name: "last_name", label: "Last name", maxLength: 80 },

            { name: "email", label: "Email", type: "email", maxLength: 255 },

            {
              name: "role",

              label: "Account role",

              options: Object.entries(roles).map(([value, label]) => ({
                value,

                label,
              })),
            },

            {
              name: "password",

              label:
                "New account password (12+ characters, upper/lower case, number and symbol)",

              type: "password",

              minLength: 12,
            },

            {
              name: "password_confirmation",

              label: "Confirm new account password",

              type: "password",

              minLength: 12,
            },

            {
              name: "current_password",

              label: "Your administrator password",

              type: "password",
            },
          ]}
          onClose={() => setAdding(false)}
          onSave={async (v) => {
            await api("/users", "POST", v)

            setMessage("Account created with role-based workspace access.")

            await r.reload()
          }}
        />
      )}
      <TableSettings />
      <LoginAttemptSettings />
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {editor && (
        <Editor
          title={`Manage access: ${editor.name}`}
          fields={[
            {
              name: "current_password",

              label: "Your current password",

              type: "password",
            },

            {
              name: "role",

              label: "Account role",

              options: Object.entries(roles).map(([value, label]) => ({
                value,

                label,
              })),
            },
          ]}
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={async (v) => {
            await api(`/users/${editor.id}/role`, "PATCH", {
              role: v.role,

              current_password: v.current_password,
            })

            setMessage("Account access updated.")

            await r.reload()
          }}
        />
      )}
      <ResourceState
        resource={r}
        skeleton={<TableSkeleton kind="access" columns={4} />}
      >
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-secondary text-xs text-primary">
              <tr>
                <th className="p-4">Account</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {r.data?.data.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="p-4">{u.name}</td>
                  <td className="p-4">
                    <Contact value={u.email} />
                  </td>
                  <td className="p-4">{roles[u.role]}</td>
                  <td className="p-4">
                    <button
                      disabled={u.id === user.id}
                      className={secondaryStyle}
                      onClick={() => setEditor(u)}
                    >
                      {u.id === user.id ? "Current account" : "Manage access"}
                    </button>
                    {u.id !== user.id && (
                      <button
                        className={`${dangerStyle} ml-2`}
                        onClick={() => setRemoving(u)}
                      >
                        Archive account
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResourceState>
    </>
  )
}

export function AuditPage() {
  const [category, setCategory] = useState("all")
  const r = useResource(`/audit?category=${category}`)

  return (
    <>
      <Heading title="Audit Records" description="" />
      <label className="mb-6 block max-w-sm text-sm font-semibold">
        Activity category
        <select
          className={`${inputStyle} mt-2`}
          aria-label="Activity category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">All activities</option>
          <option value="authentication">Authentication events</option>
          <option value="business">Business activities</option>
        </select>
      </label>
      <ResourceState
        resource={r}
        skeleton={<TableSkeleton kind="audit" columns={5} />}
      >
        {!r.data?.data.length ? (
          <Empty title="No audited changes yet" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-secondary text-xs text-primary">
                <tr>
                  {[
                    "Date & time (PHT)",
                    "Actor / account",
                    "Action",
                    "Record",
                    "Details",
                  ].map((l) => (
                    <th key={l} scope="col" className="p-4">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.data?.data.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="p-4 text-xs tabular-nums">
                      {dateTime(e.created_at)}
                    </td>
                    <td className="p-4">
                      {e.actor || "System / unknown identity / removed account"}
                    </td>
                    <td className="p-4">
                      {authenticationAction(e.action)}
                      {e.action.startsWith("auth.") && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {e.action}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs">
                      {e.entity} #{e.entity_id}
                    </td>
                    <td className="max-w-xs p-4 text-xs">
                      <details>
                        <summary className="min-h-8">View details</summary>
                        <pre className="mt-2 max-w-xs overflow-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(
                            typeof e.changes === "string"
                              ? JSON.parse(e.changes)
                              : e.changes,

                            null,

                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ResourceState>
    </>
  )
}
