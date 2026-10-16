import { mockJobs } from "../data/mockJobs.js"
import {
  assistanceStatuses,
  assistanceOutcomes,
  assistanceSteps,
  mockAssistance,
} from "../data/mockAssistance.js"
import { readDemo, writeDemo } from "./demoStore.js"

// FUTURE LARAVEL API
// GET /api/jobseeker/assistance
// GET /api/jobseeker/assistance/{id}
// POST /api/jobs/{job}/assistance
// PATCH /api/jobseeker/assistance/{id}/withdraw
// No network request, staff workflow, or employer decision is implemented here.
const clone = (value) => structuredClone(value)
const today = () => new Date().toISOString()
const codeFor = (value, choices, fallback) =>
  Object.keys(choices).find(
    (key) => key === value || (choices[key].label || choices[key]) === value,
  ) || fallback
export const isActiveAssistance = (record) =>
  record.status !== "outcome_recorded" ||
  record.outcome === "ongoing_assistance"
export const assistancePath = (record) =>
  `/jobseeker/assistance/${encodeURIComponent(record.id)}${
    record.readOnly ? "?example=1" : ""
  }`
export function safeAssistanceReturn(value) {
  return typeof value === "string" &&
    /^\/jobseeker\/assistance\/[A-Za-z0-9_-]+(?:\?example=1)?$/.test(value)
    ? value
    : null
}

export function normalizeAssistance(records = []) {
  return records
    .filter(
      (record) => record && mockJobs.some((job) => job.id === record.jobId),
    )
    .map((record, index) => {
      const job = mockJobs.find((item) => item.id === record.jobId)
      const outcome = codeFor(record.outcome, assistanceOutcomes, null)
      const status =
        outcome === "ongoing_assistance"
          ? "follow_up"
          : codeFor(record.status, assistanceStatuses, "request_received")
      const id = String(
        record.id || record.reference || `PESO-LEGACY-${index + 1}`,
      ).replace(/[^A-Za-z0-9_-]/g, "-")
      const requestedAt =
        record.requestedAt || record.date || record.dateReferred || "2026-10-04"
      const at = assistanceSteps.indexOf(
        status === "action_required" ? "peso_review" : status,
      )
      return {
        ...record,
        id,
        reference: record.reference || id,
        jobTitle: record.jobTitle || record.title || job.title,
        employer: record.employer || job.company,
        location: record.location || job.location,
        employmentType: record.employmentType || job.employmentType,
        workArrangement: record.workArrangement || job.workArrangement,
        status,
        outcome,
        outcomeAt: outcome
          ? record.outcomeAt || record.updatedAt || requestedAt
          : null,
        requestedAt,
        updatedAt: record.updatedAt || record.lastUpdate || requestedAt,
        latestUpdate:
          record.latestUpdate || assistanceStatuses[status].description,
        nextStep: record.nextStep || assistanceStatuses[status].nextStep,
        office: record.office || "Sample PESO Bansud",
        employerFeedback: record.employerFeedback || {
          status: "Awaiting employer update",
          message: "No employer feedback has been recorded in this prototype.",
        },
        isSample: true,
        readOnly: !!record.readOnly,
        timeline:
          record.timeline ||
          assistanceSteps.map((stage, step) => ({
            status: stage,
            date: step === 0 ? requestedAt : null,
            completed: step < at,
            current: step === at,
            description: assistanceStatuses[stage].description,
          })),
      }
    })
}
export const getAssistanceRequests = (userId) =>
  clone(normalizeAssistance(readDemo(userId, "assistance")))
export const getSampleAssistance = (userId) => {
  const published = readDemo(userId, "staff-public-assistance")
  return clone(mockAssistance.map(record => published.find(item => item.id === record.id) || record))
}
export const getActiveAssistance = (
  userId,
  records = getAssistanceRequests(userId),
) => clone(records.filter(isActiveAssistance))
export const getAssistanceHistory = (
  userId,
  records = getAssistanceRequests(userId),
) => clone(records.filter((item) => !isActiveAssistance(item)))
export const getAssistanceById = (
  id,
  userId,
  records = getAssistanceRequests(userId),
) => clone(records.find((item) => item.id === id) || null)
export const getAssistanceForJob = (
  jobId,
  userId,
  records = getAssistanceRequests(userId),
) =>
  clone(
    records.find((item) => item.jobId === jobId && isActiveAssistance(item)) ||
      null,
  )

