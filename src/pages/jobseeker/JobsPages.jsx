import { useRef, useState } from "react"

import { useLocation, useParams, useSearchParams } from "react-router"

import { ArrowLeft, MapPin, Share2, SlidersHorizontal } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "../../components/common/Feedback.jsx"

import {
  Badge,
  Button,
  EmptyState,
  PageHeading,
  panel,
} from "../../components/common/UI.jsx"

import { JourneyLink } from "../../components/common/JourneyLink.jsx"

import { ViewTabs } from "../../components/common/ViewTabs.jsx"

import {
  SaveButton,
  AssistanceRequest,
} from "../../components/common/JobActions.jsx"

import {
  CompanyMark,
  WorkplaceBanner,
} from "../../components/jobs/JobVisuals.jsx"

import { JobCard } from "../../components/jobs/JobCard.jsx"

import {
  JobFilterPanel,
  JobFilterDrawer,
  JobSearchBar,
  SelectedFilters,
} from "../../components/jobs/JobFilters.jsx"

import {
  JobsGuidance,
  MatchAnalysisDialog,
  matchDisclaimer,
} from "../../components/jobs/JobsGuidance.jsx"

import {
  JobEmptyState,
  JobCardSkeleton,
  JobDetailsSkeleton,
  MatchPanelSkeleton,
  JobsErrorState,
} from "../../components/jobs/JobStates.jsx"

import { searchJobs } from "../../services/jobsService.js"

import { recommendedJobIds, demoMatchProfile } from "../../data/mockJobs.js"

export const JobListingCard = (props) => (
  <JobCard recommended={props.matches} {...props} />
)

