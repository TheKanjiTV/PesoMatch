import { mockJobs } from "./mockJobs.js"

import {
  assistanceStatuses,
  assistanceSteps,
  assistanceOutcomes,
} from "./assistanceStatuses.js"

export {
  assistanceStatuses,
  assistanceSteps,
  assistanceOutcomes,
} from "./assistanceStatuses.js"

function sample(id, jobId, status, extra = {}) {
  const job = mockJobs.find((item) => item.id === jobId)

  const stages =
    status === "action_required"
      ? [
          "request_received",

          "peso_review",

          "action_required",

          "referred",

          "employer_coordination",

          "follow_up",

          "outcome_recorded",
        ]
      : assistanceSteps

  const current = stages.indexOf(status)

  const timeline = stages.map((stage, index) => ({
    status: stage,

    date: index <= current ? `2026-09-${10 + index}` : null,

    completed: index < current,

    current: index === current,

    description: assistanceStatuses[stage].description,
  }))

  return {
    id,

    reference: id,

    jobId,

    jobTitle: job.title,

    employer: job.company,

    location: job.location,

    employmentType: job.employmentType,

    workArrangement: job.workArrangement,

    requestedAt: "2026-09-10",

    updatedAt: `2026-09-${10 + current}`,

    status,

    timeline,

    latestUpdate: assistanceStatuses[status].description,

    nextStep: assistanceStatuses[status].nextStep,

    office: "Sample PESO Bansud",

    employerFeedback: {
      status: "Awaiting employer update",

      message: "No employer feedback is recorded in this sample yet.",
    },

    outcome: null,

    isSample: true,

    readOnly: true,

    ...extra,
  }
}

// Read-only illustrations, separate from requests initiated by the signed-in user.

export const mockAssistance = [
  sample("PESO-DEMO-001", "customer-service", "employer_coordination", {
    latestUpdate:
      "PESO has forwarded the referral information and is awaiting an employer update. Sample only.",
  }),

  sample("PESO-DEMO-002", "administrative", "action_required", {
    action: {
      type: "profile",

      message:
        "Please confirm your mobile number and update your profile before referral can continue.",
    },
  }),

  sample("PESO-DEMO-003", "data-entry", "peso_review"),

  sample("PESO-DEMO-004", "sales", "referred"),

  sample("PESO-DEMO-005", "front-desk", "request_received"),

  sample("PESO-DEMO-006", "records", "follow_up", {
    outcome: "ongoing_assistance",

    outcomeAt: "2026-09-14",

    latestUpdate:
      "Ongoing assistance is recorded. A follow-up update is still awaited.",
  }),

  sample("PESO-DEMO-007", "it-support", "employer_coordination", {
    employerFeedback: {
      status: "For Interview",

      message:
        "Sample employer feedback indicates an interview may be arranged. No interview has been scheduled in this prototype.",

      date: "2026-09-13",
    },
  }),

  sample("PESO-DEMO-008", "service-desk", "outcome_recorded", {
    outcome: "hired",

    outcomeAt: "2026-09-15",

    employerFeedback: {
      status: "Hired",

      message: "A sample employer hiring outcome was recorded.",

      date: "2026-09-15",
    },
  }),

  sample("PESO-DEMO-009", "client-support", "outcome_recorded", {
    outcome: "not_hired",

    outcomeAt: "2026-09-15",

    employerFeedback: {
      status: "Not Hired",

      message:
        "A sample employer outcome was recorded. Other opportunities and continued support remain available.",

      date: "2026-09-15",
    },
  }),

  sample("PESO-DEMO-010", "retail-support", "outcome_recorded", {
    outcome: "withdrawn",

    outcomeAt: "2026-09-15",

    withdrawalReason: "User withdrew request",
  }),

  sample("PESO-DEMO-011", "customer-service", "outcome_recorded", {
    outcome: "needs_training",

    outcomeAt: "2026-09-15",

    trainingIds: ["excel"],

    skillsToImprove: ["Microsoft Excel"],
  }),

  sample("PESO-DEMO-012", "reception", "outcome_recorded", {
    outcome: "referred_to_another_opportunity",

    outcomeAt: "2026-09-15",

    suggestedJobId: "administrative",
  }),
]

export const assistanceExampleNotifications = [
  {
    id: "example-review",

    type: "referral",

    title: "Sample PESO review update",

    message:
      "PESO is reviewing the employment assistance request in this sample journey.",

    to: "/jobseeker/assistance/PESO-DEMO-003?example=1",

    time: "Sample / September 11",

    read: true,
  },

  {
    id: "example-referral",

    type: "referral",

    title: "Sample referral update",

    message: "Referral information was prepared in this sample journey.",

    to: "/jobseeker/assistance/PESO-DEMO-004?example=1",

    time: "Sample / September 12",

    read: true,
  },

  {
    id: "example-coordination",

    type: "referral",

    title: "Sample employer coordination update",

    message:
      "An employer coordination update is available in this sample journey.",

    to: "/jobseeker/assistance/PESO-DEMO-001?example=1",

    time: "Sample / September 13",

    read: true,
  },

  {
    id: "example-outcome",

    type: "referral",

    title: "Sample employment outcome recorded",

    message:
      "Review the recorded outcome and available next steps in this sample journey.",

    to: "/jobseeker/assistance/PESO-DEMO-009?example=1",

    time: "Sample / September 15",

    read: true,
  },
]
