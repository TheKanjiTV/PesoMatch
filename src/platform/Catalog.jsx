import { useEffect, useState } from "react"
import {
  CollectionNotice,
  trainingNoticeVersion,
  trainingConsentStatement,
} from "./CollectionNotice.jsx"

import { Link, useParams } from "react-router"

import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  MapPin,
  Search,
} from "lucide-react"

import { useAuth } from "../context/AuthContext.jsx"

import { api, useDebounced, useResource } from "./api.js"

import {
  ActionLink,
  Badge,
  date,
  Editor,
  Empty,
  Heading,
  inputStyle,
  Loading,
  money,
  Notice,
  primaryStyle,
  Sample,
  Source,
  secondaryStyle,
  staffRole,
} from "./ui.jsx"

import { ResourceState } from "./ResourceState.jsx"

const F = (name, label, type = "text", extra = {}) => ({
  name,

  label,

  type,

  ...extra,
})

const statusField = F("status", "Publication status", "text", {
  options: ["draft", "pending_review", "published", "closed"],
})

const vacancyFields = [
  F("title", "Vacancy title"),

  F("organization", "Employer / organization"),

  F("location", "Work location"),

  F("industry", "Industry"),

  F("employment_type", "Employment type", "text", {
    options: [
      "Full-time",

      "Part-time",

      "Contractual",

      "Seasonal",

      "Internship",
    ],
  }),

  F("slots", "Available positions", "number", { min: 1, max: 10000 }),

  F("salary_min", "Minimum monthly salary (PHP)", "number", {
    min: 0,

    required: false,
  }),

  F("salary_max", "Maximum monthly salary (PHP)", "number", {
    min: 0,

    required: false,
  }),

  F("deadline", "Application deadline", "date"),

  statusField,

  F("skills_text", "Required skills (comma separated)"),

  F("description", "Responsibilities & requirements", "textarea"),
]

const trainingFields = [
  F("title", "Program title"),

  F("provider", "Training provider"),

  F("location", "Training location"),

  F("mode", "Training mode", "text", {
    options: ["In person", "Online", "Blended"],
  }),

  F("capacity", "Training capacity", "number", { min: 1, max: 10000 }),

  F("fee", "Training fee (PHP)", "number", { min: 0 }),

  F("starts_on", "Start date", "date"),

  F("ends_on", "End date", "date"),

  F("schedule", "Class schedule"),

  statusField,

  F("skills_text", "Skills developed (comma separated)"),

  F("requirements", "Enrollment requirements", "textarea"),

  F("description", "Program description", "textarea"),
]

