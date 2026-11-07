import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function client(t, fetch) {
  t.mock.method(globalThis, "fetch", fetch)
  const previous = globalThis.document
  globalThis.document = { cookie: "" }
  t.after(() => {
    if (previous === undefined) delete globalThis.document
    else globalThis.document = previous
  })
  const source = (
    await readFile(
      new URL("../src/services/account.js", import.meta.url),
      "utf8",
    )
  ).replace("import.meta.env.VITE_ACCOUNT_API_URL", '""')
  return import(
    "data:text/javascript;base64," +
      Buffer.from(source).toString("base64") +
      "#" +
      Math.random()
  )
}
const json = (value) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  })

test("private calls identify the visible account while identity refresh never pins the old account", async (t) => {
  const calls = []
  const c = await client(t, async (url, options) => {
    calls.push({ url, options })
    return json({})
  })
  c.setExpectedAccount({ id: 17 })
  await c.accountRequest("/api/platform/summary")
  await c.getAccount()
  c.setExpectedAccount({ id: 23 })
  await c.accountRequest("/api/platform/summary")
  assert.equal(calls[0].options.headers["X-Peso-User"], "17")
  assert.equal(calls[1].options.headers["X-Peso-User"], undefined)
  assert.equal(calls[2].options.headers["X-Peso-User"], "23")
})

test("a stale-account response announces refresh once without an unauthenticated identity-refresh loop", async (t) => {
  const previous = globalThis.window
  const events = []
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) }
  t.after(() => {
    if (previous === undefined) delete globalThis.window
    else globalThis.window = previous
  })
  const c = await client(
    t,
    async (url) =>
      new Response(
        JSON.stringify(
          url === "/api/auth/user"
            ? { message: "Unauthenticated" }
            : { message: "Account changed", code: "SESSION_CHANGED" },
        ),
        {
          status: url === "/api/auth/user" ? 401 : 409,
          headers: { "Content-Type": "application/json" },
        },
      ),
  )
  await assert.rejects(
    c.accountRequest("/api/platform/summary"),
    (e) => e.status === 409,
  )
  await assert.rejects(c.getAccount(), (e) => e.status === 401)
  assert.deepEqual(events, ["pesomatch:session-stale"])
})

test("guide preference sends its CSRF-protected keepalive write before navigation", async (t) => {
  const calls = []
  const c = await client(t, async (url, options) => {
    calls.push({ url, options })
    return json({ ok: true })
  })
  document.cookie = "XSRF-TOKEN=existing%2Btoken"
  const save = c.updateAccountPreferences({ dashboard_tour_completed: true })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, "/api/auth/preferences")
  assert.equal(calls[0].options.keepalive, true)
  assert.equal(calls[0].options.headers["X-XSRF-TOKEN"], "existing+token")
  assert.equal(calls[0].options.reuseCsrf, undefined)
  await save
})

test("stale guide CSRF token is refreshed and retried only once", async (t) => {
  const paths = []
  const c = await client(t, async (url, options) => {
    paths.push(url)
    if (paths.length === 1) return new Response("{}", { status: 419 })
    if (url.endsWith("csrf-cookie")) {
      document.cookie = "XSRF-TOKEN=fresh"
      return new Response(null, { status: 204 })
    }
    assert.equal(options.headers["X-XSRF-TOKEN"], "fresh")
    return json({ ok: true })
  })
  document.cookie = "XSRF-TOKEN=stale"
  await c.updateAccountPreferences({ dashboard_tour_completed: true })
  assert.deepEqual(paths, [
    "/api/auth/preferences",
    "/sanctum/csrf-cookie",
    "/api/auth/preferences",
  ])
})

test("concurrent identical GETs share a flight; settled private results are fetched again", async (t) => {
  let calls = 0,
    finish
  const c = await client(t, () => {
    calls++
    return new Promise((resolve) => (finish = resolve))
  })
  const a = c.getAccount(),
    b = c.getAccount()
  assert.equal(calls, 1)
  finish(json({ user: { id: 1 } }))
  assert.deepEqual(await Promise.all([a, b]), [
    { user: { id: 1 } },
    { user: { id: 1 } },
  ])
  const fresh = c.getAccount()
  assert.equal(calls, 2)
  finish(json({ user: { id: 2 } }))
  assert.equal((await fresh).user.id, 2)
})

test("mutations invalidate flights across account transitions and failures are retryable", async (t) => {
  const reads = []
  const c = await client(t, (url, options) => {
    if (url.endsWith("/sanctum/csrf-cookie"))
      return Promise.resolve(new Response(null, { status: 204 }))
    if (options.method === "POST")
      return Promise.resolve(json({ message: "Signed out." }))
    return new Promise((resolve) => reads.push(resolve))
  })
  const old = c.getAccount()
  await c.logoutAccount()
  const fresh = c.getAccount()
  assert.equal(reads.length, 2)
  reads[0](json({ user: { id: 1 } }))
  reads[1](new Response('{"message":"Unauthenticated."}', { status: 401 }))
  await old
  await assert.rejects(fresh, (e) => e.status === 401)
  const retry = c.getAccount()
  assert.equal(reads.length, 3)
  reads[2](json({ user: { id: 2 } }))
  assert.equal((await retry).user.id, 2)
})

test("caller-owned abort signals do not share a request", async (t) => {
  let calls = 0
  const c = await client(t, async () => {
    calls++
    return json({ ok: true })
  })
  await Promise.all([
    c.accountRequest("/api/skills", { signal: new AbortController().signal }),
    c.accountRequest("/api/skills", { signal: new AbortController().signal }),
  ])
  assert.equal(calls, 2)
})

test("server failures never render diagnostic messages or internal field errors", async (t) => {
  const c = await client(
    t,
    async () =>
      new Response(
        JSON.stringify({
          message: "SQLSTATE credentials and connection trace",
          errors: { internal: ["private diagnostics"] },
        }),
        { status: 503 },
      ),
  )
  await assert.rejects(c.getAccount(), (error) => {
    assert.equal(error.status, 503)
    assert.match(error.message, /temporarily unavailable/)
    assert.doesNotMatch(error.message, /SQLSTATE|credentials|trace/)
    assert.deepEqual(error.errors, {})
    return true
  })
})

test("an HTML redirect cannot be mistaken for a successful login", async (t) => {
  const c = await client(t, async (url) =>
    url.endsWith("/sanctum/csrf-cookie")
      ? new Response(null, { status: 204 })
      : new Response("<!doctype html><h1>Public home</h1>", {
          headers: { "Content-Type": "text/html" },
        }),
  )
  await assert.rejects(
    c.loginAccount({
      email: "account@example.test",
      password: "test-password",
    }),
    (error) =>
      error.name === "AccountError" && /Reload this page/.test(error.message),
  )
})

test("a non-JSON login failure asks to retry sign-in instead of saving changes", async (t) => {
  const c = await client(t, async (url) =>
    url.endsWith("/sanctum/csrf-cookie")
      ? new Response(null, { status: 204 })
      : new Response("Bad request", { status: 400 }),
  )
  await assert.rejects(
    c.loginAccount({
      email: "account@example.test",
      password: "test-password",
    }),
    (error) => {
      assert.equal(error.status, 400)
      assert.match(error.message, /sign you in/)
      assert.doesNotMatch(error.message, /save your changes/)
      return true
    },
  )
})