export function requestAssistance(
  jobId,
  userId,
  records = getAssistanceRequests(userId),
  notes = "",
) {
  const current = normalizeAssistance(records)
  const existing = getAssistanceForJob(jobId, userId, current)
  if (existing) return { records: current, record: existing, created: false }
  const job = mockJobs.find((item) => item.id === jobId)
  if (!job)
    throw new Error(
      "This opportunity is no longer available. Please choose another job.",
    )
  const date = today(),
    id = `PESO-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const record = normalizeAssistance([
    {
      id,
      reference: id,
      jobId,
      requestedAt: date,
      updatedAt: date,
      status: "request_received",
      notes: String(notes).trim().slice(0, 500),
    },
  ])[0]
  const next = [...current, record]
  writeDemo(userId, "assistance", next)
  return { records: next, record, created: true }
}
export function withdrawAssistance(
  id,
  userId,
  records = getAssistanceRequests(userId),
) {
  const current = normalizeAssistance(records),
    before = current.find((item) => item.id === id)
  if (
    !before ||
    before.readOnly ||
    !isActiveAssistance(before) ||
    before.status === "outcome_recorded"
  )
    throw new Error("This request can no longer be withdrawn.")
  const date = today()
  const record = {
    ...before,
    status: "outcome_recorded",
    outcome: "withdrawn",
    outcomeAt: date,
    updatedAt: date,
    withdrawalReason: "User withdrew request",
    latestUpdate: "You withdrew this assistance request in the prototype.",
    nextStep:
      "Explore other opportunities or request assistance again when you are ready.",
    timeline: [
      ...before.timeline
        .filter((item) => item.status !== "outcome_recorded")
        .map((item) => ({
          ...item,
          completed: item.completed || item.current,
          current: false,
          skipped: !item.completed && !item.current,
        })),
      {
        status: "outcome_recorded",
        date,
        current: true,
        completed: false,
        description: "Request withdrawn by the jobseeker in this prototype.",
      },
    ],
  }
  const next = current.map((item) => (item.id === id ? record : item))
  writeDemo(userId, "assistance", next)
  return { records: next, record, before: clone(before) }
}
export function restoreAssistance(
  before,
  userId,
  records = getAssistanceRequests(userId),
) {
  const current = normalizeAssistance(records),
    record = current.find((item) => item.id === before.id)
  if (!record || record.readOnly || record.outcome !== "withdrawn")
    throw new Error("This withdrawal can no longer be undone.")
  if (
    current.some(
      (item) =>
        item.id !== before.id &&
        item.jobId === before.jobId &&
        isActiveAssistance(item),
    )
  )
    throw new Error(
      "Another active request already exists for this job. Open its status instead.",
    )
  const next = current.map((item) =>
    item.id === before.id ? clone(before) : item,
  )
  writeDemo(userId, "assistance", next)
  return { records: next, record: clone(before) }
}

export function getProfileReadiness(data) {
  const personal = data?.personal || {}
  return [
    {
      label: "Personal Information",
      ready: !!(
        personal.first_name &&
        personal.last_name &&
        personal.birth_date
      ),
      step: 1,
    },
    {
      label: "Education",
      ready: !!data?.education?.highest_attainment,
      step: 2,
    },
    { label: "Skills", ready: !!data?.skills?.skills?.length, step: 3 },
    {
      label: "Job Preferences",
      ready: !!data?.preferences?.occupations?.length,
      step: 5,
    },
    {
      label: "Contact Information",
      ready: /^\+639\d{9}$/.test(personal.mobile_number || ""),
      step: 1,
    },
  ]
}
export function assistanceNotification(record, kind = "request") {
  const title =
    kind === "withdraw"
      ? "Assistance request withdrawn"
      : kind === "restore"
        ? "Assistance request restored"
        : "Assistance request received"
  return {
    id: `assistance:${crypto.randomUUID()}`,
    type: "referral",
    title,
    message: `${record.jobTitle} / ${record.reference}. Recorded in this prototype only.`,
    time: "Just now",
    createdAt: today(),
    read: false,
    to: assistancePath(record),
  }
}
