import { useStaff } from "../../context/StaffContext.jsx"
import { mockJobseekers } from "../../data/mockJobseekers.js"
import { outcomeOptions } from "../../services/staffAssistanceService.js"
import { PageHeading, panel } from "../../components/common/UI.jsx"
import { tableClass } from "../../components/staff/StaffShared.jsx"
export default function StaffReportsPage() {
  const { state } = useStaff()
  return (
    <>
      <PageHeading
        title="Operational Reports"
        description="A browser-only summary of this prototype workspace. These are not official government reports."
      />
      <section className={`${panel} p-5`}>
        <h2 className="text-base font-semibold">Current Workspace Summary</h2>
        <dl className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Sample jobseekers", mockJobseekers.length],
            ["Assistance requests", state.records.length],
            [
              "Referrals prepared",
              state.records.filter((r) => r.referral).length,
            ],
            [
              "Training recommendations",
              state.records.reduce(
                (sum, r) => sum + r.trainingRecommendations.length,
                0,
              ),
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={`${panel} mt-5 overflow-hidden`}>
        <h2 className="p-5 text-base font-semibold">Recorded Outcomes</h2>
        <table className={tableClass}>
          <thead className="bg-muted">
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Sample records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Object.entries(outcomeOptions).map(([key, label]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{state.records.filter((r) => r.outcome === key).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={`${panel} mt-5 p-5`}>
        <h2 className="text-base font-semibold">Future Reporting</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Registered jobseekers, referrals, job matches, training
          recommendations and skill gaps will use validated backend records.
          Official reporting and exports are not connected in this phase.
        </p>
      </section>
    </>
  )
}
