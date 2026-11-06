import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeSearch,
  searchError,
  searchSuggestions,
} from "../src/platform/search.js"
import { withMinimumLoading } from "../src/platform/loading.js"

test("search validates length and controls while preserving names and Unicode", () => {
  assert.equal(normalizeSearch("  O'Brien   Peña  "), "O'Brien Peña")
  assert.equal(searchError("ñ".repeat(200)), "")
  assert.match(searchError("a".repeat(201)), /200/)
  for (const text of ["bad\nquery", "bad\u0000query", "bad\u007fquery"])
    assert.match(searchError(text), /control/)
  assert.equal(searchError("C++ / C# 100%_ ! <script>"), "")
})

test("suggestions stay relevant, unique and bounded without HTML interpolation", () => {
  const records = Array.from({ length: 20 }, (_, index) => ({
    title: `Nurse ${index}`,
    skills: ["Nursing", "Nursing"],
    organization: '<img onerror="attack">',
  }))
  assert.equal(searchSuggestions(records, "n", ["title", "skills"]).length, 8)
  assert.deepEqual(searchSuggestions(records, " ", ["title"]), [])
  assert.deepEqual(searchSuggestions(records, "<img", ["organization"]), [
    '<img onerror="attack">',
  ])
})

test("fast success and errors both keep the 400ms loading floor", async () => {
  let start = performance.now()
  assert.equal(await withMinimumLoading(() => Promise.resolve("done")), "done")
  assert.ok(performance.now() - start >= 390)
  start = performance.now()
  await assert.rejects(
    withMinimumLoading(() => Promise.reject(new Error("offline"))),
    /offline/,
  )
  assert.ok(performance.now() - start >= 390)
})

test("slow requests stay pending until the real result", async () => {
  const start = performance.now()
  assert.equal(
    await withMinimumLoading(
      () => new Promise((resolve) => setTimeout(() => resolve("done"), 520)),
    ),
    "done",
  )
  assert.ok(performance.now() - start >= 510)
  assert.ok(performance.now() - start < 850)
})
