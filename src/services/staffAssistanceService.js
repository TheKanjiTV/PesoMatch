import { mockStaffAssistance } from "../data/mockStaffAssistance.js"
import { mockStaff } from "../data/mockStaff.js"
import { mockAuditLog } from "../data/mockAuditLog.js"
import { mockJobs } from "../data/mockJobs.js"
import { mockTrainings } from "../data/mockTrainings.js"
import {
  assistanceStatuses,
  assistanceSteps,
} from "../data/assistanceStatuses.js"
import { readDemo, writeDemo } from "./demoStore.js"
import { requirePermission } from "./staffPermissions.js"

// FUTURE LARAVEL API (no endpoints or network calls in this prototype):
// GET /api/peso/assistance; GET /api/peso/assistance/{id}
// PATCH /api/peso/assistance/{id}/start-review
// POST /api/peso/assistance/{id}/request-update
// POST /api/peso/assistance/{id}/referral
// POST /api/peso/assistance/{id}/coordination
// POST /api/peso/assistance/{id}/follow-up
// POST /api/peso/assistance/{id}/outcome
// PATCH /api/peso/assistance/{id}/assignment
// Future ownership, role enforcement, audit immutability and public-field serialization belong on Laravel.
const clone = (value) => structuredClone(value)
const now = () => new Date().toISOString()
const uid = () => crypto.randomUUID()
export const outcomeOptions = {
  hired: "Hired",
  not_hired: "Not Hired",
  under_evaluation: "Still Under Evaluation",
  withdrawn: "Applicant Withdrew",
  opportunity_closed: "Opportunity Closed",
  referred_to_another_opportunity: "Referred to Another Opportunity",
  needs_training: "Additional Training Recommended",
  ongoing_assistance: "Ongoing PESO Assistance",
}
export const workflowActions = {
  request_received: ["startReview"],
  peso_review: [
    "requestJobseekerUpdate",
    "createReferral",
    "recommendTraining",
    "closeRequest",
  ],
  action_required: ["startReview", "recommendTraining", "closeRequest"],
  referred: ["recordEmployerCoordination"],
  employer_coordination: [
    "recordEmployerCoordination",
    "addFollowUp",
    "recordEmployerUpdate",
    "recommendTraining",
    "recordOutcome",
  ],
  follow_up: [
    "recordEmployerCoordination",
    "addFollowUp",
    "recordEmployerUpdate",
    "recommendTraining",
    "recordOutcome",
  ],
  outcome_recorded: ["recommendTraining"],
}
export function initialStaffState() {
  return {
    version: 1,
    records: clone(mockStaffAssistance),
    audit: clone(mockAuditLog),
    notifications: [
      {
        id: "notice-request",
        title: "New assistance request",
        reference: "PESO-DEMO-005",
        read: false,
      },
      {
        id: "notice-update",
        title: "Profile update requested — review before resuming",
        reference: "PESO-DEMO-002",
        read: false,
      },
      {
        id: "notice-follow",
        title: "Referral requires follow-up",
        reference: "PESO-DEMO-006",
        read: false,
      },
      {
        id: "notice-employer",
        title: "Employer coordination awaiting follow-up",
        reference: "PESO-DEMO-001",
        read: true,
      },
      {
        id: "notice-outcome",
        title: "Employer update awaiting review",
        reference: "PESO-DEMO-007",
        read: true,
      },
    ],
  }
}
export function loadStaffState(accountId) {
  const stored = readDemo(accountId, "staff-workspace", {})
  return stored.version === 1 &&
    Array.isArray(stored.records) &&
    Array.isArray(stored.audit) &&
    Array.isArray(stored.notifications)
    ? stored
    : initialStaffState()
}
// Explicit public allowlist: never spread a staff record into a jobseeker response.
export function toPublicAssistance(record) {
  const updates = record.publicUpdates
  return {
    id: record.id,
    reference: record.reference,
    jobId: record.jobId,
    jobTitle: record.jobTitle,
    employer: record.employer,
    location: record.location,
    employmentType: record.employmentType,
    workArrangement: record.workArrangement,
    requestedAt: record.requestedAt,
    updatedAt: record.updatedAt,
    status: record.status,
    outcome: record.outcome,
    outcomeAt: record.outcomeAt,
    office: record.office,
    latestUpdate: updates.at(-1)?.message || record.latestUpdate,
    nextStep: record.nextStep,
    action: record.action
      ? { type: record.action.type, message: record.action.message }
      : null,
    employerFeedback: record.employerFeedback
      ? {
          status: record.employerFeedback.status,
          message: record.employerFeedback.message,
          date: record.employerFeedback.date,
        }
      : null,
    trainingIds: record.trainingIds || [],
    skillsToImprove: record.skillsToImprove || [],
    suggestedJobId: record.suggestedJobId,
    timeline: assistanceSteps
      .map((status, index) => {
        const at = assistanceSteps.indexOf(
          record.status === "action_required" ? "peso_review" : record.status,
        )
        const update = updates.findLast((item) => item.status === status)
        return {
          status,
          date: update?.date || null,
          description:
            update?.message || assistanceStatuses[status].description,
          current: record.status !== "action_required" && index === at,
          completed: !!update && index < at,
          skipped:
            record.status === "outcome_recorded" && index < at && !update,
        }
      })
      .flatMap((step) =>
        step.status === "peso_review" && record.status === "action_required"
          ? [
              step,
              {
                status: "action_required",
                current: true,
                date: record.updatedAt,
                description: record.action?.message,
              },
            ]
          : [step],
      ),
    publicUpdates: updates.map(({ id, date, status, message }) => ({
      id,
      date,
      status,
      message,
    })),
    isSample: true,
    readOnly: true,
  }
}
export function saveStaffState(accountId, state) {
  writeDemo(accountId, "staff-workspace", state)
  writeDemo(
    accountId,
    "staff-public-assistance",
    state.records.map(toPublicAssistance),
  )
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent("pesomatch:staff-demo-updated"))
  return state
}
export const getAssistanceById = (state, id) =>
  clone(state.records.find((record) => record.id === id) || null)
