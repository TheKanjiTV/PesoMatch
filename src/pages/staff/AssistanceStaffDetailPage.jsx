import { useState } from "react"
import { mockTrainings } from "../../data/mockTrainings.js"
import { useParams } from "react-router"
import { useStaff } from "../../context/StaffContext.jsx"
import {
  Button,
  EmptyState,
  PageHeading,
  panel,
} from "../../components/common/UI.jsx"
import {
  StaffBack,
  AssistanceStatusBadge,
  StaffLoadState,
  assistanceDate,
  staffName,
} from "../../components/staff/StaffShared.jsx"
import {
  StaffJobseekerSummary,
  StaffSelectedJob,
  StaffAssistanceTimeline,
  StaffTrainingRecommendations,
} from "../../components/staff/StaffRecordPanels.jsx"
import {
  StaffWorkflowDialog,
  actionLabels,
} from "../../components/staff/StaffWorkflowDialog.jsx"
import {
  workflowActions,
  outcomeOptions,
  toPublicAssistance,
} from "../../services/staffAssistanceService.js"
import { AssistanceTimeline } from "../../components/assistance/AssistanceComponents.jsx"
export default function AssistanceStaffDetailPage() {
  const { id } = useParams(),
    { state, can } = useStaff(),
    [action, setAction] = useState(null)
  const record = state.records.find((item) => item.id === id)
  if (!record)
    return (
      <EmptyState
        heading="h1"
        title="Assistance request not found"
        description="Return to the queue to select an available sample record."
        action={<Button to="/peso/assistance">Open Assistance Queue</Button>}
      />
    )
  const actions = (workflowActions[record.status] || []).filter(
    (item) =>
      can(item === "recordOutcome" ? "record_outcomes" : "process_referrals") &&
      (item !== "recommendTraining" ||
        mockTrainings.some((training) =>
          training.jobIds.includes(record.jobId),
        )),
  )
  return (
    <>
      <StaffBack />
      <PageHeading
        title="Employment Assistance"
        description={`${record.reference} / ${record.jobseekerName}`}
        actions={
          <Button to={`/peso/assistance/${id}/public`} variant="secondary">
            Preview Jobseeker Updates
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{record.jobTitle}</p>
        <AssistanceStatusBadge status={record.status} />
      </div>
      <StaffLoadState>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            <section className={`${panel} p-5`}>
              <h2
                id="staff-workflow-heading"
                tabIndex={-1}
                className="text-base font-semibold outline-none"
              >
                Next Staff Action
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {record.status === "outcome_recorded"
                  ? "An outcome has been recorded. Relevant training support remains available."
                  : record.status === "action_required"
                    ? "Review the requested information before resuming the assistance workflow."
                    : "Review the profile and opportunity, then choose the action appropriate to this stage."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((item, index) => (
                  <Button
                    key={item}
                    variant={index === 0 ? "primary" : "secondary"}
                    onClick={() => setAction(item)}
                    className="text-xs"
                  >
                    {item === "recordEmployerCoordination" &&
                    record.status === "referred"
                      ? "Start Employer Coordination"
                      : item === "startReview" &&
                          record.status === "action_required"
                        ? "Resume PESO Review"
                        : actionLabels[item]}
                  </Button>
                ))}
              </div>
            </section>
            <StaffJobseekerSummary record={record} />
            {record.referral && (
              <section className={`${panel} p-5`}>
                <h2 className="text-base font-semibold">Referral Prepared</h2>
                <p className="mt-3 text-sm leading-7">
                  {record.referral.reference}
                  <br />
                  {staffName(record.referral.staffId)} /{" "}
                  {assistanceDate(record.referral.date)}
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Recorded in the prototype. No referral has been sent to an
                  employer.
                </p>
              </section>
            )}
            {(record.coordination.length > 0 ||
              record.followUps.length > 0 ||
              record.employerFeedback) && (
              <section className={`${panel} p-5`}>
                <h2 className="text-base font-semibold">
                  Employer Coordination &amp; Follow-up
                </h2>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  {[
                    [
                      "Employer response",
                      record.employerFeedback?.status ||
                        "Awaiting employer update",
                    ],
                    [
                      "Next follow-up",
                      record.nextFollowUp
                        ? assistanceDate(record.nextFollowUp)
                        : "Not recorded",
                    ],
                    [
                      "Latest coordination",
                      record.coordination.at(-1)
                        ? `${assistanceDate(record.coordination.at(-1).date)} / ${record.coordination.at(-1).method}`
                        : "Not recorded",
                    ],
                    ["Last recorded update", assistanceDate(record.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 leading-7">{value}</dd>
                    </div>
                  ))}
                </dl>
                {record.employerFeedback && (
                  <p className="mt-4 text-sm leading-7">
                    {record.employerFeedback.message}
                  </p>
                )}
                {record.followUps.map((item, index) => (
                  <p
                    key={index}
                    className="mt-3 border-t border-border pt-3 text-xs leading-6"
                  >
                    {assistanceDate(item.date)} / {item.type} / {item.result}
                  </p>
                ))}
              </section>
            )}
            {record.outcome && (
              <section className={`${panel} p-5`}>
                <h2 className="text-base font-semibold">Employment Outcome</h2>
                <p className="mt-3 font-medium">
                  {outcomeOptions[record.outcome]}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recorded {assistanceDate(record.outcomeAt)}
                </p>
                {record.outcome !== "hired" && (
                  <>
                    <p className="mt-3 text-sm leading-7">
                      Continue support through relevant opportunities, skill
                      development or another review when appropriate.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        to={`/peso/jobseekers/${record.jobseekerId}`}
                        variant="secondary"
                        className="text-xs"
                      >
                        Review Skill Gaps &amp; Other Jobs
                      </Button>
                      <Button
                        to="/peso/assistance?tab=active"
                        variant="text"
                        className="text-xs"
                      >
                        Continue PESO Assistance
                      </Button>
                    </div>
                  </>
                )}
              </section>
            )}
            <StaffTrainingRecommendations record={record} />
          </div>
          <aside className="space-y-5">
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Request Information</h2>
              <dl className="mt-4 space-y-4 text-sm">
                {[
                  ["Requested", assistanceDate(record.requestedAt)],
                  ["Assigned to", staffName(record.assignedStaffId)],
                  ["Latest update", record.latestUpdate],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 leading-7">{value}</dd>
                  </div>
                ))}
              </dl>
              {can("assign_staff") && (
                <Button
                  onClick={() => setAction("assignStaff")}
                  variant="text"
                  className="mt-3 !px-0 text-xs"
                >
                  Reassign Staff
                </Button>
              )}
            </section>
            <StaffSelectedJob record={record} />
          </aside>
        </div>
        <div className="mt-5">
          <StaffAssistanceTimeline record={record} />
        </div>
      </StaffLoadState>
      {action && (
        <StaffWorkflowDialog
          key={`${id}:${action}`}
          action={action}
          record={record}
          onClose={() => setAction(null)}
        />
      )}
    </>
  )
}
export function PublicAssistancePreview() {
  const { id } = useParams(),
    { state } = useStaff(),
    source = state.records.find((item) => item.id === id)
  if (!source)
    return (
      <EmptyState
        heading="h1"
        title="Assistance request not found"
        description="Choose a sample request from the queue."
      />
    )
  const record = toPublicAssistance(source)
  return (
    <>
      <StaffBack to={`/peso/assistance/${id}`}>Back to Staff Review</StaffBack>
      <PageHeading
        title="Jobseeker Update Preview"
        description="Only public fields are shown here. Internal notes and staff activity are excluded."
      />
      <section className={`${panel} max-w-4xl p-6`}>
        <h2 className="text-xl font-semibold">{record.jobTitle}</h2>
        <p className="my-3 text-sm text-muted-foreground">
          {record.reference} / {record.employer}
        </p>
        <AssistanceStatusBadge status={record.status} />
        <h3 className="mt-6 font-semibold">Your Next Step</h3>
        <p className="mt-2 text-sm leading-7">
          {record.action?.message || record.nextStep}
        </p>
        {record.outcome && (
          <p className="mt-4 text-sm font-medium">
            Outcome: {outcomeOptions[record.outcome]}
          </p>
        )}
        <h3 className="mt-6 font-semibold">Status Timeline</h3>
        <AssistanceTimeline record={record} />
        <h3 className="mt-6 font-semibold">Latest Updates</h3>
        <ol className="mt-4 divide-y divide-border">
          {[...record.publicUpdates].reverse().map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-xs text-muted-foreground">
                {assistanceDate(item.date)}
              </p>
              <p className="mt-1 text-sm leading-7">{item.message}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
