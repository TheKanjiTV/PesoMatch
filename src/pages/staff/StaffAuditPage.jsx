import { useState } from "react"
import { useStaff } from "../../context/StaffContext.jsx"
import { PageHeading, EmptyState, panel } from "../../components/common/UI.jsx"
import {
  StaffPermission,
  StaffSearch,
  tableClass,
  staffName,
} from "../../components/staff/StaffShared.jsx"
export default function StaffAuditPage() {
  const { state } = useStaff(),
    [search, setSearch] = useState("")
  const items = state.audit.filter((item) =>
    `${staffName(item.staffId)} ${item.reference} ${item.action} ${item.summary}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  return (
    <StaffPermission permission="view_audit">
      <PageHeading
        title="Audit Log"
        description="Read-only prototype history of recorded staff actions. Future backend audit records will be immutable."
      />
      <div className="mb-5">
        <StaffSearch
          label="Search staff, action or reference"
          value={search}
          onChange={setSearch}
        />
      </div>
      {items.length ? (
        <div className={`${panel} overflow-hidden`}>
          <div
            role="region"
            aria-label="Audit records"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className={`${tableClass} min-w-[850px]`}>
              <caption className="sr-only">Staff activity audit</caption>
              <thead className="bg-muted">
                <tr>
                  {[
                    "Timestamp",
                    "Staff",
                    "Action",
                    "Record Type",
                    "Reference",
                    "Summary",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {new Date(item.date).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </td>
                    <td>{staffName(item.staffId)}</td>
                    <td>{item.action}</td>
                    <td>{item.recordType}</td>
                    <td>{item.reference}</td>
                    <td>{item.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No staff activity has been recorded yet."
          description="Actions will appear here as the workflow is used."
        />
      )}
    </StaffPermission>
  )
}
