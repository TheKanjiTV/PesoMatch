import { mockJobs, recommendedJobIds } from "../data/mockJobs.js"

import { readDemo, writeDemo } from "./demoStore.js"

// FUTURE LARAVEL API: GET /api/jobs; GET /api/jobs/recommended

// GET /api/jobs/{job}; GET /api/jobs/{job}/match; GET /api/saved-jobs

// POST /api/saved-jobs/{job}; DELETE /api/saved-jobs/{job}

// No network request, scoring engine or employer transaction runs here.

export const getJobs = () => structuredClone(mockJobs)

export const getRecommendedJobs = () =>
  recommendedJobIds.map((id) => getJobById(id)).filter(Boolean)

export const getJobById = (id) => {
  const job = mockJobs.find((job) => job.id === id)

  return job ? structuredClone(job) : null
}

export const getSavedJobs = (userId) =>
  getJobs().filter((job) => readDemo(userId, "saved-jobs").includes(job.id))

export const saveJob = (id, userId, current = readDemo(userId, "saved-jobs")) =>
  writeDemo(userId, "saved-jobs", [
    ...new Set([
      ...current,

      ...(getJobById(id) ? [id] : []),
    ]),
  ])

export const unsaveJob = (
  id,
  userId,
  current = readDemo(userId, "saved-jobs"),
) =>
  writeDemo(
    userId,

    "saved-jobs",

    current.filter((value) => value !== id),
  )

export function searchJobs(jobs, filters = {}, sort = "recommended") {
  const q = (filters.q || "").trim().toLowerCase()

  const results = jobs.filter(
    (job) =>
      `${job.title} ${job.company} ${job.location} ${job.requiredSkills.join(" ")} ${job.preferredSkills.join(" ")}`

        .toLowerCase()

        .includes(q) &&
      [
        "category",

        "location",

        "employmentType",

        "experienceLevel",

        "educationLevel",

        "workArrangement",

        "matchLabel",
      ].every(
        (key) =>
          !filters[key] ||
          (key === "location"
            ? job.location.toLowerCase().includes(filters[key].toLowerCase())
            : job[key] === filters[key]),
      ),
  )

  return results.sort(
    sort === "newest"
      ? (a, b) => b.postedAt.localeCompare(a.postedAt)
      : sort === "match"
        ? (a, b) => b.matchScore - a.matchScore
        : (a, b) => {
            const rank = (id) =>
              recommendedJobIds.includes(id)
                ? recommendedJobIds.indexOf(id)
                : 99

            return rank(a.id) - rank(b.id)
          },
  )
}
