import { useState } from "react"

import { useParams, useSearchParams } from "react-router"

import {
  ArrowLeft,
  BriefcaseBusiness,
  GraduationCap,
  Handshake,
  Search,
} from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import {
  Button,
  EmptyState,
  Field,
  panel,
} from "../../components/common/UI.jsx"

import { JourneyLink } from "../../components/common/JourneyLink.jsx"

import { JobCard } from "../../components/jobs/JobCard.jsx"

import { MatchAnalysisDialog } from "../../components/jobs/JobsGuidance.jsx"

import { FeedPost } from "../../components/dashboard/EmploymentFeed.jsx"

import { mockFeed, additionalFeed } from "../../data/mockFeed.js"

import { recommendedJobIds } from "../../data/mockJobs.js"

import { helpArticles } from "../../data/helpArticles.js"

const includes = (value, query) =>
  !query ||
  String(value).toLocaleLowerCase().includes(query.toLocaleLowerCase())

export function SearchPage() {
  const [params, setParams] = useSearchParams(),
    data = useDashboard(),
    [explained, setExplained] = useState(null)

  const query = params.get("q") || "",
    category = params.get("filter") || "all",
    location = params.get("location") || "",
    type = params.get("type") || "",
    recommended = params.get("recommended") === "1"

  const change = (key, value) => {
    const next = new URLSearchParams(params)

    value ? next.set(key, value) : next.delete(key)

    setParams(next)
  }

  const jobs = data.jobs.filter(
    (job) =>
      includes(
        [
          job.title,

          job.company,

          job.category,

          job.location,

          ...job.qualifications,
        ].join(" "),

        query,
      ) &&
      includes(job.location, location) &&
      (!type || job.employmentType === type) &&
      (!recommended || recommendedJobIds.includes(job.id)),
  )

  const training = data.trainings.filter((item) =>
    includes(
      [item.title, item.skillAddressed, item.provider, item.category].join(" "),

      query,
    ),
  )

  const posts = mockFeed.filter((item) =>
    includes(
      `${item.organization} ${item.title} ${item.description} ${item.details}`,

      query,
    ),
  )

  const assistance = includes(
    "PESO assistance support referral follow-up request employment",

    query,
  )

  const count =
    (category === "all" || category === "jobs" ? jobs.length : 0) +
    (category === "all" || category === "training" ? training.length : 0) +
    (category === "all" || category === "posts" ? posts.length : 0) +
    ((category === "all" || category === "assistance") && assistance ? 1 : 0)

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[265px_minmax(0,1fr)]">
      <aside className={`${panel} p-4 lg:sticky lg:top-20`}>
        <h1 className="text-xl font-semibold">Search results</h1>
        <p className="mt-2 break-words text-xs leading-6 text-muted-foreground">
          {query ? `Results for “${query}”` : "Explore PesoMatch"}
        </p>
        <nav aria-label="Search filters" className="mt-4 space-y-1">
          {[
            ["all", "All"],

            ["jobs", "Jobs"],

            ["training", "Training"],

            ["posts", "Posts"],

            ["assistance", "PESO Assistance"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={category === id}
              onClick={() => change("filter", id)}
              className={`flex min-h-11 w-full items-center rounded-lg px-3 text-xs ${
                category === id
                  ? "bg-secondary font-semibold text-primary"
                  : "hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        {["jobs", "all"].includes(category) && (
          <div className="mt-5 space-y-4 border-t border-border pt-4">
            <Field
              label="Job location"
              value={location}
              onChange={(e) => change("location", e.target.value)}
            >
              <option value="">All locations</option>
              {[...new Set(data.jobs.map((job) => job.location))].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </Field>
            <Field
              label="Employment type"
              value={type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">All types</option>
              {[...new Set(data.jobs.map((job) => job.employmentType))].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </Field>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={recommended}
                onChange={(e) =>
                  change("recommended", e.target.checked ? "1" : "")
                }
                className="size-4 accent-primary"
              />
              Recommended jobs only
            </label>
            <Button
              variant="text"
              className="!px-0 text-xs"
              onClick={() => setParams(query ? { q: query } : {})}
            >
              Clear filters
            </Button>
          </div>
        )}
      </aside>
      <div className="min-w-0 space-y-5">
        <p role="status" className="text-xs text-muted-foreground">
          {count} {count === 1 ? "result" : "results"} · Sample opportunities
          and supplied posts
        </p>
        {["all", "jobs"].includes(category) && jobs.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold">Jobs</h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onExplain={setExplained} />
              ))}
            </div>
          </section>
        )}
        {["all", "training"].includes(category) && training.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold">Training</h2>
            <div className="space-y-3">
              {training.map((item) => (
                <JourneyLink
                  key={item.id}
                  to={`/training/${item.id}`}
                  className={`${panel} flex items-start gap-3 p-5 hover:border-primary/40`}
                >
                  <GraduationCap size={20} className="shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {item.provider} · {item.skillAddressed}
                    </p>
                  </div>
                </JourneyLink>
              ))}
            </div>
          </section>
        )}
        {["all", "posts"].includes(category) && posts.length > 0 && (
          <section className="max-w-[680px] space-y-4">
            <h2 className="text-base font-semibold">Posts</h2>
            {posts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </section>
        )}
        {["all", "assistance"].includes(category) && assistance && (
          <section className={`${panel} p-5`}>
            <Handshake size={22} className="text-primary" />
            <h2 className="mt-3 text-base font-semibold">PESO Assistance</h2>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Review requests, public updates and referral outcomes.
            </p>
            <Button to="/jobseeker/assistance" className="mt-4 text-xs">
              Explore PESO Assistance
            </Button>
          </section>
        )}
        {!count && (
          <EmptyState
            icon={Search}
            title="No matching results"
            description="Try another job title, skill, organization or location."
            action={<Button onClick={() => setParams({})}>Clear search</Button>}
          />
        )}
      </div>
      <MatchAnalysisDialog job={explained} onClose={() => setExplained(null)} />
    </div>
  )
}

export function FeedDetailsPage() {
  const { id } = useParams(),
    post = [...mockFeed, ...additionalFeed].find((item) => item.id === id)

  return (
    <div className="mx-auto max-w-[700px]">
      <Button to="/dashboard" variant="text" className="mb-4 !px-0 text-xs">
        <ArrowLeft size={15} />
        Back to Home
      </Button>
      {post ? (
        <FeedPost post={post} detailed />
      ) : (
        <EmptyState
          title="Announcement not found"
          description="This supplied announcement isn't available."
        />
      )}
    </div>
  )
}

export function HelpPage() {
  const { profile } = useDashboard(),
    { id } = useParams(),
    [params, setParams] = useSearchParams(),
    [query, setQuery] = useState(params.get("q") || "")

  const article = helpArticles.find((item) => item.id === id),
    topic = params.get("topic"),
    term = params.get("q") || ""

  const results = helpArticles.filter(
    (item) =>
      (!topic || item.topic === topic) &&
      includes(`${item.title} ${item.text} ${item.topic}`, term),
  )

  return (
    <>
      <header className="rounded-xl bg-primary px-5 py-8 text-white sm:px-10">
        <p className="text-base font-semibold">PesoMatch Help</p>
        <h1 className="mt-6 text-2xl font-semibold">
          Hi {profile.firstName}, we're here to help.
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()

            setParams(query.trim() ? { q: query.trim() } : {})
          }}
          className="mt-5 flex max-w-[740px] overflow-hidden rounded-lg bg-white text-foreground"
        >
          <input
            aria-label="Search help articles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="How can we help?"
            maxLength={120}
            className="min-h-12 min-w-0 flex-1 px-4 text-sm outline-none"
          />
          <button
            aria-label="Search help"
            className="grid w-12 place-items-center border-l border-border text-primary"
          >
            <Search size={18} />
          </button>
        </form>
      </header>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {article ? (
            <section className={`${panel} p-6`}>
              <Button to="/help" variant="text" className="mb-4 !px-0 text-xs">
                <ArrowLeft size={15} />
                Back to Help
              </Button>
              <p className="text-xs text-primary">{article.topic}</p>
              <h2 className="mt-3 text-xl font-semibold">{article.title}</h2>
              <p className="mt-4 text-sm leading-8">{article.text}</p>
              <Button to={article.link[1]} className="mt-5 text-xs">
                {article.link[0]}
              </Button>
            </section>
          ) : (
            <>
              {!topic && !term && (
                <section className={`${panel} mb-5 p-6`}>
                  <h2 className="text-base font-semibold">
                    PesoMatch shortcuts
                  </h2>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {helpArticles

                      .filter((item) =>
                        [
                          "email",

                          "password",

                          "profile",

                          "jobs",

                          "assistance",

                          "privacy",
                        ].includes(item.id),
                      )

                      .map((item) => (
                        <JourneyLink
                          key={item.id}
                          to={`/help/${item.id}`}
                          className="flex min-h-11 items-center text-xs font-medium text-primary hover:underline"
                        >
                          {item.title}
                        </JourneyLink>
                      ))}
                  </div>
                  <h2 className="mt-6 text-base font-semibold">
                    Recommended topics
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[...new Set(helpArticles.map((item) => item.topic))].map(
                      (label) => (
                        <button
                          key={label}
                          onClick={() => setParams({ topic: label })}
                          className="min-h-24 rounded-lg border border-border p-3 text-xs font-medium text-primary hover:bg-muted"
                        >
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                </section>
              )}
              <section className={`${panel} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-base font-semibold">
                    {term
                      ? `Help results for “${term}”`
                      : topic || "Suggested articles"}
                  </h2>
                  {(term || topic) && (
                    <Button
                      variant="text"
                      onClick={() => {
                        setParams({})

                        setQuery("")
                      }}
                      className="!px-0 text-xs"
                    >
                      View all
                    </Button>
                  )}
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {results.map((item) => (
                    <li key={item.id} className="py-4">
                      <JourneyLink
                        to={`/help/${item.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {item.title}
                      </JourneyLink>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        {item.text.split(". ")[0]}.
                      </p>
                    </li>
                  ))}
                </ul>
                {!results.length && (
                  <p
                    role="status"
                    className="py-5 text-xs text-muted-foreground"
                  >
                    No matching articles. Try “profile”, “password” or
                    “assistance”.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
        <aside className={`${panel} h-fit p-6`}>
          <h2 className="text-base font-semibold">Other ways we can help</h2>
          {[
            [
              "Your account",

              "Manage security and preferences.",

              "/jobseeker/settings",
            ],

            [
              "Privacy Policy",

              "Read about the current account service.",

              "/privacy",
            ],

            [
              "Support preview",

              "Explore help shortcuts in Admin Center.",

              "/business/admin-center?support=1",
            ],
          ].map(([label, description, to]) => (
            <div key={label} className="mt-6">
              <h3 className="text-sm font-medium">{label}</h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                {description}
              </p>
              <JourneyLink
                to={to}
                className="inline-flex min-h-10 items-center text-xs font-medium text-primary"
              >
                Learn more
              </JourneyLink>
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}
