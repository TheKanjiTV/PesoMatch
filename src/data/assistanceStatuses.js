export const assistanceStatuses = {
  request_received: {
    label: "Request Received",

    description:
      "Your employment assistance request has been recorded in this prototype.",

    nextStep:
      "No action is required right now. PESO would review your request when the service is connected.",
  },

  peso_review: {
    label: "Under PESO Review",

    description:
      "PESO is reviewing the profile and selected opportunity in this sample journey.",

    nextStep:
      "Keep your profile and contact information updated while PESO reviews your request.",
  },

  referred: {
    label: "Referred",

    description:
      "Referral information has been prepared for the selected employment opportunity in this sample journey.",

    nextStep: "Watch for updates regarding employer coordination.",
  },

  employer_coordination: {
    label: "Employer Coordination",

    description:
      "PESO is coordinating or awaiting an update from the employer in this sample journey.",

    nextStep:
      "Be ready for possible employer contact or interview instructions.",
  },

  follow_up: {
    label: "Follow-up",

    description: "Additional follow-up or information may be needed.",

    nextStep:
      "Review the latest update and use Messages if you need follow-up support.",
  },

  action_required: {
    label: "Action Required",

    description: "Please update your profile before referral can continue.",

    nextStep: "Please review your contact information and update your profile.",
  },

  outcome_recorded: {
    label: "Outcome Recorded",

    description:
      "An employment outcome has been recorded for this assistance request.",

    nextStep: "Review the recorded outcome and available next steps.",
  },
}

export const assistanceSteps = [
  "request_received",

  "peso_review",

  "referred",

  "employer_coordination",

  "follow_up",

  "outcome_recorded",
]

export const assistanceOutcomes = {
  hired: "Hired",

  not_hired: "Not Hired",

  withdrawn: "Withdrawn",

  needs_training: "Needs Additional Training",

  referred_to_another_opportunity: "Referred to Another Opportunity",

  ongoing_assistance: "Ongoing Assistance",

  under_evaluation: "Still Under Evaluation",

  opportunity_closed: "Opportunity Closed",
}