export function CatalogPage({ kind = "vacancies" }) {
  const { user } = useAuth(),
    { id } = useParams()

  const training = kind === "training"

  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [editor, setEditor] = useState(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [savedOnly, setSavedOnly] = useState(false)

  const query = useDebounced(search)

  const r = useResource(
    (training ? "/training" : "/vacancies") +
      (id
        ? `?id=${id}`
        : `?search=${encodeURIComponent(query)}&status=${filter}${
            savedOnly && !training ? "&saved=1" : ""
          }`),
  )

  const summary = useResource("/summary")

  const canManage =
      staffRole(user.role) ||
      user.role === (training ? "training_provider" : "employer"),
    resourcePath = training ? "/training" : "/vacancies"

  const records = r.data?.data || []

  const filtered = records.filter(
    (v) =>
      JSON.stringify([
        v.title,

        v.organization,

        v.provider,

        v.location,

        v.skills,
      ])

        .toLowerCase()

        .includes(search.toLowerCase()) &&
      (filter === "all" || v.status === filter),
  )

  const detail = id ? records.find((v) => String(v.id) === id) : null

  useEffect(() => {
    if (id && r.data)
      document.title = `${detail?.title || "Record unavailable"} | PESO Employment Services`
  }, [id, detail?.title, r.data])

  function edit(row = {}) {
    setEditor({
      ...row,

      skills_text: (row.skills || []).join(", "),

      fee: row.fee ?? 0,

      status: row.status || (staffRole(user.role) ? "draft" : "pending_review"),

      slots: row.slots || 1,

      capacity: row.capacity || 20,
    })
  }

  async function save(v) {
    const { skills_text, id: rowId, ...data } = v

    const body = {}

    for (const f of training ? trainingFields : vacancyFields) {
      if (f.name !== "skills_text")
        body[f.name] =
          data[f.name] === "" && ["salary_min", "salary_max"].includes(f.name)
            ? null
            : data[f.name]
    }

    body.skills = skills_text

      .split(",")

      .map((s) => s.trim())

      .filter(Boolean)

    await api(
      `${resourcePath}${rowId ? `/${rowId}` : ""}`,

      rowId ? "PATCH" : "POST",

      body,
    )

    setMessage("Catalog record saved.")

    await r.reload()
  }

  async function action(row, save = false) {
    setBusy(true)

    setError("")

    try {
      await api(
        `${resourcePath}/${row.id}/${
          save ? "save" : training ? "enroll" : "referrals"
        }`,

        save && summary.data?.saved?.includes(row.id) ? "DELETE" : "POST",

        save
          ? undefined
          : training
            ? {
                consent: true,
                consent_notice_version: trainingNoticeVersion,

                notes:
                  "I have reviewed the program requirements and request provider review.",
              }
            : { notes: "Please review my profile for this vacancy." },
      )

      setMessage(
        save
          ? summary.data?.saved?.includes(row.id)
            ? "Vacancy removed from saved items."
            : "Vacancy saved to your account."
          : training
            ? "Enrollment requested. Follow its progress in Training Enrollment."
            : "Referral requested. PESO will review your profile.",
      )

      if (save) {
        await summary.reload()

        if (savedOnly) await r.reload()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const noun = training ? "Training & Skills Development" : "Vacancy Management"

  return (
    <>
      <Heading
        title={detail?.title || noun}
        description={
          training
            ? "Explore upskilling pathways, review requirements, and follow provider-confirmed enrollment."
            : detail?.external_application
              ? "Review the official source and plan your application with PESO guidance."
              : "Discover work opportunities or manage reviewed vacancies for PESO referrals."
        }
        action={
          canManage && (
            <button className={primaryStyle} onClick={() => edit()}>
              Add {training ? "training program" : "vacancy"}
            </button>
          )
        }
      />
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice error>{error}</Notice>
        </div>
      )}
      {editor && (
        <Editor
          key={editor.id || "new"}
          title={`${editor.id ? "Edit" : "Add"} ${
            training ? "training program" : "vacancy"
          }`}
          initial={editor}
          fields={(training ? trainingFields : vacancyFields).map((f) =>
            f.name === "status" && !staffRole(user.role)
              ? { ...f, options: ["pending_review", "closed"] }
              : f,
          )}
          help={
            !staffRole(user.role)
              ? "PESO reviews partner submissions before they appear in the public catalog."
              : undefined
          }
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
      <ResourceState resource={r}>
        {id && !detail ? (
          <Empty title="Record unavailable">
            This record may be closed or outside your permitted catalog.{" "}
            <Link to={training ? "/training" : "/jobs"} className="underline">
              Return to the catalog.
            </Link>
          </Empty>
        ) : detail ? (
          <>
            <Link
              to={training ? "/training" : "/jobs"}
              className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            >
              ← Back to catalog
            </Link>
            <Detail
              record={detail}
              training={training}
              canManage={canManage}
              role={user.role}
              busy={busy}
              saved={summary.data?.saved?.includes(detail.id)}
              edit={edit}
              action={action}
            />
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              {!training && user.role === "jobseeker" && (
                <button
                  className={savedOnly ? primaryStyle : secondaryStyle}
                  aria-pressed={savedOnly}
                  onClick={() => setSavedOnly(!savedOnly)}
                >
                  {savedOnly ? "Show all vacancies" : "Saved vacancies"}
                </button>
              )}
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">
                  Search {training ? "training" : "vacancies"}
                </span>
                <Search
                  className="absolute left-3 top-3.5 text-muted-foreground"
                  size={17}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputStyle} pl-10`}
                  placeholder={
                    training
                      ? "Search programs, providers or skills"
                      : "Search job title, employer, location or skill"
                  }
                />
              </label>
              {canManage && (
                <select
                  aria-label="Filter by publication status"
                  className={`${inputStyle} max-w-48`}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "all",

                    "draft",

                    "pending_review",

                    "published",

                    "closed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!filtered.length ? (
              <Empty
                title={
                  search
                    ? "No matching records"
                    : "The catalog is ready for new opportunities"
                }
              >
                Try another search or ask a PESO officer about upcoming
                opportunities.
              </Empty>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {filtered.map((v) => (
                  <article
                    key={v.id}
                    className="flex flex-col rounded-lg border border-border bg-card p-6"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge>{training ? v.mode : v.employment_type}</Badge>
                      {canManage && (
                        <Badge>{v.status.replaceAll("_", " ")}</Badge>
                      )}
                      <Sample record={v} />
                      <Source record={v} />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-primary">
                      <Link
                        to={`${training ? "/training" : "/jobs"}/${v.id}`}
                        className="hover:underline underline-offset-4"
                      >
                        {v.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {training ? v.provider : v.organization}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={15} />
                      {v.location}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground line-clamp-2">
                      {v.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {v.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 mt-6">
                      <span className="text-xs text-muted-foreground">
                        {training
                          ? v.external_enrollment
                            ? "Self-paced · official provider"
                            : `Starts ${date(v.starts_on)}`
                          : v.external_application
                            ? "Confirm availability on source"
                            : `Apply by ${date(v.deadline)}`}
                      </span>
                      <Link
                        to={`${training ? "/training" : "/jobs"}/${v.id}`}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                      >
                        View {training ? "program" : "vacancy"}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {records.length === 100 && (
              <p className="mt-5 text-sm">
                Showing the first 100 records. Refine your search to find a
                vacancy.
              </p>
            )}
          </>
        )}
      </ResourceState>
    </>
  )
}

function Detail({
  record: v,

  training,

  canManage,

  role,

  busy,

  edit,

  action,

  saved,
}) {
  const [consent, setConsent] = useState(false)

  return (
    <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
      <article className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge>{training ? v.mode : v.employment_type}</Badge>
          <Sample record={v} />
          <Source record={v} />
        </div>
        <h2 className="mt-5 font-display text-3xl text-primary">
          {training ? v.provider : v.organization}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{v.location}</p>
        <h3 className="mt-9 text-base font-semibold">
          {training ? "About this program" : "About this opportunity"}
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {v.description}
        </p>
        <h3 className="mt-8 text-base font-semibold">
          {training
            ? "Skills you will develop"
            : v.external_application
              ? "Skills identified from listing"
              : "Required skills"}
        </h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
          {v.skills.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {!v.skills.length && (
          <p className="mt-3 text-sm text-muted-foreground">
            {training
              ? "No skill topics mapped. Review the official course syllabus and entry requirements."
              : "No skill requirements mapped. Review the official listing for the full qualifications."}
          </p>
        )}
        {training && (
          <>
            <h3 className="mt-8 text-base font-semibold">
              Enrollment requirements
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {v.requirements}
            </p>
          </>
        )}
      </article>
      <aside className="h-fit rounded-lg border border-border bg-muted p-6">
        <h2 className="font-display text-2xl text-primary">
          {training ? "Plan your training" : "Plan your application"}
        </h2>
        <dl className="mt-6 space-y-5 text-sm">
          {(training
            ? [
                [
                  "Training dates",

                  v.external_enrollment
                    ? "Self-paced"
                    : `${date(v.starts_on)} – ${date(v.ends_on)}`,
                ],

                ["Schedule", v.schedule],

                [
                  "Program capacity",

                  v.capacity === null
                    ? "Check with provider"
                    : `${v.capacity} places`,
                ],

                [
                  "Training fee",

                  Number(v.fee)
                    ? money(v.fee)
                    : v.external_enrollment
                      ? "Free online course"
                      : "No training fee listed",
                ],
              ]
            : [
                [
                  "Deadline",
                  v.deadline
                    ? date(v.deadline)
                    : "Not stated · confirm with employer",
                ],

                ["Available positions", v.slots ?? "Not stated"],

                [
                  v.external_application ? "Listed pay" : "Monthly salary",

                  v.external_application
                    ? v.source_salary
                      ? `${v.source_salary} · confirm pay period with employer`
                      : "Not stated"
                    : v.salary_min
                      ? `${money(v.salary_min)} – ${money(v.salary_max || v.salary_min)}`
                      : "Contact employer",
                ],
              ]
          ).map(([k, value]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {v.external_application ? (
          <div className="mt-7 space-y-3">
            <a
              href={v.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryStyle} w-full`}
            >
              View official listing & apply
            </a>
            <p className="text-xs leading-6 text-muted-foreground">
              Listed {date(v.source_posted_on)}. Confirm current availability
              and requirements with the source. This employer has no connected
              PESO referral account here.
            </p>
            {role === "jobseeker" && (
              <>
                <button
                  disabled={busy}
                  className={`${secondaryStyle} w-full`}
                  onClick={() => action(v, true)}
                >
                  <Bookmark size={16} />
                  {saved ? "Unsave vacancy" : "Save vacancy"}
                </button>
                <Link
                  to="/services"
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline"
                >
                  Ask PESO for application guidance
                </Link>
              </>
            )}
          </div>
        ) : v.external_enrollment ? (
          <div className="mt-7">
            <a
              href={v.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryStyle} w-full`}
            >
              Open official course & enroll
            </a>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Enrollment and completion are handled on the provider website. No
              local place is reserved by opening this link.
            </p>
          </div>
        ) : canManage ? (
          <button
            onClick={() => edit(v)}
            className={`${primaryStyle} mt-7 w-full`}
          >
            Edit record
          </button>
        ) : role === "jobseeker" ? (
          <div className="mt-7 space-y-3">
            <CollectionNotice kind={training ? "enrollment" : "referral"} />
            {training && (
              <label className="flex items-start gap-3 text-xs leading-6">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {trainingConsentStatement}
              </label>
            )}
            <button
              disabled={busy || (training && !consent)}
              className={`${primaryStyle} w-full`}
              onClick={() => action(v)}
            >
              {training ? "Request enrollment" : "Request PESO referral"}
            </button>
            {!training && (
              <button
                disabled={busy}
                className={`${secondaryStyle} w-full`}
                onClick={() => action(v, true)}
              >
                <Bookmark size={16} />
                {saved ? "Unsave vacancy" : "Save vacancy"}
              </button>
            )}
            <Link
              to={training ? "/enrollments" : "/referrals"}
              className="block py-2 text-center text-xs font-semibold text-primary"
            >
              View my {training ? "enrollments" : "referrals"}
            </Link>
          </div>
        ) : null}
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          {training
            ? "Your request is reviewed before a place is confirmed. Program completion does not automatically issue a TESDA National Certificate."
            : v.external_application
              ? "PESO guidance supports your application. Review the full qualifications on the official listing; the employer decides eligibility and hiring. A match or course does not guarantee employment."
              : "A PESO referral is an employment facilitation step. The employer decides hiring; a match does not guarantee a job."}
        </p>
      </aside>
    </div>
  )
}

export function MatchesPage() {
  const r = useResource("/matches")

  const [tab, setTab] = useState("jobs")

  return (
    <>
      <Heading
        title="Job Matching & Referral"
        description="Understand how your profile connects to vacancies, and which training can help address skill gaps."
      />
      <Notice>
        Content-based recommendation baseline: 75% declared skill coverage and
        25% TF-IDF profile similarity. These suggestions are advisory and do not
        determine eligibility or hiring.
      </Notice>
      <div className="my-6 flex flex-wrap gap-2">
        {[
          ["jobs", "Recommended vacancies"],

          ["training", "Skills Development Recommendation"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={tab === id ? primaryStyle : secondaryStyle}
          >
            {label}
          </button>
        ))}
      </div>
      <ResourceState resource={r} paginate={tab === "jobs"}>
        {tab === "jobs" ? (
          <div className="space-y-4">
            {!r.data?.matches.length && (
              <Empty title="No published vacancies to assess" />
            )}
            {r.data?.matches.map(({ vacancy: v, assessment: a, training }) => (
              <article
                key={v.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      {v.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {v.organization} · {v.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-semibold text-primary">
                      {a.score}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      profile alignment
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold text-primary">
                      Matched skills
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {a.matched_skills.join(", ") ||
                        "No declared skill overlap yet"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-accent">
                      Skills to develop
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {!v.skills.length
                        ? "No skill requirements mapped · review the official listing"
                        : a.missing_skills.join(", ") ||
                          "All listed skills appear in your profile"}
                    </p>
                  </div>
                </div>
                {!!a.missing_skills.length && (
                  <section
                    className="mt-5 border-t border-border pt-5"
                    aria-label="Training for this vacancy"
                  >
                    <h3 className="text-sm font-semibold text-primary">
                      Build skills for this opportunity
                    </h3>
                    {training?.length ? (
                      <ul className="mt-3 space-y-3">
                        {training

                          .slice(0, 4)

                          .map(({ program: p, addresses }) => (
                            <li key={p.id}>
                              <Link
                                to={`/training/${p.id}`}
                                className="text-sm font-semibold text-primary underline underline-offset-4"
                              >
                                {p.title}
                              </Link>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Develops: {addresses.join(", ")} · {p.provider}
                              </p>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No catalog course currently covers these gaps. Ask PESO
                        for a skills assessment or a suitable provider.
                      </p>
                    )}
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      These courses support skill development. Employers may
                      require experience, qualifications or assessment beyond
                      course completion.
                    </p>
                  </section>
                )}
                {a.profile_incomplete && (
                  <p className="mt-3 text-xs">
                    Complete your profile to improve these suggestions.
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between gap-4">
                  <Sample record={v} />
                  <Source record={v} />
                  <ActionLink to={`/jobs/${v.id}`} secondary>
                    {v.external_application
                      ? "Review official opportunity"
                      : "Review & request referral"}
                  </ActionLink>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {!r.data?.training.length && (
              <Empty title="No published training programs yet" />
            )}
            {r.data?.training.map(({ program: p, addresses, reason }) => (
              <article
                key={p.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="text-lg font-semibold text-primary">
                    {p.title}
                  </h2>
                  <Sample record={p} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.provider}
                </p>
                <p className="mt-5 text-sm leading-6">{reason}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {addresses.length
                    ? `Addresses: ${addresses.join(", ")}`
                    : "General upskilling opportunity"}
                </p>
                <div className="mt-5">
                  <ActionLink to={`/training/${p.id}`} secondary>
                    Review program & enroll
                  </ActionLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </ResourceState>
    </>
  )
}
