import { test, beforeEach } from "node:test"

import assert from "node:assert/strict"

import {
  initialStaffState,
  applyStaffAction,
  toPublicAssistance,
  getAssistanceQueue,
  saveStaffState,
  loadStaffState,
  outcomeOptions,
} from "../src/services/staffAssistanceService.js"

import { can } from "../src/services/staffPermissions.js"

import { mockStaff } from "../src/data/mockStaff.js"

import {
  getSampleAssistance,
  getAssistanceRequests,
} from "../src/services/assistanceService.js"

const staff = mockStaff[0],
  admin = mockStaff[2],
  id = "PESO-DEMO-005"

const store = new Map()

globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
}

beforeEach(() => store.clear())

const act = (state, action, payload = {}, recordId = id) =>
  applyStaffAction(state, staff, recordId, action, payload)

const coordinate = {
  date: "2026-10-05",
  method: "Phone",
  updateType: "Referral acknowledged",
  publicUpdate: "Sample referral acknowledged.",
  internalNote: "STAFF ONLY: contact HR next week.",
}

function coordinationState() {
  let s = act(initialStaffState(), "startReview").state
  s = act(s, "createReferral", { confirmed: true }).state
  return act(s, "recordEmployerCoordination", coordinate).state
}

test("permissions distinguish staff, admin, inactive and unknown actors", () => {
  assert.equal(can(staff, "process_referrals"), true)

  for (const permission of [
    "manage_staff",
    "manage_settings",
    "view_audit",
    "manage_reference",
  ]) {
    assert.equal(can(staff, permission), false)
    assert.equal(can(admin, permission), true)
  }

  assert.equal(can({ ...admin, active: false }, "manage_staff"), false)

  assert.equal(
    can({ role: "jobseeker", active: true }, "process_referrals"),
    false,
  )

  assert.throws(() =>
    applyStaffAction(
      initialStaffState(),
      { role: "jobseeker" },
      id,
      "startReview",
    ),
  )
})

test("request review, information update, resume and referral follow the allowed state path", () => {
  let state = initialStaffState()

  assert.throws(() =>
    act(state, "recordOutcome", {
      outcome: "hired",
      confirmed: true,
      date: "2026-10-05",
      publicUpdate: "No bypass",
    }),
  )

  assert.throws(() => act(state, "createReferral", { confirmed: true }))

  state = act(state, "startReview").state

  state = act(state, "requestJobseekerUpdate", {
    category: "Contact Information",
    publicUpdate: "Please update your mobile number.",
    internalNote: "Private check",
  }).state

  assert.equal(state.records.find((r) => r.id === id).status, "action_required")

  assert.throws(() => act(state, "createReferral", { confirmed: true }))

  state = act(state, "startReview").state

  assert.throws(() => act(state, "createReferral", { confirmed: false }))

  state = act(state, "createReferral", { confirmed: true }).state

  assert.equal(state.records.find((r) => r.id === id).status, "referred")

  assert.ok(
    state.records
      .find((r) => r.id === id)
      .referral.reference.startsWith("REF-"),
  )
})

test("coordination, follow-up and interview keep private notes out of every public projection", () => {
  let state = coordinationState()

  state = act(state, "addFollowUp", {
    date: "2026-10-05",
    method: "Email",
    result: "Awaiting reply",
    nextFollowUp: "2026-10-08",
    publicUpdate: "We are following up.",
    internalNote: "SECRET follow-up note",
  }).state

  state = act(state, "recordEmployerUpdate", {
    employerStatus: "For Interview",
    interviewDate: "2026-10-10",
    interviewTime: "10:00",
    interviewLocation: "Online",
    publicUpdate: "Please await instructions.",
    internalNote: "SECRET interview evaluation",
  }).state

  const record = state.records.find((r) => r.id === id),
    publicRecord = toPublicAssistance(record)

  assert.equal(record.status, "follow_up")

  assert.match(publicRecord.employerFeedback.message, /2026-10-10 at 10:00/)

  const serialized = JSON.stringify(publicRecord)

  for (const secret of [
    "SECRET",
    "STAFF ONLY",
    "internalActivity",
    "internalNote",
    "assignedStaffId",
    "contactPerson",
  ])
    assert.equal(serialized.includes(secret), false)

  assert.ok(record.internalActivity.length > 3)

  assert.equal(publicRecord.readOnly, true)
})

