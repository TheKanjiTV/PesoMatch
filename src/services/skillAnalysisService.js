import { skillAnalyses } from "../data/skillAnalysis.js"
import { getTrainings } from "./trainingService.js"

// FUTURE LARAVEL API: GET /api/jobseeker/skill-gaps
// GET /api/jobs/{job}/skill-analysis
// React displays stored sample results; it never performs AI scoring.
export const getSkillAnalysis = (jobId) =>
  structuredClone(skillAnalyses.find((item) => item.jobId === jobId) || null)
export function getUserSkillOverview() {
  const rows = skillAnalyses.flatMap((item) => [
    ...item.requiredSkills,
    ...item.preferredSkills,
  ])
  const unique = new Map()
  rows.forEach((row) => {
    const current = unique.get(row.skill)
    if (
      !current ||
      (current.status === "optional" && row.status !== "optional")
    )
      unique.set(row.skill, row)
  })
  return structuredClone([...unique.values()])
}
export const getSkillTraining = (skill) =>
  getTrainings().filter((item) => item.skillsAddressed.includes(skill))
