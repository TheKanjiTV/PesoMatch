import { AiConsent } from "./AiWorkspace.jsx"
import { Modal } from "./Modal.jsx"
import { TrainingParticipants } from "./TrainingParticipation.jsx"
import { RecordLink as Link } from "./RecordLink.jsx"
import { useEffect, useRef, useState } from "react"

import {
  CollectionNotice,
  trainingNoticeVersion,
  trainingConsentStatement,
} from "./CollectionNotice.jsx"

import { useParams, useNavigate, useSearchParams } from "react-router"

import { ArrowRight, Bookmark, CalendarDays, MapPin } from "lucide-react"

import { useAuth } from "../context/AuthContext.jsx"

import { api, useSearchQuery, useResource } from "./api.js"

import {
  ActionLink,
  Badge,
  date,
  Editor,
  Empty,
  Heading,
  inputStyle,
  money,
  Notice,
  primaryStyle,
  dangerStyle,
  addStyle,
  Sample,
  Source,
  secondaryStyle,
  staffRole,
} from "./ui.jsx"

import { ResourceState } from "./ResourceState.jsx"

import {
  CatalogSkeleton,
  MatchesSkeleton,
  TableSkeleton,
} from "./LoadingStates.jsx"
import {
  EmployerVacancyTable,
  VacancyStatus,
  vacancyStatuses,
} from "./EmployerVacancies.jsx"

import { SearchInput } from "./SearchInput.jsx"

import { searchSuggestions } from "./search.js"

import { DeleteDialog } from "./DeleteDialog.jsx"

import { PesoVacancySource } from "./PesoVacancySource.jsx"

const fieldLimits = {
  skills_text: 3030,

  description: 8000,

  requirements: 4000,

  schedule: 200,

  industry: 120,
}

const F = (name, label, type = "text", extra = {}) => ({
  name,

  label,

  type,

  ...(!extra.options && ["text", "textarea"].includes(type)
    ? {
        maxLength: fieldLimits[name] ?? (type === "textarea" ? 4000 : 160),
      }
    : {}),

  ...extra,
})

const statusField = F("status", "Publication status", "text", {
  options: ["draft", "pending_review", "published", "closed"],
})
const vacancyStatusOptions = Object.entries(vacancyStatuses).map(
  ([value, [label]]) => ({ value, label }),
)

function Verification({ record }) {
  if (!record.external_application && !record.external_enrollment) return null

  const labels = {
    source_lists_open: "Source lists open · check remaining places",

    confirm_availability: "Availability needs confirmation",

    intake_unconfirmed: "Registered program · confirm intake",

    official_announcement: "Official overseas announcement · confirm intake",

    online_catalog: "Official online course",

    deadline_passed: "Application deadline passed",

    review_expired: "Source review expired",
  }

  return (
    <Badge>
      {labels[record.availability_status] || "Confirm availability with source"}
    </Badge>
  )
}

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

  { ...statusField, options: vacancyStatusOptions },

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

