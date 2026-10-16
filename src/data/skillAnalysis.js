import { mockJobs } from "./mockJobs.js"
import { mockTrainings } from "./mockTrainings.js"

export const skillStatusLabels = {
  matched: "Matched",
  developing: "Developing",
  needs_improvement: "Needs Improvement",
  not_in_profile: "Not in Profile",
  optional: "Optional / Preferred",
}

// Predefined demonstration profile. Editing the real profile does not change these results.
const demoLevels = {
  "Customer Service": "Proficient",
  Communication: "Proficient",
  "Microsoft Word": "Proficient",
  "Computer Literacy": "Proficient",
  "Basic Computer Skills": "Proficient",
  "Microsoft Excel": "Basic",
  "Professional Email Writing": "Basic",
}
const storedStatuses = {
  "Needs Improvement": "needs_improvement",
  "Not in Profile": "not_in_profile",
  Developing: "developing",
  Matched: "matched",
}

export const skillAnalyses = mockJobs.map((job) => {
  const record = (skill, preferred = false) => {
    const stored = job.skillStatuses.find((row) => row.skill === skill)
    const status = preferred
      ? "optional"
      : job.id === "administrative" && skill === "Microsoft Word"
        ? "developing"
        : stored
          ? storedStatuses[stored.status]
          : demoLevels[skill] || job.matchedCriteria.includes(skill)
            ? "matched"
            : "not_in_profile"
    return {
      skill,
      status,
      currentLevel:
        demoLevels[skill] || (status === "matched" ? "Proficient" : null),
      requiredLevel:
        job.id === "administrative" && skill === "Microsoft Word"
          ? "Advanced"
          : skill === "Microsoft Excel"
            ? "Intermediate"
            : "Proficient",
      trainingIds: mockTrainings
        .filter((item) => item.skillsAddressed.includes(skill))
        .map((item) => item.id),
      relatedJobIds: mockJobs
        .filter((item) =>
          [...item.requiredSkills, ...item.preferredSkills].includes(skill),
        )
        .map((item) => item.id),
    }
  }
  return {
    jobId: job.id,
    jobTitle: job.title,
    employer: job.company,
    matchScore: job.matchScore,
    requiredSkills: job.requiredSkills.map((skill) => record(skill)),
    preferredSkills: job.preferredSkills
      .filter((skill) => !job.requiredSkills.includes(skill))
      .map((skill) => record(skill, true)),
    isSample: true,
  }
})

export function describeAnalysisSkill(row) {
  return row.status === "matched"
    ? "This skill is listed in the sample profile and aligns with the recorded requirement."
    : row.status === "developing"
      ? "A related or basic skill is recorded. Further practice may strengthen readiness for this role."
      : row.status === "needs_improvement"
        ? "The recorded skill level is below this role's target. Related training may help strengthen it."
        : row.status === "optional"
          ? "A useful preferred skill for this opportunity; it is not a core requirement."
          : "This requirement is not currently recorded in the sample profile. Missing information does not prove a lack of skill."
}
