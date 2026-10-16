import { useRef, useState } from "react"
import { useLocation, useSearchParams } from "react-router"
import { useStaff } from "../../context/StaffContext.jsx"
import {
  PageHeading,
  Field,
  Button,
  panel,
} from "../../components/common/UI.jsx"
import { ViewTabs } from "../../components/common/ViewTabs.jsx"
import {
  AssistanceTable,
  StaffSearch,
  StaffLoadState,
} from "../../components/staff/StaffShared.jsx"
import { getAssistanceQueue } from "../../services/staffAssistanceService.js"
import { assistanceStatuses } from "../../data/assistanceStatuses.js"
import { mockStaff } from "../../data/mockStaff.js"
import { mockJobs } from "../../data/mockJobs.js"
export default function AssistanceQueuePage() {
  const { state } = useStaff(),
    { pathname } = useLocation()
  const [params, setParams] = useSearchParams(),
    [page, setPage] = useState(0)
  const latest = useRef(params),
    observed = useRef(params.toString())
  if (observed.current !== params.toString()) {
    observed.current = params.toString()
    latest.current = params
  }
  const update = (key, value) => {
    const next = new URLSearchParams(latest.current)
    value ? next.set(key, value) : next.delete(key)
    latest.current = next
    setPage(0)
    setParams(next, { replace: true, flushSync: true })
  }
  const mode = pathname.split("/").at(-1),
    title =
      mode === "referrals"
        ? "Referrals"
        : mode === "coordination"
          ? "Employer Coordination"
          : mode === "outcomes"
            ? "Employment Outcomes"
            : "Employment Assistance"
  const tabs = [
    ["all", "All"],
    ["review", "Needs Review"],
    ["active", "Active"],
    ["action", "Action Required"],
    ["completed", "Completed"],
  ]
  const tab = tabs.some(([key]) => key === params.get("tab"))
    ? params.get("tab")
    : "all"
  const source = {
    ...state,
    records: state.records.filter((r) =>
      mode === "referrals"
        ? !!r.referral
        : mode === "coordination"
          ? ["referred", "employer_coordination", "follow_up"].includes(
              r.status,
            )
          : mode === "outcomes"
            ? !!r.outcome
            : true,
    ),
  }
  const results = getAssistanceQueue(source, {
      ...Object.fromEntries(params),
      tab,
    }),
    pages = Math.max(1, Math.ceil(results.length / 8)),
    current = Math.min(page, pages - 1)
  const select = (label, key, options) => (
    <Field
      key={key}
      label={label}
      value={params.get(key) || ""}
      onChange={(e) => update(key, e.target.value)}
    >
      <option value="">All</option>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </Field>
  )
  const clear = () => {
    latest.current = new URLSearchParams()
    setPage(0)
    setParams({}, { flushSync: true })
  }
  return (
    <>
      <PageHeading
        title={title}
        description="Review the request, understand its current stage and take the next appropriate action."
      />
      <ViewTabs
        label="Staff assistance views"
        items={tabs}
        value={tab}
        onChange={(value) => update("tab", value)}
      />
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        <div className={`${panel} mb-5 p-4`}>
          <StaffSearch
            value={params.get("search") || ""}
            onChange={(value) => update("search", value)}
          />
          <details className="mt-3">
            <summary className="cursor-pointer py-2 text-sm font-medium text-primary">
              Filter queue
              {[...params.keys()].filter(
                (key) => !["tab", "search", "preview"].includes(key),
              ).length
                ? " / Filters applied"
                : ""}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {select(
                "Status",
                "status",
                Object.entries(assistanceStatuses).map(([id, value]) => [
                  id,
                  value.label,
                ]),
              )}
              {select(
                "Assigned staff",
                "staff",
                mockStaff.map((person) => [person.id, person.name]),
              )}
              {select(
                "Target job",
                "job",
                mockJobs.map((job) => [job.id, job.title]),
              )}
              {select(
                "Employer",
                "employer",
                [...new Set(mockJobs.map((job) => job.company))].map((name) => [
                  name,
                  name,
                ]),
              )}
              <Field
                label="Requested from"
                type="date"
                value={params.get("from") || ""}
                onChange={(e) => update("from", e.target.value)}
              />
              <Field
                label="Requested to"
                type="date"
                min={params.get("from") || undefined}
                value={params.get("to") || ""}
                onChange={(e) => update("to", e.target.value)}
              />
            </div>
          </details>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-xs text-muted-foreground">
              {results.length} sample requests
            </p>
            <Button variant="text" onClick={clear} className="text-xs">
              Clear Filters
            </Button>
          </div>
        </div>
        <StaffLoadState>
          <AssistanceTable
            records={results.slice(current * 8, current * 8 + 8)}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {current + 1} of {pages}
            </span>
            <Button
              variant="secondary"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </StaffLoadState>
      </section>
    </>
  )
}