export function getAssistanceQueue(state, filters = {}) {
  const q = (filters.search || "").trim().toLowerCase()
  return clone(
    state.records.filter((record) => {
      const active = record.status !== "outcome_recorded"
      return (
        `${record.jobseekerName} ${record.reference} ${record.jobTitle} ${record.employer}`
          .toLowerCase()
          .includes(q) &&
        (!filters.status || record.status === filters.status) &&
        (!filters.staff || record.assignedStaffId === filters.staff) &&
        (!filters.job || record.jobId === filters.job) &&
        (!filters.employer || record.employer === filters.employer) &&
        (!filters.from || record.requestedAt.slice(0, 10) >= filters.from) &&
        (!filters.to || record.requestedAt.slice(0, 10) <= filters.to) &&
        (!filters.tab ||
          filters.tab === "all" ||
          (filters.tab === "review" &&
            ["request_received", "peso_review"].includes(record.status)) ||
          (filters.tab === "active" && active) ||
          (filters.tab === "action" && record.status === "action_required") ||
          (filters.tab === "completed" && !active))
      )
    }),
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
function text(value, label, required = true) {
  const result = String(value || "").trim()
  if (required && !result) throw new Error(`${label} is required.`)
  if (result.length > 1000)
    throw new Error(`${label} must be 1,000 characters or fewer.`)
  return result
}
function date(value, label) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value || "") ||
    Number.isNaN(Date.parse(value))
  )
    throw new Error(`${label} is required.`)
  return value
}
function choice(value, options, label) {
  if (!options.includes(value)) throw new Error(`Choose a valid ${label}.`)
  return value
}
export function applyStaffAction(state, actor, id, action, payload = {}) {
  requirePermission(
    actor,
    action === "assignStaff"
      ? "assign_staff"
      : action === "recordOutcome"
        ? "record_outcomes"
        : "process_referrals",
  )
  const next = clone(state),
    record = next.records.find((item) => item.id === id)
  if (!record) throw new Error("This assistance record is not available.")
  if (payload.version !== undefined && payload.version !== record.version)
    throw new Error(
      "This record changed. Close this panel and review the latest update before trying again.",
    )
  if (
    action !== "assignStaff" &&
    !workflowActions[record.status]?.includes(action)
  )
    throw new Error(
      "This action is not available at the current assistance stage.",
    )
  const before = record.status,
    timestamp = now()
  if (
    payload.date &&
    [
      "recordEmployerCoordination",
      "addFollowUp",
      "recordOutcome",
      "closeRequest",
    ].includes(action) &&
    payload.date < record.requestedAt.slice(0, 10)
  )
    throw new Error("The activity date cannot be before the request date.")
  let publicMessage = "",
    message = "",
    internal = text(payload.internalNote, "Internal note", false)
  const transition = (status) => {
    record.status = status
    record.nextStep = assistanceStatuses[status].nextStep
  }
  switch (action) {
    case "startReview":
      transition("peso_review")
      record.action = null
      publicMessage = "PESO review started in this sample journey."
      message = "Review started."
      break
    case "requestJobseekerUpdate": {
      const category = choice(
        payload.category,
        [
          "Contact Information",
          "Resume / Profile",
          "Work Experience",
          "Skills",
          "Education",
          "Other",
        ],
        "update category",
      )
      publicMessage =
        text(payload.publicUpdate, "Jobseeker-visible message") ||
        `Please update your ${category.toLowerCase()}.`
      record.action = { type: category, message: publicMessage }
      transition("action_required")
      message = "Jobseeker update requested."
      break
    }
    case "createReferral":
      if (!payload.confirmed)
        throw new Error(
          "Confirm that the profile, contact and opportunity have been reviewed.",
        )
      record.referral = {
        reference: `REF-${record.id}`,
        date: timestamp,
        staffId: actor.id,
      }
      transition("referred")
      publicMessage =
        "Referral prepared for the selected opportunity in this sample journey."
      message = "Referral created."
      break
    case "recordEmployerCoordination": {
      const entry = {
        date: date(payload.date, "Coordination date"),
        method: choice(
          payload.method,
          ["Phone", "Email", "In Person", "Other"],
          "coordination method",
        ),
        contactPerson: text(payload.contactPerson, "Contact person", false),
        updateType: choice(
          payload.updateType,
          [
            "Referral acknowledged",
            "Interview requested",
            "Additional information requested",
            "Waiting for employer response",
            "Employer decision received",
          ],
          "update type",
        ),
        internalNote: internal,
      }
      publicMessage = text(payload.publicUpdate, "Jobseeker-visible update")
      if (payload.nextFollowUp) {
        date(payload.nextFollowUp, "Next follow-up date")
        if (payload.nextFollowUp < payload.date)
          throw new Error(
            "Next follow-up cannot be before the coordination date.",
          )
      }
      record.coordination.push(entry)
      record.nextFollowUp = payload.nextFollowUp || null
      transition("employer_coordination")
      message = "Employer coordination recorded."
      break
    }
    case "addFollowUp": {
      const entry = {
        date: date(payload.date, "Follow-up date"),
        type: choice(
          payload.method,
          ["Phone", "Email", "In Person", "Other"],
          "follow-up type",
        ),
        result: text(payload.result, "Follow-up result"),
        nextFollowUp: payload.nextFollowUp
          ? date(payload.nextFollowUp, "Next follow-up date")
          : null,
        internalNote: internal,
      }
      if (entry.nextFollowUp && entry.nextFollowUp < entry.date)
        throw new Error("Next follow-up cannot be before the follow-up date.")
      publicMessage = text(payload.publicUpdate, "Jobseeker-visible update")
      record.followUps.push(entry)
      record.nextFollowUp = entry.nextFollowUp
      transition("follow_up")
      message = "Follow-up added."
      break
    }
    case "recordEmployerUpdate": {
      const status = choice(
        payload.employerStatus,
        [
          "For Interview",
          "For Further Evaluation",
          "Additional Information Requested",
          "Awaiting Employer Response",
        ],
        "employer response",
      )
      if (payload.interviewDate) date(payload.interviewDate, "Interview date")
      publicMessage = text(
        payload.publicUpdate,
        "Jobseeker-visible instructions",
      )
      record.employerFeedback = {
        status,
        date: timestamp,
        message: publicMessage,
      }
      record.interview =
        status === "For Interview"
          ? {
              date: payload.interviewDate || "",
              time: payload.interviewTime || "",
              location: text(
                payload.interviewLocation,
                "Interview location / mode",
                false,
              ),
            }
          : null
      if (record.interview?.date)
        record.employerFeedback.message += ` Interview: ${record.interview.date}${
          record.interview.time ? " at " + record.interview.time : ""
        }${
          record.interview.location ? " / " + record.interview.location : ""
        }. Sample only.`
      publicMessage = record.employerFeedback.message
      message = "Employer update recorded."
      break
    }
    case "recommendTraining": {
      const training = mockTrainings.find(
        (item) => item.id === payload.trainingId,
      )
      if (!training || !training.jobIds.includes(record.jobId))
        throw new Error(
          "Select training related to this opportunity and its skills.",
        )
      const reason = text(payload.reason, "Recommendation reason")
      if (
        record.trainingRecommendations.some(
          (item) => item.trainingId === training.id,
        )
      )
        throw new Error(
          "This training has already been recommended for this request.",
        )
      record.trainingRecommendations.push({
        trainingId: training.id,
        reason,
        date: timestamp,
        staffId: actor.id,
      })
      record.trainingIds = [
        ...new Set([...(record.trainingIds || []), training.id]),
      ]
      record.skillsToImprove = [
        ...new Set([
          ...(record.skillsToImprove || []),
          ...training.skillsAddressed,
        ]),
      ]
      publicMessage = `Training recommended: ${training.title}. ${reason} This does not enroll you.`
      message = "Training recommendation recorded."
      break
    }
    case "recordOutcome":
    case "closeRequest": {
      if (!payload.confirmed)
        throw new Error("Confirm the recorded outcome before saving.")
      const allowed =
        action === "closeRequest"
          ? ["withdrawn", "opportunity_closed"]
          : Object.keys(outcomeOptions)
      const outcome = choice(payload.outcome, allowed, "outcome")
      const outcomeDate = date(payload.date, "Outcome date")
      if (outcomeDate < record.requestedAt.slice(0, 10))
        throw new Error("Outcome date cannot be before the request date.")
      publicMessage = text(
        payload.publicUpdate,
        "Jobseeker-visible outcome update",
      )
      if (outcome === "needs_training") {
        const training = mockTrainings.find(
          (item) =>
            item.id === payload.trainingId &&
            item.jobIds.includes(record.jobId),
        )
        if (!training)
          throw new Error("Choose relevant training for this outcome.")
        record.trainingIds = [
          ...new Set([...(record.trainingIds || []), training.id]),
        ]
        record.skillsToImprove = training.skillsAddressed
        if (
          !record.trainingRecommendations.some(
            (item) => item.trainingId === training.id,
          )
        )
          record.trainingRecommendations.push({
            trainingId: training.id,
            reason: publicMessage,
            date: timestamp,
            staffId: actor.id,
          })
      }
      if (outcome === "referred_to_another_opportunity") {
        if (
          !mockJobs.some(
            (job) =>
              job.id === payload.suggestedJobId && job.id !== record.jobId,
          )
        )
          throw new Error("Choose another opportunity.")
        record.suggestedJobId = payload.suggestedJobId
      }
      if (payload.startDate) {
        date(payload.startDate, "Start date")
        if (payload.startDate < outcomeDate)
          throw new Error("Start date cannot be before the outcome date.")
      }
      if (payload.reason)
        choice(
          payload.reason,
          [
            "Employer selected another candidate",
            "Qualifications mismatch",
            "Position filled",
            "Other",
          ],
          "broad reason",
        )
      record.outcome = outcome
      record.outcomeAt = outcomeDate
      record.startDate = payload.startDate || null
      record.outcomeReason = payload.reason || null
      transition(
        ["ongoing_assistance", "under_evaluation"].includes(outcome)
          ? "follow_up"
          : "outcome_recorded",
      )
      if (["hired", "not_hired", "under_evaluation"].includes(outcome))
        record.employerFeedback = {
          status: outcomeOptions[outcome],
          message: publicMessage,
          date: outcomeDate,
        }
      message = "Employment outcome recorded."
      break
    }
    case "assignStaff": {
      const member = mockStaff.find(
        (person) => person.id === payload.staffId && person.active,
      )
      if (!member) throw new Error("Choose an active staff member.")
      if (!payload.confirmed) throw new Error("Confirm the staff assignment.")
      if (member.id === record.assignedStaffId)
        throw new Error("This staff member is already assigned.")
      record.assignedStaffId = member.id
      message = "Staff assignment updated."
      break
    }
    default:
      throw new Error("Unknown workflow action.")
  }
  record.version += 1
  record.updatedAt = timestamp
  record.internalActivity.push({
    id: uid(),
    date: timestamp,
    staffId: actor.id,
    action,
    note: internal || message,
  })
  if (publicMessage) {
    record.publicUpdates.push({
      id: uid(),
      date: timestamp,
      status: record.status,
      message: publicMessage,
    })
    record.latestUpdate = publicMessage
  }
  next.audit.unshift({
    id: uid(),
    date: timestamp,
    staffId: actor.id,
    action: message,
    recordType: "Assistance",
    reference: record.id,
    summary:
      before === record.status
        ? message
        : `${assistanceStatuses[before].label} → ${assistanceStatuses[record.status].label}`,
  })
  next.notifications.unshift({
    id: uid(),
    title: message,
    reference: record.id,
    read: false,
  })
  return { state: next, record, message }
}
export const startReview = (s, a, id, p) =>
  applyStaffAction(s, a, id, "startReview", p)
export const requestJobseekerUpdate = (s, a, id, p) =>
  applyStaffAction(s, a, id, "requestJobseekerUpdate", p)
export const createReferral = (s, a, id, p) =>
  applyStaffAction(s, a, id, "createReferral", p)
export const recordEmployerCoordination = (s, a, id, p) =>
  applyStaffAction(s, a, id, "recordEmployerCoordination", p)
export const addFollowUp = (s, a, id, p) =>
  applyStaffAction(s, a, id, "addFollowUp", p)
export const recordEmployerUpdate = (s, a, id, p) =>
  applyStaffAction(s, a, id, "recordEmployerUpdate", p)
export const recommendTraining = (s, a, id, trainingId, reason) =>
  applyStaffAction(s, a, id, "recommendTraining", { trainingId, reason })
export const recordOutcome = (s, a, id, p) =>
  applyStaffAction(s, a, id, "recordOutcome", p)
export const assignStaff = (s, a, id, staffId) =>
  applyStaffAction(s, a, id, "assignStaff", { staffId, confirmed: true })
