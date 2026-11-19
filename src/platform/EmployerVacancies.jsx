import { RecordLink as Link } from "./RecordLink.jsx"

import { Badge, date, secondaryStyle } from "./ui.jsx"

const rowAction =
  "inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold"

export const vacancyStatuses = {
  draft: ["Draft", "neutral"],
  pending_review: ["Pending PESO review", "pending"],
  published: ["Active", "success"],
  on_hold: ["On hold", "pending"],
  cancelled: ["Cancelled", "error"],
  closed: ["Closed", "neutral"],
}

export function VacancyStatus({ record }) {
  const [label, tone] =
    record.status === "published" &&
    record.availability_status === "deadline_passed"
      ? ["Deadline passed", "neutral"]
      : (vacancyStatuses[record.status] ?? [record.status, "neutral"])

  return <Badge tone={tone}>{label}</Badge>
}

export function EmployerVacancyTable({
  rows,
  view,
  searchParams,
  canManage,
  edit,
  remove,
}) {
  const directory = view === "employers"
  const label = directory
    ? "Employer directory"
    : view === "mine"
      ? "My vacancies"
      : "All vacancies"
  const columns = directory
    ? ["Organization", "Published vacancies", "Action"]
    : ["Vacancy", "Location", "Status", "Employer", "Updated", "Actions"]

  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="overflow-x-auto rounded-lg border border-border bg-card"
    >
      <table
        className={`w-full text-left text-sm ${
          directory ? "min-w-[420px]" : "min-w-[820px]"
        }`}
      >
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="p-4">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) =>
            directory ? (
              <tr key={row.organization} className="border-t border-border">
                <th scope="row" className="p-4">
                  {row.organization}
                </th>
                <td className="p-4">{row.vacancy_count}</td>
                <td className="p-4">
                  <Link
                    className={secondaryStyle}
                    to={`/jobs?${new URLSearchParams({ view: "all", organization: row.organization })}`}
                  >
                    View vacancies
                    <span className="sr-only"> at {row.organization}</span>
                  </Link>
                </td>
              </tr>
            ) : (
              <tr key={row.id} className="border-t border-border">
                <td className="p-4">
                  <Link
                    to={`/jobs/${row.id}${searchParams}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.employment_type}
                  </p>
                </td>
                <td className="p-4">{row.location}</td>
                <td className="whitespace-nowrap p-4">
                  <VacancyStatus record={row} />
                </td>
                <td className="p-4">{row.organization}</td>
                <td className="whitespace-nowrap p-4">
                  {date(row.updated_at)}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={`${rowAction} action-view`}
                      aria-label="View vacancy"
                      to={`/jobs/${row.id}${searchParams}`}
                    >
                      View
                    </Link>
                    {canManage(row) && !row.external_application && (
                      <>
                        <button
                          className={`${rowAction} hover:bg-secondary`}
                          aria-label="Edit vacancy"
                          onClick={() => edit(row)}
                        >
                          Edit
                        </button>
                        <button
                          className={`${rowAction} action-delete`}
                          aria-label="Delete vacancy"
                          onClick={() => remove(row)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}
