import {
  Check,
  Circle,
  CircleDot,
  CircleAlert,
  Clock,
  Handshake,
  Send,
  MessageSquare,
  Minus,
  ArrowLeft,
} from "lucide-react"
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  Skeleton,
  panel,
} from "../common/UI.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import {
  assistanceStatuses,
  assistanceOutcomes,
} from "../../data/mockAssistance.js"
import {
  assistancePath,
  isActiveAssistance,
} from "../../services/assistanceService.js"
import { useDashboard } from "../../context/DashboardContext.jsx"

export function assistanceDate(value) {
  if (!value) return "Date not recorded"
  const date = new Date(value)
  return Number.isNaN(date.valueOf())
    ? "Date not recorded"
    : new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      }).format(date)
}
export function AssistanceStatusBadge({ status }) {
  const Icon =
    {
      request_received: Clock,
      peso_review: Clock,
      referred: Send,
      employer_coordination: MessageSquare,
      follow_up: Clock,
      action_required: CircleAlert,
      outcome_recorded: Check,
    }[status] || Circle
  return (
    <Badge
      status={status === "action_required" ? "Needs Improvement" : undefined}
    >
      <Icon size={14} aria-hidden="true" />
      {assistanceStatuses[status]?.label || "Status unavailable"}
    </Badge>
  )
}
export function AssistanceTimeline({ record, compact = false }) {
  return (
    <ol
      aria-label="PESO assistance timeline"
      className={
        compact ? "mt-4 flex flex-wrap gap-x-3 gap-y-2" : "mt-5 space-y-0"
      }
    >
      {record.timeline.map((step, index) => {
        const Icon = step.current
          ? CircleDot
          : step.completed
            ? Check
            : step.skipped
              ? Minus
              : Circle
        const state = step.current
          ? "Current"
          : step.completed
            ? "Completed"
            : step.skipped
              ? "Not reached"
              : "Upcoming"
        return (
          <li
            key={step.status}
            aria-current={step.current ? "step" : undefined}
            className={
              compact
                ? "flex items-center gap-1.5 text-[11px] leading-5"
                : "relative flex gap-3 pb-6 last:pb-0"
            }
          >
            {!compact && index < record.timeline.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-3 top-6 w-px bg-border last:hidden"
              />
            )}
            <span
              className={`relative flex shrink-0 items-center justify-center ${
                compact ? "size-4" : "size-6 rounded-full bg-white"
              } ${step.current ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={compact ? 13 : 17} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p
                className={`leading-6 ${compact ? "text-[11px]" : "text-sm"} ${
                  step.current
                    ? "font-semibold text-primary"
                    : "text-foreground"
                }`}
              >
                {assistanceStatuses[step.status]?.label || step.status}
                <span
                  className={
                    compact
                      ? "sr-only"
                      : "ml-2 text-[11px] font-normal text-muted-foreground"
                  }
                >
                  {" "}
                  / {state}
                </span>
              </p>
              {!compact && (
                <>
                  {step.date && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <time dateTime={step.date}>
                        {assistanceDate(step.date)}
                      </time>
                    </p>
                  )}
                  {(step.current || step.completed) && (
                    <p className="mt-2 max-w-[65ch] text-xs leading-6 text-muted-foreground">
                      {step.description ||
                        assistanceStatuses[step.status]?.description}
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
export function AssistanceSummary({ records }) {
  const active = records.filter(isActiveAssistance)
  return (
    <dl
      className={`${panel} mb-5 grid grid-cols-2 gap-5 p-5 lg:grid-cols-4`}
      aria-label="Assistance summary"
    >
      {[
        ["Active Assistance", active.length],
        [
          "Under PESO Review",
          active.filter((item) => item.status === "peso_review").length,
        ],
        [
          "Employer Coordination",
          active.filter((item) => item.status === "employer_coordination")
            .length,
        ],
        ["Completed", records.length - active.length],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-2 text-xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
export function AssistanceCard({ record }) {
  return (
    <article className={`${panel} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-7">
            <JourneyLink
              to={assistancePath(record)}
              className="hover:text-primary"
            >
              {record.jobTitle}
            </JourneyLink>
          </h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {record.employer}
          </p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {record.location} / {record.employmentType} /{" "}
            {record.workArrangement}
          </p>
        </div>
        <AssistanceStatusBadge status={record.status} />
      </div>
      <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
        Requested {assistanceDate(record.requestedAt)} /{" "}
        <span className="break-all">{record.reference}</span> /{" "}
        {record.readOnly ? "Sample journey" : "Prototype request"}
      </p>
      {record.outcome && (
        <p className="mt-3 text-sm font-medium">
          Outcome: {assistanceOutcomes[record.outcome]}
          {record.outcomeAt && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {assistanceDate(record.outcomeAt)}
            </span>
          )}
        </p>
      )}
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-semibold">Latest Update</dt>
          <dd className="mt-1 text-xs leading-6 text-muted-foreground">
            {record.latestUpdate}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold">Your Next Step</dt>
          <dd className="mt-1 text-xs leading-6 text-muted-foreground">
            {record.nextStep}
          </dd>
        </div>
      </dl>
      <AssistanceTimeline record={record} compact />
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          to={assistancePath(record)}
          className="text-xs"
          aria-label={`View assistance details for ${record.jobTitle}`}
        >
          View Assistance Details
        </Button>
        <Button
          to={`/jobseeker/jobs/${record.jobId}`}
          variant="secondary"
          className="text-xs"
        >
          View Job
        </Button>
      </div>
    </article>
  )
}
export function AssistanceNextStep({ record }) {
  const returnTo = encodeURIComponent(assistancePath(record))
  return (
    <section className={`${panel} p-5`}>
      <h2 className="text-base font-semibold">Your Next Step</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {record.action?.message || record.nextStep}
      </p>
      {record.status === "action_required" && (
        <Button
          to={`/jobseeker/onboarding/1?review=1&returnTo=${returnTo}`}
          className="mt-4 w-full"
        >
          Update Profile
        </Button>
      )}
      {record.profileRespondedAt && (
        <p className="mt-3 text-xs leading-6">
          Your profile update is saved. A PESO review would still be needed
          before a referral can proceed.
        </p>
      )}
      <Button
        to={`/jobseeker/messages?assistance=${encodeURIComponent(record.reference)}`}
        variant="secondary"
        className="mt-3 w-full"
      >
        <MessageSquare size={16} />
        View Messages
      </Button>
    </section>
  )
}
export function AssistanceOutcome({ record, compact = false }) {
  const { jobs, trainings } = useDashboard()
  if (!record.outcome) return null
  const job = jobs.find((item) => item.id === record.jobId)
  const training = trainings.find((item) =>
    (record.trainingIds || job?.trainingIds || []).includes(item.id),
  )
  const suggested = jobs.find((item) => item.id === record.suggestedJobId)
  const label = assistanceOutcomes[record.outcome]
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <h2 className="text-base font-semibold">Employment Outcome</h2>
      <p className="mt-3 text-xl font-semibold">{label}</p>
      {record.outcomeAt && (
        <p className="mt-2 text-xs text-muted-foreground">
          Recorded {assistanceDate(record.outcomeAt)} / Prototype
        </p>
      )}
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {record.outcome === "hired"
          ? "An employment outcome has been recorded for this opportunity. The employer makes the hiring decision."
          : record.outcome === "not_hired"
            ? "This outcome does not end your employment journey. Explore another opportunity, develop a skill, or continue PESO support."
            : record.outcome === "withdrawn"
              ? `Request Withdrawn. ${record.withdrawalReason || "User withdrew request"}.`
              : record.outcome === "opportunity_closed"
                ? "This opportunity has closed. You can explore other jobs or continue employment support."
                : record.outcome === "under_evaluation"
                  ? "The employer is still evaluating this opportunity. Your assistance remains active."
              : record.outcome === "needs_training"
                ? "Additional Training Recommended. Improving specific skills may help prepare you for similar opportunities."
                : record.outcome === "referred_to_another_opportunity"
                  ? "Another Opportunity Suggested. Review the role and decide whether to explore it."
                  : "Your PESO assistance remains active. Continue watching for the latest update and next step."}
      </p>
      {record.outcome === "needs_training" && training && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm">
            <CircleAlert size={16} />
            {(record.skillsToImprove || [training.skillAddressed]).join(", ")} /
            Needs Improvement
          </p>
          <p className="mt-2 text-sm font-semibold">{training.title}</p>
          <Button
            to={`/training/${training.id}?assistance=${encodeURIComponent(record.id)}${
              record.readOnly ? "&assistanceExample=1" : ""
            }`}
            className="mt-3 text-xs"
          >
            View Training
          </Button>
        </div>
      )}
      {record.outcome === "referred_to_another_opportunity" && suggested && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-semibold">{suggested.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {suggested.matchScore}% Match / Sample
          </p>
          <Button
            to={`/jobseeker/jobs/${suggested.id}`}
            className="mt-3 text-xs"
          >
            View Suggested Job
          </Button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {record.outcome !== "hired" ? (
          <>
            <Button to="/jobs?tab=recommended" className="text-xs">
              View Other Recommended Jobs
            </Button>
            <Button
              to={`/jobseeker/jobs/${record.jobId}/skill-analysis`}
              variant="secondary"
              className="text-xs"
            >
              Review Skills to Improve
            </Button>
            {!compact && (
              <>
                <Button
                  to={`/training?tab=recommended&job=${record.jobId}`}
                  variant="text"
                  className="text-xs"
                >
                  View Recommended Training
                </Button>
                <Button
                  to="/jobseeker/assistance"
                  variant="text"
                  className="text-xs"
                >
                  Continue PESO Assistance
                </Button>
              </>
            )}
          </>
        ) : (
          <Button
            to="/jobseeker/profile"
            variant="secondary"
            className="text-xs"
          >
            Update Your Profile
          </Button>
        )}
      </div>
    </section>
  )
}
export function HowAssistanceWorks({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="How PESO Assistance Works">
      <ol className="list-decimal space-y-4 pl-5 text-sm leading-7">
        {[
          "Select a job opportunity.",
          "Request PESO Assistance.",
          "PESO reviews your profile and request.",
          "PESO may facilitate referral or employer coordination.",
          "Track updates in PesoMatch.",
          "The employer makes the final hiring decision.",
        ].map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ol>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        This prototype records requests in your browser. A real PESO office or
        employer does not receive them.
      </p>
      <Button onClick={onClose} className="mt-5">
        Got It
      </Button>
    </Modal>
  )
}
export function AssistanceEmptyState({ history = false }) {
  return (
    <EmptyState
      icon={Handshake}
      title={
        history
          ? "No completed assistance yet"
          : "No PESO assistance requests yet"
      }
      description={
        history
          ? "Recorded outcomes and withdrawn requests will appear here."
          : "When you find a suitable job opportunity, you can request PESO assistance for guidance and referral support."
      }
      action={<Button to="/jobs?tab=recommended">Explore Jobs</Button>}
    />
  )
}
export function AssistanceCardSkeleton() {
  return <Skeleton kind="referral" label="Loading assistance request" />
}
export function AssistanceTimelineSkeleton() {
  return <Skeleton kind="referral" label="Loading assistance timeline" />
}
export function AssistanceDetailsSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <AssistanceTimelineSkeleton />
      <Skeleton kind="referral" label="Loading assistance details" />
    </div>
  )
}
export function AssistanceErrorState({ onRetry }) {
  return (
    <div role="alert" className={`${panel} p-6`}>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <CircleAlert size={18} />
        We couldn't load your PESO assistance records.
      </h2>
      <Button onClick={onRetry} className="mt-4">
        Try Again
      </Button>
    </div>
  )
}
