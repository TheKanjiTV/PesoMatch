import { useStaff } from "../../context/StaffContext.jsx"
import { PageHeading, Button, panel } from "../../components/common/UI.jsx"
import {
  AssistanceTable,
  StaffLoadState,
  assistanceDate,
  staffName,
} from "../../components/staff/StaffShared.jsx"
export default function StaffDashboard() {
  const { state, actor } = useStaff()
  const counts = [
    ["Pending Review", ["request_received", "peso_review"], "review"],
    ["Active Referrals", ["referred"], "active"],
    ["Action Required", ["action_required"], "action"],
    ["Employer Coordination", ["employer_coordination"], "active"],
    ["Outcomes Pending", ["follow_up"], "active"],
  ]
  const attention = state.records
    .filter((item) =>
      [
        "request_received",
        "peso_review",
        "action_required",
        "follow_up",
      ].includes(item.status),
    )
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
    .slice(0, 5)
  return (
    <>
      <PageHeading
        title="Staff Dashboard"
        description={`Your employment assistance workspace, ${actor.name.split(" ")[0]}. Review requests and follow through on the next action.`}
        actions={<Button to="/peso/assistance">Open Assistance Queue</Button>}
      />
      <StaffLoadState>
        <dl
          className={`${panel} mb-6 grid gap-5 p-5 sm:grid-cols-3 xl:grid-cols-5`}
        >
          {counts.map(([label, statuses, tab]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2">
                <Button
                  to={`/peso/assistance?tab=${tab}${
                    statuses.length === 1 ? "&status=" + statuses[0] : ""
                  }`}
                  variant="text"
                  className="!min-h-0 !p-0 !text-2xl tabular-nums"
                  aria-label={`${state.records.filter((r) => statuses.includes(r.status)).length} ${label}`}
                >
                  {
                    state.records.filter((r) => statuses.includes(r.status))
                      .length
                  }
                </Button>
              </dd>
            </div>
          ))}
        </dl>
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Needs Your Attention</h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                Review new requests and follow up on open actions. Dates belong
                to sample records.
              </p>
            </div>
            <Button
              to="/peso/assistance?tab=review"
              variant="text"
              className="text-xs"
            >
              View Review Queue
            </Button>
          </div>
          <AssistanceTable records={attention} compact />
        </section>
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className={`${panel} p-5`}>
            <h2 className="text-base font-semibold">Referral Pipeline</h2>
            <ol className="mt-5 flex flex-wrap gap-4">
              {[
                ["Received", "request_received"],
                ["PESO Review", "peso_review"],
                ["Referred", "referred"],
                ["Coordination", "employer_coordination"],
                ["Outcome", "outcome_recorded"],
              ].map(([label, status]) => (
                <li
                  key={status}
                  className="min-w-24 flex-1 border-t border-border pt-3"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {state.records.filter((r) => r.status === status).length}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              PESO assists, refers and coordinates. Employers make the final
              hiring decisions.
            </p>
          </section>
          <section className={`${panel} p-5`}>
            <h2 className="text-base font-semibold">Recent Activity</h2>
            <ol className="mt-4 divide-y divide-border">
              {state.audit.slice(0, 5).map((item) => (
                <li key={item.id} className="py-3">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {staffName(item.staffId)} / {assistanceDate(item.date)}
                  </p>
                  {item.reference.startsWith("PESO-DEMO-") && (
                    <Button
                      to={`/peso/assistance/${item.reference}`}
                      variant="text"
                      className="!px-0 text-xs"
                    >
                      {item.reference}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </StaffLoadState>
    </>
  )
}