export function JobsPage() {
  const { jobs, savedJobs } = useDashboard()

  const [params, setParams] = useSearchParams()

  // Keep consecutive controls on the latest requested URL while a router
  // transition is pending. Otherwise sorting can restore a removed filter.
  const latestParams = useRef(params)
  const observedParams = useRef(params.toString())
  if (observedParams.current !== params.toString()) {
    observedParams.current = params.toString()
    latestParams.current = params
  }

  const tab = ["recommended", "browse", "saved"].includes(params.get("tab"))
    ? params.get("tab")
    : "recommended"

  const keys = [
    "q",

    "category",

    "location",

    "employmentType",

    "experienceLevel",

    "educationLevel",

    "workArrangement",

    "matchLabel",
  ]

  const applied = Object.fromEntries(
    keys.map((key) => [key, params.get(key) || ""]),
  )

  const [draft, setDraft] = useState(applied),
    [drawer, setDrawer] = useState(false),
    [explained, setExplained] = useState(null),
    [selected, setSelected] = useState(null)

  const [query, setQuery] = useState(applied.q),
    [page, setPage] = useState(0)

  const [syncedQuery, setSyncedQuery] = useState(params.toString())

  if (syncedQuery !== params.toString()) {
    // Synchronize URL changes before committing controls, so late effects

    // cannot overwrite a newly entered search or filter selection.

    setSyncedQuery(params.toString())

    setDraft(applied)

    setQuery(applied.q)
  }

  const sort = params.get("sort") || "recommended"

  const updateParams = (values) => {
    const next = new URLSearchParams(latestParams.current)

    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    )

    latestParams.current = next

    setPage(0)

    setParams(next, { flushSync: true })
  }

  const apply = () => updateParams({ ...draft, q: query })

  const clear = () => {
    setDraft({})

    setQuery("")

    setPage(0)

    latestParams.current = new URLSearchParams({ tab })
    setParams(latestParams.current, { flushSync: true })
  }

  const source = jobs.filter((job) =>
    tab === "saved"
      ? savedJobs.includes(job.id)
      : tab === "recommended"
        ? recommendedJobIds.includes(job.id)
        : true,
  )

  const visible = searchJobs(source, applied, sort)

  const count = Math.max(1, Math.ceil(visible.length / 6)),
    safePage = Math.min(page, count - 1),
    shown = visible.slice(safePage * 6, safePage * 6 + 6)

  const focused = visible.find((job) => job.id === selected) || shown[0]

  const preview = params.get("preview")

  return (
    <>
      <PageHeading
        title="Jobs"
        actions={
          <Button
            to="/jobseeker/onboarding/5?review=1"
            variant="secondary"
            className="text-xs"
          >
            Job Preferences
          </Button>
        }
      />
      <ViewTabs
        label="Jobs views"
        items={[
          ["recommended", "Recommended for You"],

          ["browse", "Browse All Jobs"],

          ["saved", `Saved Jobs (${savedJobs.length})`],
        ]}
        value={tab}
        onChange={(value) => updateParams({ tab: value })}
      />
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        key={tab}
        className="tab-enter"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {tab === "recommended"
              ? "Recommended for You"
              : tab === "saved"
                ? "Saved Jobs"
                : "Available job vacancies"}
          </h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {tab === "recommended"
              ? "These sample opportunities may fit your current profile and preferences."
              : tab === "saved"
                ? "Your browser bookmarks, ready to review when you return."
                : "Discover fictional opportunities across roles and locations."}
          </p>
          {tab === "recommended" && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  ...demoMatchProfile.preferredFields,

                  demoMatchProfile.preferredLocation,

                  demoMatchProfile.employmentType,
                ]

                  .filter(Boolean)

                  .map((value) => (
                    <Badge key={value}>{value}</Badge>
                  ))}
                <Button
                  to="/jobseeker/onboarding/5?review=1"
                  variant="text"
                  className="min-h-9 text-xs"
                >
                  Edit Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
        <JobSearchBar query={query} onChange={setQuery} onSubmit={apply} />
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(applied)

            setDrawer(true)
          }}
          className="mb-4 text-xs lg:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters
        </Button>
        <SelectedFilters
          values={applied}
          onClear={clear}
          onRemove={(key) => {
            updateParams({ [key]: "" })

            setDraft((value) => ({ ...value, [key]: "" }))

            if (key === "q") setQuery("")
          }}
        />
        <div className="grid items-start gap-5 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_280px]">
          <aside className={`${panel} hidden p-4 lg:block`}>
            <JobFilterPanel
              jobs={jobs}
              values={draft}
              onChange={(key, value) =>
                setDraft((before) => ({ ...before, [key]: value }))
              }
              onApply={apply}
              onClear={clear}
            />
          </aside>
          <section aria-label="Job results" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="text-xs text-muted-foreground">
                {visible.length} sample opportunities
              </p>
              <label className="text-xs">
                Sort by{" "}
                <select
                  aria-label="Sort by"
                  value={sort}
                  onChange={(event) =>
                    updateParams({ sort: event.target.value })
                  }
                  className="ml-2 min-h-10 max-w-40 rounded-md border border-border bg-white px-2"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest</option>
                  <option value="match">Highest Match</option>
                </select>
              </label>
            </div>
            {preview === "loading" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((id) => (
                  <JobCardSkeleton key={id} />
                ))}
              </div>
            ) : preview === "error" ? (
              <JobsErrorState onRetry={() => updateParams({ preview: "" })} />
            ) : shown.length ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {shown.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      recommended={tab !== "browse"}
                      onExplain={setExplained}
                      onPreview={setSelected}
                      selected={focused?.id === job.id}
                    />
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <Button
                    disabled={safePage === 0}
                    variant="secondary"
                    onClick={() => {
                      setPage((value) => value - 1)

                      setSelected(null)
                    }}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs">
                    Page {safePage + 1} of {count}
                  </span>
                  <Button
                    disabled={safePage + 1 === count}
                    variant="secondary"
                    onClick={() => {
                      setPage((value) => value + 1)

                      setSelected(null)
                    }}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <JobEmptyState
                saved={tab === "saved" && source.length === 0}
                recommended={tab === "recommended" && source.length === 0}
                onClear={clear}
              />
            )}
          </section>
          {preview === "loading" ? (
            <MatchPanelSkeleton />
          ) : (
            focused &&
            preview !== "error" && (
              <div className="lg:col-start-2 xl:col-auto">
                <JobsGuidance job={focused} onExplain={setExplained} />
              </div>
            )
          )}
        </div>
        <p className="mt-5 text-xs leading-6 text-muted-foreground">
          {matchDisclaimer} Matches are predefined and do not change when your
          profile is edited.
        </p>
      </div>
      <JobFilterDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        jobs={jobs}
        values={draft}
        onChange={(key, value) =>
          setDraft((before) => ({ ...before, [key]: value }))
        }
        onApply={apply}
        onClear={clear}
      />
      <MatchAnalysisDialog job={explained} onClose={() => setExplained(null)} />
    </>
  )
}

