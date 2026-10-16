import { useSearchParams } from "react-router"

import { ArrowLeft, ShieldAlert, CircleAlert, Search } from "lucide-react"

import { useStaff } from "../../context/StaffContext.jsx"

import { Button, EmptyState, Skeleton, panel } from "../common/UI.jsx"

import { JourneyLink } from "../common/JourneyLink.jsx"

import {
  AssistanceStatusBadge,
  assistanceDate,
} from "../assistance/AssistanceComponents.jsx"

import { mockStaff } from "../../data/mockStaff.js"

export { AssistanceStatusBadge, assistanceDate }

export const staffName = (id) =>
  mockStaff.find((person) => person.id === id)?.name || "Unassigned"

export function waitingLabel(record) {
  if (record.status === "outcome_recorded") return "Outcome recorded"

  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(record.updatedAt).valueOf()) / 3600000),
  )

  return hours < 1
    ? "Updated just now"
    : hours < 24
      ? `Waiting ${hours} hour${hours === 1 ? "" : "s"}`
      : `Waiting ${Math.floor(hours / 24)} days`
}

export const tableClass =
  "w-full text-left text-xs leading-6 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_td]:px-4 [&_td]:py-3 [&_td]:align-top"

export function StaffBack({
  to = "/peso/assistance",

  children = "Back to Employment Assistance",
}) {
  return (
    <JourneyLink
      back
      to={to}
      className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
    >
      <ArrowLeft size={17} />
      {children}
    </JourneyLink>
  )
}

export function StaffPermission({ permission, children }) {
  const { can } = useStaff()

  return can(permission) ? (
    children
  ) : (
    <EmptyState
      heading="h1"
      icon={ShieldAlert}
      title="This area is for PESO Admin"
      description="Your current prototype role cannot access these controls."
      action={<Button to="/peso/dashboard">Back to Staff Dashboard</Button>}
    />
  )
}

export function StaffLoadState({ kind = "assistance", children }) {
  const [params, setParams] = useSearchParams()

  if (params.get("preview") === "loading")
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton label={`Loading ${kind}`} kind="referral" />
        <Skeleton label={`Loading ${kind} details`} kind="profile" />
      </div>
    )

  if (params.get("preview") === "error")
    return (
      <div role="alert" className={`${panel} p-6`}>
        <h2 className="flex items-center gap-2 font-semibold">
          <CircleAlert size={18} />
          We couldn't load {kind} records.
        </h2>
        <Button
          className="mt-4"
          onClick={() =>
            setParams((p) => {
              const n = new URLSearchParams(p)

              n.delete("preview")

              return n
            })
          }
        >
          Try Again
        </Button>
      </div>
    )

  return children
}

export function StaffSearch({
  value,

  onChange,

  label = "Search jobseeker, reference, job, or employer",
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <Search
        size={17}
        className="absolute left-3 top-3.5 text-muted-foreground"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="min-h-12 w-full rounded-lg border border-border bg-white pl-10 pr-3 text-sm"
      />
    </label>
  )
}

export function AssistanceTable({ records, compact = false }) {
  if (!records.length)
    return (
      <EmptyState
        title="No employment assistance requests require attention."
        description="Try a different search or filter to find another record."
      />
    )

  return (
    <div className={`${panel} overflow-hidden`}>
      <div
        role="region"
        aria-label="Assistance queue table"
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table
          className={`${tableClass} ${
            compact ? "min-w-[650px]" : "min-w-[950px]"
          }`}
        >
          <caption className="sr-only">Employment assistance queue</caption>
          <thead className="sticky top-0 bg-muted">
            <tr>
              {[
                "Reference / Requested",

                "Jobseeker",

                "Target Job / Employer",

                "Current Status",

                ...(!compact ? ["Last Updated", "Assigned Staff"] : []),

                "Action",
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-secondary/40 focus-within:bg-secondary/40"
              >
                <td>
                  <span className="whitespace-nowrap font-medium">
                    {record.reference}
                  </span>
                  <span className="block text-muted-foreground">
                    {assistanceDate(record.requestedAt)}
                  </span>
                  <span className="block text-muted-foreground">
                    {waitingLabel(record)}
                  </span>
                </td>
                <td>
                  <JourneyLink
                    to={`/peso/jobseekers/${record.jobseekerId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {record.jobseekerName}
                  </JourneyLink>
                </td>
                <td>
                  <span className="block min-w-36 font-medium">
                    {record.jobTitle}
                  </span>
                  <span className="text-muted-foreground">
                    {record.employer}
                  </span>
                </td>
                <td>
                  <AssistanceStatusBadge status={record.status} />
                </td>
                {!compact && (
                  <>
                    <td>{assistanceDate(record.updatedAt)}</td>
                    <td>{staffName(record.assignedStaffId)}</td>
                  </>
                )}
                <td>
                  <Button
                    to={`/peso/assistance/${record.id}`}
                    variant="secondary"
                    className="text-xs"
                    aria-label={`Review ${record.reference}`}
                  >
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
