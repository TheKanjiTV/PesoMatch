import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  requestAssistance,
  withdrawAssistance,
  restoreAssistance,
  getAssistanceRequests,
  getAssistanceById,
  getAssistanceForJob,
  getAssistanceHistory,
  getActiveAssistance,
  getSampleAssistance,
  normalizeAssistance,
  safeAssistanceReturn,
  getProfileReadiness,
  assistancePath,
} from "../src/services/assistanceService.js"
import { mockJobs } from "../src/data/mockJobs.js"
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
}
beforeEach(() => store.clear())

test("requests persist per account and duplicate active requests return the existing reference", () => {
  const first = requestAssistance(
    "customer-service",
    "one",
    undefined,
    " Please advise. ",
  )
  const duplicate = requestAssistance("customer-service", "one")
  assert.equal(first.created, true)
  assert.equal(duplicate.created, false)
  assert.equal(duplicate.record.id, first.record.id)
  assert.equal(duplicate.records.length, 1)
  assert.equal(first.record.notes, "Please advise.")
  assert.equal(getAssistanceRequests("two").length, 0)
  assert.equal(getAssistanceById(first.record.id, "two"), null)
  assert.throws(() => requestAssistance("missing-job", "one"))
})

test("withdrawal skips unreached stages, moves to history, and Undo restores the original timeline", () => {
  const first = requestAssistance("customer-service", "one")
  const withdrawn = withdrawAssistance(first.record.id, "one")
  assert.equal(withdrawn.record.outcome, "withdrawn")
  assert.equal(getActiveAssistance("one").length, 0)
  assert.equal(getAssistanceHistory("one").length, 1)
  assert.equal(
    withdrawn.record.timeline.find((s) => s.status === "referred").skipped,
    true,
  )
  assert.throws(() => withdrawAssistance(first.record.id, "one"))
  const restored = restoreAssistance(withdrawn.before, "one")
  assert.deepEqual(restored.record.timeline, first.record.timeline)
  assert.equal(getActiveAssistance("one").length, 1)
})

test("terminal requests allow a new request, but stale Undo cannot create a duplicate active request", () => {
  const first = requestAssistance("customer-service", "one")
  const withdrawn = withdrawAssistance(first.record.id, "one")
  const next = requestAssistance("customer-service", "one")
  assert.notEqual(next.record.id, first.record.id)
  assert.equal(next.created, true)
  assert.throws(
    () => restoreAssistance(withdrawn.before, "one"),
    /Another active request/,
  )
  assert.equal(
    getAssistanceForJob("customer-service", "one").id,
    next.record.id,
  )
})

test("read-only fixtures cover every stage and outcome without contaminating account requests", () => {
  const samples = getSampleAssistance()
  assert.equal(samples.length, 12)
  assert.equal(
    new Set(samples.filter((s) => s.outcome).map((s) => s.outcome)).size,
    6,
  )
  for (const record of samples) {
    assert.ok(mockJobs.some((job) => job.id === record.jobId))
    assert.equal(record.readOnly, true)
    assert.match(assistancePath(record), /\?example=1$/)
    assert.throws(() => withdrawAssistance(record.id, "one", samples))
  }
  assert.ok(
    getActiveAssistance(null, samples).some(
      (s) => s.outcome === "ongoing_assistance",
    ),
  )
  assert.equal(getAssistanceRequests("one").length, 0)
  samples[0].status = "bad"
  assert.notEqual(getSampleAssistance()[0].status, "bad")
})

test("legacy records normalize safely and profile return links stay inside assistance", () => {
  const [legacy] = normalizeAssistance([
    {
      jobId: "customer-service",
      reference: "PM-OLD",
      status: "Outcome Recorded",
      outcome: "Ongoing Assistance",
    },
  ])
  assert.equal(legacy.status, "follow_up")
  assert.equal(legacy.outcome, "ongoing_assistance")
  assert.equal(legacy.id, "PM-OLD")
  assert.equal(
    safeAssistanceReturn("/jobseeker/assistance/PESO-DEMO-001?example=1"),
    "/jobseeker/assistance/PESO-DEMO-001?example=1",
  )
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/admin",
    "/jobseeker/assistance/../settings",
  ])
    assert.equal(safeAssistanceReturn(path), null)
})

test("profile readiness uses saved onboarding fields, not email verification", () => {
  const profile = {
    personal: {
      first_name: "Test",
      last_name: "User",
      birth_date: "2000-01-02",
      mobile_number: "+639171234567",
    },
    education: { highest_attainment: "College Level" },
    skills: { skills: [1] },
    preferences: { occupations: ["Customer Service"] },
  }
  assert.ok(getProfileReadiness(profile).every((item) => item.ready))
  profile.personal.mobile_number = "invalid"
  assert.equal(
    getProfileReadiness(profile).find(
      (item) => item.label === "Contact Information",
    ).ready,
    false,
  )
})
