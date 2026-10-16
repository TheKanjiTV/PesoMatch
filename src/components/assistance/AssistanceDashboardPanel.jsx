import { Button, panel } from "../common/UI.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import {
  assistancePath,
  isActiveAssistance,
} from "../../services/assistanceService.js"
import {
  AssistanceStatusBadge,
  AssistanceTimeline,
} from "./AssistanceComponents.jsx"

export function AssistanceDashboardPanel({ empty = false }) {
  const { requests } = useDashboard()
  const active = empty ? [] : requests.filter(isActiveAssistance)
  const record = active.at(-1)
  return (
    <section data-tour="assistance" className={`${panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">PESO Assistance</h2>
        <Button
          to="/jobseeker/assistance"
          variant="text"
          className="!px-0 text-xs"
        >
          View all
        </Button>
      </div>
      {record ? (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            Active Assistance / {active.length}
          </p>
          <h3 className="mt-3 text-sm font-semibold leading-6">
            {record.jobTitle}
          </h3>
          <div className="mt-3">
            <AssistanceStatusBadge status={record.status} />
          </div>
          <AssistanceTimeline record={record} compact />
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {record.nextStep}
          </p>
          <Button to={assistancePath(record)} className="mt-4 text-xs">
            View Status
          </Button>
        </>
      ) : (
        <>
          <h3 className="mt-3 text-sm font-medium">
            No active PESO assistance
          </h3>
          <p className="mt-2 text-xs leading-7 text-muted-foreground">
            Request assistance from an eligible job opportunity when you need
            employment support.
          </p>
          <Button
            to="/jobs?tab=recommended"
            variant="secondary"
            className="mt-3 text-xs"
          >
            Explore Jobs
          </Button>
        </>
      )}
    </section>
  )
}