export function CatalogPage({ kind = "vacancies", previewId, onPreviewClose }) {
  const { user } = useAuth(),
    paramsId = useParams().id
  const id = previewId || paramsId

  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [statusOnly, setStatusOnly] = useState(false)
  const [removing, setRemoving] = useState(null)

  const [intake, setIntake] = useState(null)

  const training = kind === "training"
  const employer = !training && user.role === "employer"
  const view = ["all", "employers"].includes(params.get("view"))
    ? params.get("view")
    : "mine"
  const directory = employer && !id && view === "employers"
  const organization =
    employer && view === "all" ? params.get("organization") || "" : ""
  const returnQuery = employer
    ? `?${new URLSearchParams({ view, ...(organization && { organization }) })}`
    : ""
  const catalogReturn = training ? "/training" : `/jobs${returnQuery}`

  const showSourceStatus = training
    ? user.role !== "training_provider"
    : !employer || view === "all" || Boolean(id)

  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [editor, setEditor] = useState(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [savedOnly, setSavedOnly] = useState(false),
    [catalogFilter, setCatalogFilter] = useState("all"),
    [availabilityFilter, setAvailabilityFilter] = useState("all"),
    [location, setLocation] = useState(""),
    [employment, setEmployment] = useState(""),
    [sort, setSort] = useState("newest")

  const query = useSearchQuery(search)
  const locationQuery = useSearchQuery(location)

  const resourcePath = training ? "/training" : "/vacancies"
  const request = new URLSearchParams(
    id
      ? { id }
      : {
          search: query,
          status: employer && view !== "mine" ? "all" : filter,
          ...(training
            ? { catalog: catalogFilter }
            : {
                availability:
                  employer && view === "mine" ? "all" : availabilityFilter,
              }),
          ...(savedOnly && !training && { saved: "1" }),
        },
  )
  if (employer) {
    request.set("scope", id || view === "all" ? "all" : "mine")
    if (!id && !directory) {
      if (organization) request.set("organization", organization)
      if (locationQuery) request.set("location", locationQuery)
      if (employment) request.set("employment_type", employment)
      request.set("sort", sort)
    }
  }
  const r = useResource(
    directory
      ? `/employers?${new URLSearchParams({ search: query, sort: sort === "-title" ? "-title" : "title" })}`
      : `${resourcePath}?${request}`,
  )
  const feedback = useRef(null)
  useEffect(() => {
    if (error) {
      feedback.current?.focus({ preventScroll: true })
      feedback.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      })
    }
  }, [error])
  const summary = useResource("/summary")
  useEffect(() => {
    if (id) return
    const refresh = () => r.reload()
    window.addEventListener("peso:catalog-changed", refresh)
    return () => window.removeEventListener("peso:catalog-changed", refresh)
  }, [id, r.reload])

  const staff = staffRole(user.role)
  const canManage =
    staff || user.role === (training ? "training_provider" : "employer")
  const canManageRecord = (record) =>
    staff || (canManage && record.owner_id === user.id)

  const records = r.data?.data || []

  const filtered = records

  const detail = id ? records.find((v) => String(v.id) === id) : null

  useEffect(() => {
    if (!(training && staff && params.get("create") === "training"))
      setEditor(null)
    setRemoving(null)
    setSearch("")
    setFilter("all")
    setLocation("")
    setEmployment("")
    setAvailabilityFilter("all")
    setSort("newest")
  }, [view, organization])

  const openedDraft = useRef(false)
  useEffect(() => {
    if (
      training &&
      staff &&
      params.get("create") === "training" &&
      !openedDraft.current
    ) {
      openedDraft.current = true
      edit({
        title: (params.get("topic") || "").slice(0, 160),
        status: "draft",
      })
    }
  }, [training, staff])

  useEffect(() => {
    if (id && r.data)
      document.title = `${detail?.title || "Record unavailable"} | PESO Employment Services`
  }, [id, detail?.title, r.data])

  function edit(row = {}, statusOnly = false) {
    setStatusOnly(statusOnly)
    setEditor({
      ...row,

      skills_text: (row.skills || []).join(", "),

      fee: row.fee ?? 0,

      status:
        (employer && row.status === "published"
          ? "pending_review"
          : row.status) || (staff ? "draft" : "pending_review"),

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

    if (employer && !id && view !== "mine") navigate("/jobs?view=mine")
    else await r.reload()
  }

  async function action(row, save = false) {
    setBusy(true)

    setError("")

    try {
      await api(
        training && row.external_enrollment && !save
          ? "/training-demands"
          : `${resourcePath}/${row.id}/${save ? "save" : training ? "enroll" : "referrals"}`,

        save && summary.data?.saved?.includes(row.id) ? "DELETE" : "POST",

        save
          ? undefined
          : training && row.external_enrollment
            ? { topic: row.title, source_program_id: row.id }
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
            ? row.external_enrollment
              ? "Interest recorded for PESO planning. This is not enrollment."
              : "Enrollment requested. Follow its progress in Training Enrollment."
            : "Referral requested. PESO will review your profile.",
      )

      if (!save) {
        onPreviewClose?.()
        navigate(
          training
            ? row.external_enrollment
              ? "/training-demand"
              : "/enrollments"
            : "/referrals",
        )

        return
      }

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
        title={detail?.title || (directory ? "Employer directory" : noun)}
        description={
          training
            ? user.role === "employer"
              ? "Browse published training and skills development programs. Training providers manage learner enrollment."
              : "Explore offered training, check places and apply for a scheduled intake. PESO can manage participants and partner programs."
            : detail?.external_application
              ? "Review the official source and plan your application with PESO guidance."
              : directory
                ? "Browse organizations with published vacancies."
                : employer
                  ? "Manage your own postings and browse published vacancies. PESO reviews submissions before publication."
                  : "Discover work opportunities or manage reviewed vacancies for PESO referrals."
        }
        action={
          !previewId &&
          canManage &&
          (!employer || (!id && !directory)) && (
            <button className={addStyle} onClick={() => edit()}>
              Add {training ? "training program" : "vacancy"}
            </button>
          )
        }
      />
      {employer && !id && (
        <nav
          aria-label="Employer vacancy views"
          className="mb-5 flex flex-wrap gap-2 border-b border-border pb-3"
        >
          {[
            ["mine", "My vacancies"],
            ["all", "All vacancies"],
            ["employers", "Employers"],
          ].map(([value, label]) => (
            <Link
              key={value}
              to={`/jobs?view=${value}`}
              aria-current={view === value ? "page" : undefined}
              className={view === value ? primaryStyle : secondaryStyle}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      {removing && (
        <DeleteDialog
          type={training ? "training" : "vacancy"}
          record={removing}
          onClose={() => setRemoving(null)}
          onDeleted={async () => {
            setMessage("Catalog item deleted. Linked history is preserved.")

            if (id) {
              onPreviewClose?.()
              navigate(catalogReturn)
            } else await r.reload()
          }}
        />
      )}
      {intake && (
        <Editor
          title={`Verify local intake: ${intake.title}`}
          initial={{ provider: intake.provider }}
          fields={[
            F("provider", "Confirmed training provider"),

            F("location", "Actual training location"),

            F("mode", "Delivery mode", "text", {
              options: ["In person", "Online", "Blended"],
            }),

            F("capacity", "Confirmed intake capacity", "number", { min: 1 }),

            F("starts_on", "Confirmed start date", "date"),

            F("ends_on", "Confirmed end date", "date"),

            F("schedule", "Confirmed training schedule"),

            F("fee", "Confirmed fee (PHP)", "number", { min: 0, step: "0.01" }),

            F(
              "intake_verification",

              "Provider contact, date, intake, fee and scholarship verification",

              "textarea",

              { minLength: 20, maxLength: 4000 },
            ),
          ]}
          help="Record the provider's actual confirmation. This creates a separate PESO-managed intake and preserves the original TESDA registry evidence. Do not assume scholarships or places are available."
          onClose={() => setIntake(null)}
          onSave={async (body) => {
            const result = await api(
              `/training/${intake.id}/intakes`,

              "POST",

              body,
            )

            navigate(`/training/${result.data.id}`)
          }}
        />
      )}
      {showSourceStatus &&
        (!id ||
          detail?.external_application ||
          detail?.external_enrollment) && (
          <PesoVacancySource
            training={training}
            onArea={!id ? setSearch : undefined}
          />
        )}
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {error && !detail && (
        <div
          ref={feedback}
          tabIndex={-1}
          aria-label="Request feedback"
          className="mb-5 scroll-mt-28"
        >
          <Notice error>{error}</Notice>
        </div>
      )}
      {editor && (
        <Editor
          key={editor.id || "new"}
          title={`${statusOnly ? "Update status:" : editor.id ? "Edit" : "Add"} ${
            training ? "training program" : "vacancy"
          }`}
          initial={editor}
          fields={(statusOnly
            ? [vacancyFields.find((f) => f.name === "status")]
            : training
              ? trainingFields
              : vacancyFields
          ).map((f) => {
            if (f.name !== "status" || staff) return f
            return {
              ...f,
              options: training
                ? ["pending_review", "closed"]
                : vacancyStatusOptions.filter(
                    ({ value }) => value !== "published",
                  ),
            }
          })}
          help={
            !staffRole(user.role)
              ? "PESO reviews partner submissions before they appear in the public catalog."
              : undefined
          }
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
      {!id && (
        <div
          className={
            employer
              ? "mb-6 grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))]"
              : "mb-6 flex flex-wrap items-start gap-3"
          }
        >
          {organization && (
            <div className="col-span-full flex w-full flex-wrap items-center gap-3">
              <span className="font-semibold">{organization}</span>
              <Link
                to="/jobs?view=all"
                className="text-sm text-primary underline"
              >
                Clear employer filter
              </Link>
            </div>
          )}
          {!training && user.role === "jobseeker" && (
            <button
              className={savedOnly ? primaryStyle : secondaryStyle}
              aria-pressed={savedOnly}
              onClick={() => setSavedOnly(!savedOnly)}
            >
              {savedOnly ? "Show all vacancies" : "Saved vacancies"}
            </button>
          )}
          <SearchInput
            label={`Search ${
              directory ? "employers" : training ? "training" : "vacancies"
            }`}
            value={search}
            onChange={setSearch}
            loading={r.loading}
            placeholder={
              directory
                ? "Search organization name"
                : training
                  ? "Search programs, providers or skills"
                  : "Search job title, employer, location or skill"
            }
            suggestions={searchSuggestions(records, search, [
              "title",

              "organization",

              "provider",

              "location",

              "skills",
            ])}
          />
          {training ? (
            <select
              aria-label="Filter training catalog"
              className={`${inputStyle} max-w-64`}
              value={catalogFilter}
              onChange={(event) => setCatalogFilter(event.target.value)}
            >
              <option value="all">All training records</option>
              <option value="online_course">TESDA online courses</option>
              <option value="registered_program">
                TESDA registered programs
              </option>
              <option value="overseas_training">
                Official overseas training
              </option>
              <option value="partner_program">
                Connected provider programs
              </option>
            </select>
          ) : (
            !directory &&
            (!employer || view === "all") && (
              <select
                aria-label="Filter vacancy availability"
                className={`${inputStyle} max-w-64`}
                value={availabilityFilter}
                onChange={(event) => setAvailabilityFilter(event.target.value)}
              >
                <option value="all">All reviewed listings</option>
                <option value="source_lists_open">
                  Source-listed open postings
                </option>
              </select>
            )
          )}
          {canManage && (!employer || view === "mine") && (
            <select
              aria-label="Filter by publication status"
              className={`${inputStyle} max-w-48`}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {(training
                ? statusField.options.map((value) => ({
                    value,
                    label: value.replaceAll("_", " "),
                  }))
                : vacancyStatusOptions
              ).map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
          {employer && !directory && (
            <>
              <input
                aria-label="Filter by location"
                placeholder="Any location"
                maxLength={160}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className={`${inputStyle} max-w-48`}
              />
              <select
                aria-label="Filter by employment type"
                value={employment}
                onChange={(event) => setEmployment(event.target.value)}
                className={`${inputStyle} max-w-48`}
              >
                <option value="">All types</option>
                {vacancyFields
                  .find(({ name }) => name === "employment_type")
                  .options.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
              </select>
            </>
          )}
          {employer && (
            <select
              aria-label="Sort results"
              value={directory && sort === "newest" ? "title" : sort}
              onChange={(event) => setSort(event.target.value)}
              className={`${inputStyle} max-w-44`}
            >
              {!directory && (
                <>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </>
              )}
              <option value="title">Name A–Z</option>
              <option value="-title">Name Z–A</option>
            </select>
          )}
        </div>
      )}
      <ResourceState
        resource={r}
        skeleton={
          employer && !id ? (
            <TableSkeleton
              kind="employer-vacancies"
              columns={directory ? 3 : 6}
            />
          ) : (
            <CatalogSkeleton detail={Boolean(id)} training={training} />
          )
        }
      >
        {id && !detail ? (
          <Empty title="Record unavailable">
            This record may be closed or outside your permitted catalog.{" "}
            <Link to={catalogReturn} className="underline">
              Return to the catalog.
            </Link>
          </Empty>
        ) : detail ? (
          <DetailSurface
            title={detail.title}
            embedded={Boolean(previewId)}
            onClose={() => navigate(catalogReturn)}
          >
            <Link
              to={catalogReturn}
              onClick={onPreviewClose}
              className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            >
              ← Back to catalog
            </Link>
            {detail &&
              canManageRecord(detail) &&
              (!employer || !detail.external_application) && (
                <div className="mb-5 flex flex-wrap gap-3">
                  {training &&
                    detail.external_enrollment &&
                    staffRole(user.role) && (
                      <button
                        className={addStyle}
                        onClick={() => setIntake(detail)}
                      >
                        Create verified local intake
                      </button>
                    )}
                  <button
                    className={dangerStyle}
                    onClick={() => setRemoving(detail)}
                  >
                    Delete {training ? "training" : "vacancy"}
                  </button>
                </div>
              )}

            {!previewId && message && <Notice>{message}</Notice>}
            {error && (
              <div
                ref={feedback}
                tabIndex={-1}
                aria-label="Request feedback"
                className="mb-5 scroll-mt-28"
              >
                <Notice error>{error}</Notice>
              </div>
            )}
            <Detail
              record={detail}
              training={training}
              canManage={canManageRecord(detail)}
              role={user.role}
              busy={busy}
              saved={summary.data?.saved?.includes(detail.id)}
              edit={edit}
              action={action}
            />
            {training && staff && !detail.external_enrollment && (
              <TrainingParticipants program={detail} onChanged={r.reload} />
            )}
          </DetailSurface>
        ) : employer ? (
          filtered.length ? (
            <EmployerVacancyTable
              rows={filtered}
              view={view}
              searchParams={returnQuery}
              canManage={canManageRecord}
              edit={edit}
              remove={setRemoving}
            />
          ) : (
            <Empty
              title={
                view === "mine" &&
                !query &&
                filter === "all" &&
                !locationQuery &&
                !employment
                  ? "No vacancies yet"
                  : "No matching results"
              }
            >
              {view === "mine" &&
              !query &&
              filter === "all" &&
              !locationQuery &&
              !employment
                ? "Use Add vacancy to create your first posting and submit it for PESO review."
                : "Try a different search or adjust the filters."}
            </Empty>
          )
        ) : (
          <>
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
                      {!training && <VacancyStatus record={v} />}
                      {training && canManage && (
                        <Badge>{v.status.replaceAll("_", " ")}</Badge>
                      )}
                      <Sample record={v} />
                      <Source record={v} />
                      <Verification record={v} />
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
                            ? v.catalog_type === "registered_program"
                              ? "Registration listed · intake not confirmed"
                              : v.catalog_type === "overseas_training"
                                ? "Overseas announcement · confirm intake"
                                : "Self-paced · official provider"
                            : `${Math.max(0, v.capacity - Number(v.occupied_places || 0))} / ${v.capacity} places available · Starts ${date(v.starts_on)}`
                          : v.external_application
                            ? "Confirm availability on source"
                            : `Apply by ${date(v.deadline)}`}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`${training ? "/training" : "/jobs"}/${v.id}`}
                          className="action-view inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
                        >
                          View {training ? "program" : "vacancy"}
                          <ArrowRight size={16} />
                        </Link>
                        {canManageRecord(v) && (
                          <button
                            className={dangerStyle}
                            onClick={() => setRemoving(v)}
                          >
                            Delete {training ? "training" : "vacancy"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </ResourceState>
    </>
  )
}

export function Detail({
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
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <article className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge>{training ? v.mode : v.employment_type}</Badge>
          {!training && <VacancyStatus record={v} />}
          <Sample record={v} />
          <Source record={v} />
          <Verification record={v} />
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
                    ? v.catalog_type === "registered_program" ||
                      v.catalog_type === "overseas_training"
                      ? "Confirm current intake with provider"
                      : "Self-paced"
                    : `${date(v.starts_on)} – ${date(v.ends_on)}`,
                ],

                ["Schedule", v.schedule],
                ...(!v.external_enrollment
                  ? [
                      [
                        "Enrollment availability",
                        `${Math.max(0, v.capacity - Number(v.occupied_places || 0))} available / ${v.capacity} places · ${v.occupied_places || 0} confirmed · ${v.pending_requests || 0} pending review`,
                      ],
                    ]
                  : []),

                [
                  "Program capacity",

                  v.capacity === null
                    ? "Check with provider"
                    : `${v.capacity} places`,
                ],

                [
                  "Training fee",

                  v.fee === null
                    ? "Not disclosed · confirm with provider"
                    : Number(v.fee)
                      ? money(v.fee)
                      : v.external_enrollment
                        ? v.catalog_type === "overseas_training"
                          ? "Free as announced · confirm eligibility"
                          : "Free online course"
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
                      ? /\/\s*(month|day|hour)|per\s+(month|day|hour)/i.test(
                          v.source_salary,
                        )
                        ? v.source_salary
                        : `${v.source_salary} · confirm pay period with employer`
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
        <div className="mt-7 space-y-3">
          {role === "jobseeker" && (
            <>
              {training && v.external_enrollment ? (
                <Notice>
                  Training interest helps PESO plan future offerings. It is not
                  enrollment, provider confirmation or a reserved place.
                </Notice>
              ) : (
                <CollectionNotice kind={training ? "enrollment" : "referral"} />
              )}
              {(v.external_application || v.external_enrollment) && (
                <p className="record-emphasis text-sm leading-6">
                  Submit here to PESO Bansud, Oriental Mindoro. PESO checks
                  current availability and coordinates with the employer or
                  provider before confirming the next step.
                </p>
              )}
              {training && !v.external_enrollment && (
                <label className="flex items-start gap-3 text-sm leading-6">
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
                disabled={
                  busy ||
                  (training &&
                    !v.external_enrollment &&
                    (!consent || Number(v.occupied_places) >= v.capacity))
                }
                className={`${primaryStyle} w-full`}
                onClick={() => action(v)}
              >
                {training
                  ? v.external_enrollment
                    ? "Express training interest"
                    : Number(v.occupied_places) >= v.capacity
                      ? "Training full"
                      : "Apply for this training intake"
                  : "Apply through PESO · request referral"}
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
                to={
                  training
                    ? v.external_enrollment
                      ? "/training-demand"
                      : "/enrollments"
                    : "/referrals"
                }
                className="block py-2 text-center text-sm font-semibold text-primary underline"
              >
                View my{" "}
                {training
                  ? v.external_enrollment
                    ? "training interest"
                    : "enrollments"
                  : "referrals"}
              </Link>
            </>
          )}
          {canManage && !v.external_application && !v.external_enrollment && (
            <button
              onClick={() => edit(v)}
              className={`${primaryStyle} w-full`}
            >
              Edit record
            </button>
          )}
          {canManage && !training && !v.external_application && (
            <button
              onClick={() => edit(v, true)}
              className={`${secondaryStyle} w-full`}
            >
              Update vacancy status
            </button>
          )}
          {v.source_url && (
            <a
              href={v.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${secondaryStyle} w-full`}
            >
              View official source information
            </a>
          )}
          {(v.external_application || v.external_enrollment) && (
            <p className="text-xs leading-6 text-muted-foreground">
              The source link supports PESO review. Your request and progress
              stay in this system. PESO must verify the current employer opening
              or create a provider-confirmed local intake before approval; no
              application is automatically sent to an external agency.
            </p>
          )}
        </div>
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          {training
            ? v.external_enrollment
              ? "Interest is recorded for planning only. Apply separately when PESO publishes a scheduled intake. No place or certificate is promised."
              : "Your application is reviewed before a place is confirmed. Program completion does not automatically issue a TESDA National Certificate."
            : v.external_application
              ? "PESO reviews and coordinates your application; the employer decides eligibility and hiring. A match or course does not guarantee employment."
              : "A PESO referral is an employment facilitation step. The employer decides hiring; a match does not guarantee a job."}
        </p>
      </aside>
    </div>
  )
}

export function MatchesPage() {
  const baseline = useResource("/matches")
  const aiStatus = useResource("/ai/status")
  const [semantic, setSemantic] = useState(null)
  const [semanticBusy, setSemanticBusy] = useState(false)
  const [semanticError, setSemanticError] = useState("")
  const [aiConsent, setAiConsent] = useState(false)
  const [language, setLanguage] = useState("en")
  async function semanticPage(page = 1) {
    setSemanticBusy(true)
    setSemanticError("")
    try {
      const data = await api("/ai/semantic-matches", "POST", {
        consent: aiConsent,
        notice_version: aiStatus.data?.notice_version,
        language,
        page,
      })
      setSemantic(data)
    } catch (e) {
      setSemanticError(e.message)
    } finally {
      setSemanticBusy(false)
    }
  }
  const r = semantic
    ? {
        data: semantic,
        loading: semanticBusy,
        error: "",
        setPage: semanticPage,
        reload: () => semanticPage(semantic.current_page),
      }
    : baseline

  const [tab, setTab] = useState("jobs")

  return (
    <>
      <Heading
        title="Job Matching & Referral"
        description="Understand how your profile connects to vacancies, and which training can help address skill gaps."
      />
      <Notice>
        {semantic
          ? `Semantic relevance from ${semantic.model}. Cosine similarity (-1 to 1) ranks meaning; it is not a probability of being hired. Explicit education, licenses and other qualifications require separate human review.`
          : "TF-IDF comparison baseline: 75% declared skill coverage + 25% TF-IDF profile similarity. No pretrained AI model is used for these baseline results. Missing declared skills are not proof that a person lacks them."}
      </Notice>
      <AiConsent
        status={aiStatus.data}
        consent={aiConsent}
        onConsent={(v) => {
          setAiConsent(v)
          if (!v) setSemantic(null)
        }}
        language={language}
        onLanguage={setLanguage}
        disabled={semanticBusy}
        autoOpen
      />
      {aiStatus.error && <Notice error>{aiStatus.error}</Notice>}
      <section
        aria-label="Ranking method"
        className="my-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:p-5"
      >
        <div>
          <h2 className="font-semibold">Ranking method</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {semantic
              ? "Semantic AI is active. Qualifications still need review."
              : "TF-IDF baseline is active. External AI processing is optional."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            aria-pressed={Boolean(semantic)}
            className={semantic ? primaryStyle : secondaryStyle}
            disabled={!aiConsent || !aiStatus.data?.configured || semanticBusy}
            onClick={() => semanticPage(1)}
          >
            {semanticBusy ? "Ranking with model…" : "Rank with semantic AI"}
          </button>
          <button
            aria-pressed={!semantic}
            className={!semantic ? primaryStyle : secondaryStyle}
            disabled={semanticBusy}
            onClick={() => {
              setSemantic(null)
              setSemanticError("")
            }}
          >
            Show TF-IDF baseline
          </button>
        </div>
      </section>
      {semanticError && (
        <Notice error>
          {semanticError}{" "}
          {semantic
            ? "The previous semantic ranking remains displayed."
            : "The TF-IDF baseline below remains explicitly labeled."}
        </Notice>
      )}
      <div
        className="my-6 flex flex-wrap gap-x-6 border-b border-border"
        aria-label="Recommendation views"
      >
        {[
          ["jobs", "Recommended vacancies"],

          ["training", "Skills development recommendations"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`min-h-12 border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ResourceState
        resource={r}
        paginate={tab === "jobs"}
        skeleton={<MatchesSkeleton training={tab !== "jobs"} />}
      >
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
                      {semantic
                        ? a.semantic_similarity.toFixed(3)
                        : `${a.score}%`}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {semantic ? "semantic relevance" : "baseline alignment"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold text-primary">
                      Declared skill overlap
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {a.matched_skills.join(", ") ||
                        "No declared skill overlap yet"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-accent">
                      Required skills not declared
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
                {semantic && (
                  <p className="mt-4 text-xs leading-6 text-muted-foreground">
                    Baseline comparison: {a.baseline_score}% alignment.
                    Qualifications: not assessed. Review the vacancy
                    requirements and your evidence with PESO.
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <Link
                    to={`/ai-workspace?vacancy=${v.id}`}
                    className={secondaryStyle}
                  >
                    Career advice, résumé & interview
                  </Link>
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
            {r.data?.training_total > (r.data?.training?.length || 0) && (
              <Notice>
                Showing {r.data.training.length} suggestions from{" "}
                {r.data.training_total.toLocaleString()} training records.{" "}
                <Link to="/training" className="font-semibold underline">
                  Browse and search the full training catalog.
                </Link>
              </Notice>
            )}
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
                    Review program & availability
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

function DetailSurface({ embedded, title, onClose, children }) {
  return embedded ? (
    <>{children}</>
  ) : (
    <Modal title={title} onClose={onClose}>
      {children}
    </Modal>
  )
}
