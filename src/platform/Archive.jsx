import { useState } from "react"
import { api, useResource, useSearchQuery } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"
import { SearchInput } from "./SearchInput.jsx"
import { TableSkeleton } from "./LoadingStates.jsx"
import {
  Badge,
  dateTime,
  Editor,
  Empty,
  Heading,
  human,
  inputStyle,
  Notice,
  secondaryStyle,
} from "./ui.jsx"

const labels = {
  account: "Account",
  vacancy: "Vacancy",
  training: "Training program",
  enrollment: "Enrollment",
}

export function ArchivePage() {
  const [kind, setKind] = useState("all")
  const [search, setSearch] = useState("")
  const query = useSearchQuery(search)
  const records = useResource(
    `/archive?kind=${kind}&search=${encodeURIComponent(query)}`,
  )
  const [restoring, setRestoring] = useState(null)
  const [pending, setPending] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function restore(record, body = {}) {
    const key = `${record.type}-${record.id}`
    setPending(key)
    setError("")
    try {
      const result = await api(
        `/archive/${record.type}/${record.id}/restore`,
        "POST",
        body,
      )
      setMessage(result.message)
      await records.reload()
    } finally {
      setPending("")
    }
  }

  return (
    <>
      <Heading
        title="Archive & Restore"
        description="Review recoverable accounts, vacancies, training programs, and enrollment history. Restores are recorded in Audit Records."
      />
      <div className="mb-6 max-w-prose text-sm leading-6 text-muted-foreground">
        Catalog records return as drafts. Enrollment history keeps its withdrawn
        or rejected status. Restored accounts require a new sign-in. Permanent
        personal-data erasure, removed résumés, and removed bookmarks cannot be
        restored here.
      </div>
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice error>{error}</Notice>
        </div>
      )}
      {restoring && (
        <Editor
          title={`Restore ${restoring.label}`}
          fields={[
            {
              name: "current_password",
              label: "Your current administrator password",
              type: "password",
            },
          ]}
          submitLabel="Restore account"
          pendingLabel="Restoring…"
          help="This restores the account's previous role and personal records. Previously revoked sessions stay signed out."
          onClose={() => setRestoring(null)}
          onSave={(values) => restore(restoring, values)}
        />
      )}
      <div className="mb-6 grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
        <SearchInput
          value={search}
          onChange={setSearch}
          label="Search archived records"
        />
        <label className="text-sm font-semibold">
          Record type
          <select
            aria-label="Record type"
            className={`${inputStyle} mt-2`}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All archived records</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ResourceState
        resource={records}
        skeleton={<TableSkeleton kind="archive" columns={5} />}
      >
        {!records.data?.data.length ? (
          <Empty title="No archived records found">
            Archived accounts and service records appear here. Try another
            record type or search.
          </Empty>
        ) : (
          <div
            className="overflow-x-auto rounded-lg border border-border bg-card"
            role="region"
            aria-label="Archived records"
            tabIndex={0}
          >
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">
                Recoverable records, newest archive first
              </caption>
              <thead className="bg-secondary text-xs text-primary">
                <tr>
                  {[
                    "Archived (PHT)",
                    "Record",
                    "Type",
                    "Status / role",
                    "Action",
                  ].map((label) => (
                    <th key={label} scope="col" className="p-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.data?.data.map((record) => (
                  <tr
                    key={`${record.type}-${record.id}`}
                    className="border-t border-border"
                  >
                    <td className="p-4 text-xs tabular-nums">
                      <time dateTime={record.archived_at}>
                        {dateTime(record.archived_at)}
                      </time>
                    </td>
                    <td className="max-w-sm break-words p-4">
                      <span className="font-semibold">{record.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {record.context || "Removed account"} · #{record.id}
                      </span>
                    </td>
                    <td className="p-4">{labels[record.type]}</td>
                    <td className="p-4">
                      <Badge>{human(record.status)}</Badge>
                    </td>
                    <td className="p-4">
                      <button
                        className={secondaryStyle}
                        disabled={!!pending}
                        aria-label={`Restore ${labels[record.type].toLowerCase()} ${record.label}`}
                        onClick={() =>
                          record.type === "account"
                            ? setRestoring(record)
                            : restore(record).catch((failure) =>
                                setError(failure.message),
                              )
                        }
                      >
                        {pending === `${record.type}-${record.id}`
                          ? "Restoring…"
                          : "Restore"}
                      </button>
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