export function JobDetailsPage() {
  const { id } = useParams(),
    { jobs } = useDashboard(),
    { notify } = useFeedback()

  const [explained, setExplained] = useState(null)

  const job = jobs.find((item) => item.id === id)

  const location = useLocation()

  const [detailParams, setDetailParams] = useSearchParams()

  const backTo = location.state?.jobsReturn?.startsWith("/jobs")
    ? location.state.jobsReturn
    : new URLSearchParams(location.search).get("from") === "saved"
      ? "/jobs?tab=saved"
      : "/jobs?tab=browse"

  async function share() {
    const url = `${window.location.origin}/jobseeker/jobs/${job.id}`

    try {
      if (navigator.share) await navigator.share({ title: job.title, url })
      else {
        await navigator.clipboard.writeText(url)

        notify("Job link copied.")
      }
    } catch (error) {
      if (error.name !== "AbortError")
        notify(
          "We couldn't share this link. Copy the address from your browser.",

          { type: "error" },
        )
    }
  }

  if (["loading", "error"].includes(detailParams.get("preview")))
    return (
      <>
        <JourneyLink
          back
          to={backTo}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-primary"
        >
          <ArrowLeft size={15} />
          Back to Jobs
        </JourneyLink>
        <h1 className="mb-5 text-2xl font-semibold">Job Details</h1>
        {detailParams.get("preview") === "loading" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <JobDetailsSkeleton />
            <MatchPanelSkeleton />
          </div>
        ) : (
          <JobsErrorState
            onRetry={() => {
              const next = new URLSearchParams(detailParams)

              next.delete("preview")

              setDetailParams(next)
            }}
          />
        )}
      </>
    )

  if (!job)
    return (
      <EmptyState
        heading="h1"
        title="Job not found"
        description="This sample opportunity is no longer available."
        action={<Button to="/jobs?tab=browse">Browse All Jobs</Button>}
      />
    )

  return (
    <>
      <JourneyLink
        to={backTo}
        back
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-primary"
      >
        <ArrowLeft size={15} />
        Back to Jobs
      </JourneyLink>
      <div className="grid items-start gap-5 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)_300px]">
        <aside className={`${panel} hidden p-4 lg:block`}>
          <h2 className="text-sm font-semibold">Your next step</h2>
          <ol className="mt-4 space-y-4 text-xs leading-6 text-muted-foreground">
            <li>1. Review the opportunity</li>
            <li>2. Understand the sample match</li>
            <li>3. Explore relevant training</li>
            <li>4. Ask PESO for assistance</li>
          </ol>
          <Button
            to="/jobs?tab=recommended"
            variant="text"
            className="mt-3 !px-0 text-xs"
          >
            Recommended Jobs
          </Button>
          <Button
            to="/jobseeker/profile"
            variant="text"
            className="!px-0 text-xs"
          >
            Review Your Profile
          </Button>
        </aside>
        <article className={`${panel} min-w-0 overflow-hidden`}>
          <WorkplaceBanner />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CompanyMark job={job} />
              <p className="text-sm font-semibold">
                {job.company}
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Fictional employer / Sample vacancy
                </span>
              </p>
            </div>
            <h1 className="mt-5 text-2xl font-semibold leading-normal">
              {job.title}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-xs leading-6 text-muted-foreground">
              <MapPin size={14} />
              {job.location}
            </p>
            <dl className="my-5 grid grid-cols-2 gap-4 border-y border-border py-5 text-xs">
              {[
                ["Employment type", job.employmentType],

                ["Work arrangement", job.workArrangement],

                ["Experience", job.experienceLevel],

                ["Education", job.educationLevel],

                ["Posted", job.postedLabel],

                ["Salary", "Not specified"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-2 font-medium leading-6">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mb-6 flex flex-wrap gap-2">
              <SaveButton id={id} title={job.title} />
              <Button variant="secondary" onClick={share} className="text-xs">
                <Share2 size={15} />
                Share Job
              </Button>
            </div>
            <div className="space-y-6 text-xs leading-7">
              <section>
                <h2 className="text-base font-semibold">About the Job</h2>
                <p className="mt-2 text-muted-foreground">{job.description}</p>
              </section>
              {[
                ["Responsibilities", job.responsibilities],

                ["Minimum Qualifications", job.qualifications],

                ["Preferred Qualifications", job.preferredQualifications],

                ["Required Skills", job.requiredSkills],

                ["Preferred Skills", job.preferredSkills],
              ].map(([title, items]) => (
                <section key={title}>
                  <h2 className="text-base font-semibold">{title}</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
              <section>
                <h2 className="text-base font-semibold">
                  Employment Details & Location
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {job.employmentType}, {job.workArrangement.toLowerCase()} /{" "}
                  {job.location}. Availability and requirements are fictional.
                </p>
              </section>
            </div>
            <section className="mt-6 border-t border-border pt-5">
              <h2 className="text-base font-semibold">
                Let PESO help with your next step
              </h2>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">
                Review the role, improve your skills, and explore referral
                support. Final hiring decisions belong to employers.
              </p>
              <div className="mt-4">
                <AssistanceRequest job={job} />
              </div>
            </section>
          </div>
        </article>
        <div className="lg:col-start-2 xl:col-auto">
          <JobsGuidance job={job} onExplain={setExplained} />
        </div>
      </div>
      <MatchAnalysisDialog job={explained} onClose={() => setExplained(null)} />
    </>
  )
}