test("outcomes record employer reports, keep ongoing states active and cannot overwrite terminal outcomes", () => {
  for (const outcome of Object.keys(outcomeOptions)) {
    const source = initialStaffState()

    const payload = {
      outcome,
      date: "2026-10-05",
      confirmed: true,
      publicUpdate: "Recorded sample outcome.",
      trainingId: "excel",
      suggestedJobId: "administrative",
    }

    const { record, state } = act(
      source,
      "recordOutcome",
      payload,
      "PESO-DEMO-001",
    )

    assert.equal(
      record.status,
      ["ongoing_assistance", "under_evaluation"].includes(outcome)
        ? "follow_up"
        : "outcome_recorded",
    )

    assert.equal(record.outcome, outcome)

    if (record.status === "outcome_recorded")
      assert.throws(() => act(state, "recordOutcome", payload, "PESO-DEMO-001"))

    assert.equal(
      source.records.find((r) => r.id === "PESO-DEMO-001").outcome,
      null,
    )
  }
})

test("training requires a related skill and a reason; duplicate recommendations are rejected", () => {
  const state = initialStaffState(),
    recordId = "PESO-DEMO-001"

  assert.throws(() =>
    act(
      state,
      "recommendTraining",
      { trainingId: "digital", reason: "Unrelated" },
      recordId,
    ),
  )

  const result = act(
    state,
    "recommendTraining",
    {
      trainingId: "excel",
      reason: "Improve spreadsheet skills required by this job.",
    },
    recordId,
  )

  assert.equal(result.record.trainingRecommendations.length, 1)

  assert.equal(result.record.status, "employer_coordination")

  assert.match(result.record.publicUpdates.at(-1).message, /does not enroll/)

  assert.throws(() =>
    act(
      result.state,
      "recommendTraining",
      { trainingId: "excel", reason: "Repeated" },
      recordId,
    ),
  )
})

test("assignment requires confirmation; stale versions and invalid dates preserve the original state", () => {
  const state = coordinationState(),
    before = JSON.stringify(state)

  assert.throws(() => act(state, "assignStaff", { staffId: "staff-luis" }))

  assert.throws(() =>
    act(state, "recordEmployerCoordination", { ...coordinate, version: 1 }),
  )

  assert.throws(() =>
    act(state, "addFollowUp", {
      date: "2026-10-05",
      method: "Phone",
      result: "Waiting",
      nextFollowUp: "2026-10-01",
      publicUpdate: "Waiting",
    }),
  )

  assert.equal(JSON.stringify(state), before)

  const result = act(state, "assignStaff", {
    staffId: "staff-luis",
    confirmed: true,
  })

  assert.equal(result.record.assignedStaffId, "staff-luis")

  assert.equal(
    result.record.publicUpdates.length,
    state.records.find((r) => r.id === id).publicUpdates.length,
  )
})

test("queue filters combine correctly and projected demo records remain scoped to the account", () => {
  const state = coordinationState()

  assert.equal(
    getAssistanceQueue(state, {
      search: "PESO-DEMO-005",
      status: "employer_coordination",
    }).length,
    1,
  )

  assert.equal(
    getAssistanceQueue(state, {
      search: "PESO-DEMO-005",
      status: "request_received",
    }).length,
    0,
  )

  assert.equal(getAssistanceQueue(state, { from: "2030-01-01" }).length, 0)

  saveStaffState("one", state)

  assert.equal(
    loadStaffState("one").records.find((r) => r.id === id).status,
    "employer_coordination",
  )

  assert.equal(
    loadStaffState("two").records.find((r) => r.id === id).status,
    "request_received",
  )

  assert.equal(
    getSampleAssistance("one").find((r) => r.id === id).status,
    "employer_coordination",
  )

  assert.equal(
    getSampleAssistance("two").find((r) => r.id === id).status,
    "request_received",
  )

  assert.equal(getAssistanceRequests("one").length, 0)

  assert.ok(!JSON.stringify(getSampleAssistance("one")).includes("STAFF ONLY"))
})
