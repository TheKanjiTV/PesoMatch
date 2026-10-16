import { test, expect } from "@playwright/test"

import {
  getJobs,
  getRecommendedJobs,
  getJobById,
  searchJobs,
  saveJob,
  unsaveJob,
} from "../src/services/jobsService.js"

test("mock discovery searches all fields and combines filters without calculating scores", () => {
  const jobs = getJobs()

  for (const q of [
    "CUSTOMER",
    "Mindoro Connect",
    "Microsoft Excel",
    "Bongabong",
  ])
    expect(searchJobs(jobs, { q }).length).toBeGreaterThan(0)

  const exact = searchJobs(jobs, {
    category: "Sales / Retail",
    location: "Roxas",
    employmentType: "Full-time",
    experienceLevel: "No experience required",
    educationLevel: "Senior High School",
    workArrangement: "On-site",
    matchLabel: "Potential Match",
  })

  expect(exact.map((job) => job.id)).toEqual(["sales"])

  expect(searchJobs(jobs, { employmentType: "Temporary" })).toEqual([])

  const newest = searchJobs(jobs, {}, "newest").map((job) => job.postedAt)

  expect(newest).toEqual([...newest].sort().reverse())

  const scores = searchJobs(jobs, {}, "match").map((job) => job.matchScore)

  expect(scores).toEqual([...scores].sort((a, b) => b - a))

  for (const job of jobs) {
    expect(job.isSample).toBe(true)

    expect(job.company).toMatch(/^Sample /)

    expect(job.matchLabel).toBe(
      job.matchScore >= 85
        ? "Strong Match"
        : job.matchScore >= 70
          ? "Potential Match"
          : "Possible Match",
    )

    expect(job.requiredSkills.length).toBeGreaterThan(0)
  }

  expect(getRecommendedJobs().map((job) => job.id)).toEqual([
    "customer-service",
    "administrative",
    "data-entry",
    "sales",
    "it-support",
    "front-desk",
  ])

  const changed = getJobById("customer-service")

  changed.matchScore = 0

  expect(getJobById("customer-service").matchScore).toBe(86)

  expect(getJobById("missing")).toBeNull()
})

test("save services preserve session state and Undo when browser storage is unavailable", () => {
  const previous = globalThis.localStorage

  globalThis.localStorage = {
    getItem() {
      throw new Error("Storage blocked")
    },
    setItem() {
      throw new Error("Storage blocked")
    },
  }

  try {
    const first = saveJob("customer-service", 1, [])

    const second = saveJob("administrative", 1, first)

    expect(second).toEqual(["customer-service", "administrative"])

    const removed = unsaveJob("customer-service", 1, second)

    expect(removed).toEqual(["administrative"])

    expect(saveJob("customer-service", 1, removed)).toEqual([
      "administrative",
      "customer-service",
    ])

    expect(saveJob("missing", 1, second)).toEqual(second)
  } finally {
    globalThis.localStorage = previous
  }
})
