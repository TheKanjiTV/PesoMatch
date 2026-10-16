import { useParams, useSearchParams } from "react-router"
import { ArrowLeft, Building2 } from "lucide-react"
import { useDashboard } from "../../context/DashboardContext.jsx"
import {
  PageHeading,
  Button,
  EmptyState,
  panel,
} from "../../components/common/UI.jsx"
import { JourneyLink } from "../../components/common/JourneyLink.jsx"
import { CompanyMark } from "../../components/jobs/JobVisuals.jsx"
import {
  getAssistanceById,
  getSampleAssistance,
  isActiveAssistance,
} from "../../services/assistanceService.js"
import { assistanceStatuses } from "../../data/mockAssistance.js"
import {
  AssistanceStatusBadge,
  AssistanceTimeline,
  AssistanceNextStep,
  AssistanceOutcome,
  AssistanceDetailsSkeleton,
  AssistanceErrorState,
  assistanceDate,
} from "../../components/assistance/AssistanceComponents.jsx"
import { WithdrawAssistanceDialog } from "../../components/assistance/WithdrawAssistanceDialog.jsx"

export function AssistanceDetailsPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { requests, jobs, accountId } = useDashboard()
  const example = params.get("example") === "1"
  const record = getAssistanceById(
    id,
    null,
    example ? getSampleAssistance(accountId) : requests,
  )
  const job = jobs.find((item) => item.id === record?.jobId)
  if (!record || !job)
    return (
      <EmptyState
        heading="h1"
        title="Assistance request not found"
        description="This request is not available in your browser for this account. You can return to your requests or choose a job opportunity."
        action={
          <Button to="/jobseeker/assistance">View PESO Assistance</Button>
        }
      />
    )
  const listPath = `/jobseeker/assistance?tab=${
    isActiveAssistance(record) ? "active" : "history"
  }${example ? "&examples=1" : ""}`
  const retry = () =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete("preview")
      return next
    })
  return (
    <>
      <JourneyLink
        back
        to={listPath}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={18} />
        Back to PESO Assistance
      </JourneyLink>
      <PageHeading
        title="PESO Assistance"
        description={record.jobTitle}
        actions={
          <Button back to={`/jobseeker/jobs/${job.id}`} variant="secondary">
            View Job
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="break-all text-sm font-medium">
            Reference: {record.reference}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Requested {assistanceDate(record.requestedAt)} /{" "}
            {example ? "Read-only sample journey" : "Prototype request"}
          </p>
        </div>
        <div
          id="assistance-status"
          tabIndex={-1}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="sr-only">Current status: </span>
          <AssistanceStatusBadge status={record.status} />
        </div>
      </div>
      {params.get("preview") === "loading" ? (
        <AssistanceDetailsSkeleton />
      ) : params.get("preview") === "error" ? (
        <AssistanceErrorState onRetry={retry} />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section
            className={`${panel} p-5 sm:p-6 xl:col-start-1 xl:row-start-1`}
          >
            <h2 className="text-base font-semibold">Assistance Details</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Job Title", record.jobTitle],
                ["Employer", record.employer],
                ["Job Location", record.location],
                [
                  "Employment Type",
                  `${record.employmentType} / ${record.workArrangement}`,
                ],
                ["Requested Date", assistanceDate(record.requestedAt)],
                ["Current Status", assistanceStatuses[record.status].label],
                ["Assigned PESO Office", record.office],
                ["Last Updated", assistanceDate(record.updatedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm leading-6">{value}</dd>
                </div>
              ))}
            </dl>
            {record.notes && (
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-xs font-semibold">Your Request Note</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">
                  {record.notes}
                </p>
              </div>
            )}
          </section>
          <div className="xl:col-start-2 xl:row-start-1">
            <AssistanceNextStep record={record} />
          </div>
          <section
            className={`${panel} p-5 sm:p-6 xl:col-start-1 xl:row-start-2`}
          >
            <h2 className="text-base font-semibold">Status Timeline</h2>
            <AssistanceTimeline record={record} />
          </section>
          <section
            className={`${panel} p-5 sm:p-6 xl:col-start-1 xl:row-start-3`}
          >
            <h2 className="text-base font-semibold">Latest Update</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {record.latestUpdate}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated {assistanceDate(record.updatedAt)}
            </p>
            <div className="mt-5 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Employer Feedback</h3>
              <p className="mt-2 text-sm font-medium">
                {record.employerFeedback.status}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {record.employerFeedback.message}
              </p>
              {record.employerFeedback.date && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Recorded {assistanceDate(record.employerFeedback.date)}
                </p>
              )}
            </div>
          </section>
          <div className="space-y-5 xl:col-start-1 xl:row-start-4">
            <AssistanceOutcome record={record} />
            {!record.readOnly && isActiveAssistance(record) && (
              <div className={`${panel} p-5`}>
                <h2 className="text-base font-semibold">Request Actions</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  You can withdraw this prototype request if you no longer need
                  support for this opportunity.
                </p>
                <div className="mt-3">
                  <WithdrawAssistanceDialog record={record} />
                </div>
              </div>
            )}
          </div>
          <aside
            className="space-y-5 xl:col-start-2 xl:row-start-2 xl:row-span-3"
            aria-label="Opportunity and PESO support"
          >
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Selected Job</h2>
              <div className="mt-4 flex items-center gap-3">
                <CompanyMark job={job} />
                <p className="text-xs leading-6 text-muted-foreground">
                  {job.company}
                </p>
              </div>
              <h3 className="mt-4 text-sm font-semibold">{job.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {job.location}
              </p>
              <p className="mt-2 text-sm font-medium text-primary">
                {job.matchScore}% Match / Sample
              </p>
              <Button
                back
                to={`/jobseeker/jobs/${job.id}`}
                variant="secondary"
                className="mt-4 w-full"
              >
                Return to Job
              </Button>
              <Button
                to={`/jobseeker/jobs/${job.id}/skill-analysis`}
                variant="text"
                className="mt-1 w-full text-xs"
              >
                Review Skills to Improve
              </Button>
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Building2 size={18} />
                PESO Office
              </h2>
              <p className="mt-3 text-sm font-medium">{record.office}</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Contact information and office hours will be available when
                official PESO data is connected.
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                PESO facilitates employment assistance and referrals. Final
                hiring decisions belong to employers.
              </p>
            </section>
          </aside>
        </div>
      )}
    </>
  )
}
