import test from "node:test"
import assert from "node:assert/strict"
import {
  getTrainings,
  getRecommendedTrainings,
  getTrainingById,
  searchTrainings,
  getSavedTrainings,
  saveTraining,
  unsaveTraining,
} from "../src/services/trainingService.js"
import {
  getSkillAnalysis,
  getSkillTraining,
  getUserSkillOverview,
} from "../src/services/skillAnalysisService.js"
import { mockJobs } from "../src/data/mockJobs.js"
import { skillStatusLabels } from "../src/data/skillAnalysis.js"
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
}

test("every required skill is represented once with valid training and job relationships", () => {
  const training = getTrainings()
  for (const job of mockJobs) {
    const analysis = getSkillAnalysis(job.id)
    assert.deepEqual(
      analysis.requiredSkills.map((row) => row.skill),
      job.requiredSkills,
    )
    assert.equal(
      new Set(analysis.requiredSkills.map((row) => row.skill)).size,
      job.requiredSkills.length,
    )
    for (const row of [
      ...analysis.requiredSkills,
      ...analysis.preferredSkills,
    ]) {
      assert.ok(skillStatusLabels[row.status])
      assert.ok(row.relatedJobIds.includes(job.id))
      for (const id of row.trainingIds)
        assert.ok(
          training
            .find((item) => item.id === id)
            ?.skillsAddressed.includes(row.skill),
        )
    }
  }
  assert.equal(getSkillAnalysis("missing"), null)
  assert.ok(getUserSkillOverview().some((row) => row.status === "developing"))
})
test("customer service fixture has four strengths and two core development areas", () => {
  const rows = getSkillAnalysis("customer-service").requiredSkills
  assert.equal(rows.length, 6)
  assert.equal(rows.filter((row) => row.status === "matched").length, 4)
  assert.equal(
    rows.find((row) => row.skill === "Microsoft Excel").status,
    "needs_improvement",
  )
  assert.equal(
    rows.find((row) => row.skill === "Basic Reporting").status,
    "not_in_profile",
  )
})
test("training discovery searches skills, providers and titles and combines filters", () => {
  assert.deepEqual(
    searchTrainings({ search: "  EXCEL " }).map((item) => item.id),
    ["excel"],
  )
  assert.equal(
    searchTrainings({ search: "Sample Training Partner" })[0].id,
    "digital",
  )
  assert.deepEqual(
    searchTrainings({ mode: "Online", availability: "Registration Open" }).map(
      (item) => item.id,
    ),
    ["communication"],
  )
  assert.equal(
    searchTrainings({ skill: "Microsoft Excel", job: "customer-service" })
      .length,
    1,
  )
  assert.equal(
    searchTrainings({ skill: "Bookkeeping", mode: "Online" }).length,
    0,
  )
  assert.ok(getRecommendedTrainings().length)
  assert.equal(getSkillTraining("Basic Reporting")[0].id, "excel")
})
test("lookup results cannot mutate the fixtures", () => {
  const item = getTrainingById("excel")
  item.skillsAddressed.push("Changed")
  assert.ok(!getTrainingById("excel").skillsAddressed.includes("Changed"))
  const analysis = getSkillAnalysis("customer-service")
  analysis.requiredSkills[0].status = "not_in_profile"
  assert.equal(
    getSkillAnalysis("customer-service").requiredSkills[0].status,
    "matched",
  )
})
test("training bookmarks persist per account, deduplicate and reject missing IDs", () => {
  assert.deepEqual(saveTraining("excel", "first"), ["excel"])
  assert.deepEqual(saveTraining("excel", "first"), ["excel"])
  assert.equal(getSavedTrainings("second").length, 0)
  assert.deepEqual(saveTraining("missing", "first"), ["excel"])
  assert.equal(getSavedTrainings("first")[0].id, "excel")
  assert.deepEqual(unsaveTraining("excel", "first"), [])
})
test("storage unavailable retains the caller's session state", () => {
  const original = globalThis.localStorage
  globalThis.localStorage = {
    getItem() {
      throw new Error("Unavailable")
    },
    setItem() {
      throw new Error("Unavailable")
    },
  }
  assert.deepEqual(saveTraining("excel", "private", ["digital"]), [
    "digital",
    "excel",
  ])
  assert.equal(getSavedTrainings("private", ["excel"]).length, 1)
  globalThis.localStorage = original
})
