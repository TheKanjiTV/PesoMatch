import { useState } from "react"
import { useSearchParams } from "react-router"
import { CircleHelp } from "lucide-react"
import { PageHeading, Button } from "../../components/common/UI.jsx"
import { ViewTabs } from "../../components/common/ViewTabs.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import {
  getSampleAssistance,
  getActiveAssistance,
  getAssistanceHistory,
} from "../../services/assistanceService.js"
import {
  AssistanceSummary,
  AssistanceCard,
  AssistanceEmptyState,
  HowAssistanceWorks,
  AssistanceCardSkeleton,
  AssistanceErrorState,
} from "../../components/assistance/AssistanceComponents.jsx"

export function AssistancePage() {
  const { requests, accountId } = useDashboard()
  const [params, setParams] = useSearchParams()
  const [help, setHelp] = useState(false)
  const examples = params.get("examples") === "1"
  const tab = params.get("tab") === "history" ? "history" : "active"
  const records = examples ? getSampleAssistance(accountId) : requests
  const active = getActiveAssistance(null, records),
    history = getAssistanceHistory(null, records)
  const visible = (tab === "history" ? history : active).toSorted((a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || ""),
  )
  const preview = params.get("preview")
  return (
    <>
      <PageHeading
        title="PESO Assistance"
        description="Track employment assistance, referrals, and follow-up support from PESO."
        actions={
          <Button onClick={() => setHelp(true)} variant="secondary">
            <CircleHelp size={17} />
            How It Works
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-6 text-muted-foreground">
          {examples
            ? "Sample journeys / Read-only illustrations of review, referral and employer outcomes."
            : "Your prototype requests are saved in this browser for your account."}
        </p>
        <Button
          to={
            examples
              ? "/jobseeker/assistance"
              : "/jobseeker/assistance?examples=1"
          }
          variant="text"
          className="!px-0 text-xs"
        >
          {examples ? "Back to My Requests" : "View Sample Journeys"}
        </Button>
      </div>
      <AssistanceSummary records={records} />
      <ViewTabs
        label="PESO assistance views"
        items={[
          ["active", `Active Assistance (${active.length})`],
          ["history", `History (${history.length})`],
        ]}
        value={tab}
        onChange={(value) =>
          setParams(
            (current) => {
              const next = new URLSearchParams(current)
              next.set("tab", value)
              return next
            },
            { flushSync: true },
          )
        }
      />
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        key={tab}
        className="tab-enter"
      >
        <h2 className="sr-only">
          {tab === "history"
            ? "Assistance history"
            : "Active assistance requests"}
        </h2>
        {preview === "loading" ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <AssistanceCardSkeleton />
            <AssistanceCardSkeleton />
          </div>
        ) : preview === "error" ? (
          <AssistanceErrorState
            onRetry={() =>
              setParams((current) => {
                const next = new URLSearchParams(current)
                next.delete("preview")
                return next
              })
            }
          />
        ) : visible.length ? (
          <div className="grid items-start gap-5 xl:grid-cols-2">
            {visible.map((record) => (
              <AssistanceCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <AssistanceEmptyState history={tab === "history"} />
        )}
      </section>
      <HowAssistanceWorks open={help} onClose={() => setHelp(false)} />
    </>
  )
}
