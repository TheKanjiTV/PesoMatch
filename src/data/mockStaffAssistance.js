import { mockAssistance } from "./mockAssistance.js"
import { mockJobseekers } from "./mockJobseekers.js"
export const mockStaffAssistance = mockAssistance.map((source, index) => {
  const seeker = mockJobseekers[index % mockJobseekers.length]
  return {
    ...source,
    readOnly: false,
    version: 1,
    jobseekerId: seeker.id,
    jobseekerName: seeker.name,
    assignedStaffId: index % 3 === 0 ? "staff-luis" : "staff-maria",
    publicUpdates: source.timeline
      .filter((step) => step.current || step.completed)
      .map((step, n) => ({
        id: `${source.id}-public-${n}`,
        date: step.date,
        status: step.status,
        message: step.description,
      })),
    internalActivity: [
      {
        id: `${source.id}-seed`,
        date: source.updatedAt,
        staffId: "staff-maria",
        action: "sample_record_loaded",
        note: "Fictional record prepared for the staff workflow prototype.",
      },
    ],
    coordination: [],
    followUps: [],
    trainingRecommendations: [],
    referral: [
      "referred",
      "employer_coordination",
      "follow_up",
      "outcome_recorded",
    ].includes(source.status)
      ? {
          reference: `REF-${source.id}`,
          date: source.updatedAt,
          staffId: "staff-maria",
        }
      : null,
  }
})
