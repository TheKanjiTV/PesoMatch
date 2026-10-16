import { useState } from "react"

import { useSearchParams } from "react-router"

import {
  Bookmark,
  BriefcaseBusiness,
  GraduationCap,
  Handshake,
  MapPin,
} from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  ProgressBar,
  Skeleton,
  panel,
} from "../../components/common/UI.jsx"

import { JourneyLink } from "../../components/common/JourneyLink.jsx"

import { JobCard } from "../../components/jobs/JobCard.jsx"

import { MatchAnalysisDialog } from "../../components/jobs/JobsGuidance.jsx"

import { FeedPost } from "../../components/dashboard/EmploymentFeed.jsx"

import { ProfileIdentity } from "../../components/common/ProfileIdentity.jsx"

import { CompactRecommendations } from "../../components/dashboard/CompactRecommendations.jsx"

import { mockFeed, additionalFeed } from "../../data/mockFeed.js"

import { recommendedJobIds } from "../../data/mockJobs.js"

import { AssistanceDashboardPanel } from "../../components/assistance/AssistanceDashboardPanel.jsx"

import { AssistanceOutcome } from "../../components/assistance/AssistanceComponents.jsx"

import { isActiveAssistance } from "../../services/assistanceService.js"

function SectionHeading({ title, to, action = "View all" }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      {to && (
        <JourneyLink
          to={to}
          className="min-h-9 py-2 text-[11px] font-medium text-primary hover:underline"
        >
          {action}
        </JourneyLink>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const data = useDashboard(),
    profile = data.profile,
    [params, setParams] = useSearchParams(),
    [explained, setExplained] = useState(null)

  const preview = params.get("preview"),
    empty = preview === "empty"

  const recommended = empty
    ? []
    : recommendedJobIds

        .slice(0, 3)

        .map((id) => data.jobs.find((job) => job.id === id))

        .filter(Boolean)

  const training = empty
    ? null
    : data.trainings.find((item) =>
        recommended[0]?.trainingIds.includes(item.id),
      )

  const assistance = empty
    ? null
    : data.requests.filter((item) => !isActiveAssistance(item)).at(-1)

  const loadedFeed = [
    ...additionalFeed.slice(0, data.feedExtraCount).reverse(),
    ...mockFeed,
  ]
  const feed = empty
    ? []
    : data.workspacePreferences.feedView === "recent"
      ? [...loadedFeed].reverse()
      : loadedFeed

  return (
    <>
      {data.profileError && (
        <div role="alert" className={`${panel} mb-5 p-4 text-sm`}>
          <p>We could not load your saved profile. {data.profileError}</p>
          <Button
            onClick={data.reloadProfile}
            variant="secondary"
            className="mt-3 text-xs"
          >
            Try Again
          </Button>
        </div>
      )}
      {preview === "loading" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((id) => (
            <Skeleton key={id} kind="profile" />
          ))}
          <Button onClick={() => setParams({})}>Return to Home</Button>
        </div>
      ) : preview === "error" ? (
        <ErrorState onRetry={() => setParams({})} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="space-y-4">
            <section data-tour="profile" className={`${panel} overflow-hidden`}>
              <img
                src="/images/career-workspace.jpg"
                alt=""
                className="h-20 w-full object-cover"
              />
              <div className="p-4">
                <Avatar name={profile.firstName} size="large" />
                <div className="mt-3">
                  <ProfileIdentity />
                </div>
                <p className="mt-3 flex items-start gap-1 text-[11px] leading-6 text-muted-foreground">
                  <MapPin size={13} className="mt-1" />
                  {profile.location ||
                    profile.preferredLocation ||
                    "Location not provided"}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span>Profile completion</span>
                  <strong className="text-primary">
                    {profile.profileCompletion}%
                  </strong>
                </div>
                <ProgressBar
                  value={profile.profileCompletion}
                  label="Profile completion"
                  className="mt-2"
                />
                <h3 className="mt-5 text-xs font-semibold">Job preferences</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {profile.preferredFields.join(", ") ||
                    (data.profileLoading
                      ? "Loading saved preferences..."
                      : "Review your saved job preferences.")}
                </p>
                <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                  {profile.preferredLocation} / {profile.employmentType}
                </p>
              </div>
            </section>
            <nav aria-label="Profile quick links" className={`${panel} p-3`}>
              {[
                ["Saved Jobs", "/jobs?tab=saved", Bookmark],

                [
                  "Job Preferences",

                  "/jobseeker/profile?edit=5",

                  BriefcaseBusiness,
                ],

                ["Training", "/training", GraduationCap],

                ["PESO Assistance", "/jobseeker/assistance", Handshake],
              ].map(([label, to, Icon]) => (
                <Button
                  key={to}
                  to={to}
                  variant="text"
                  className="w-full !justify-start text-xs"
                >
                  <Icon size={15} />
                  {label}
                </Button>
              ))}
            </nav>
          </aside>
          <section
            aria-label="Employment updates"
            data-tour="welcome"
            className="min-w-0 space-y-4"
          >
            <h1 className="sr-only">Home</h1>
            {data.feedRefreshing && (
              <div
                role="status"
                className={`${panel} flex items-center gap-3 p-4 text-sm`}
              >
                <span
                  className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  aria-hidden="true"
                />
                Refreshing posts...
              </div>
            )}
            {assistance?.outcome && (
              <AssistanceOutcome record={assistance} compact />
            )}
            {feed.length ? (
              feed.map((post) => <FeedPost key={post.id} post={post} />)
            ) : (
              <EmptyState
                title="No employment updates"
                description="No new employment updates are available right now."
              />
            )}
          </section>
          <aside className="space-y-5 lg:col-start-2 xl:col-auto">
            <CompactRecommendations jobs={recommended} />
            <section data-tour="training" className={`${panel} p-5`}>
              {recommended[0] && (
                <div className="mb-5 border-b border-border pb-4">
                  <h2 className="text-sm font-semibold">Skills to Improve</h2>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {recommended[0].skillStatuses

                      .map((row) => `${row.skill} / ${row.status}`)

                      .join("; ")}
                  </p>
                  <Button
                    to={`/jobseeker/jobs/${recommended[0].id}/skill-analysis`}
                    variant="text"
                    className="mt-1 !px-0 text-xs"
                  >
                    View Full Skill Analysis
                  </Button>
                </div>
              )}
              <SectionHeading title="Recommended Training" to="/training" />
              {training ? (
                <>
                  <img
                    src={training.image}
                    alt=""
                    className="mb-4 aspect-video w-full rounded-lg object-cover"
                  />
                  <p className="text-sm font-medium">{training.title}</p>
                  <p className="mt-2 text-xs leading-7 text-muted-foreground">
                    {training.skillAddressed} appears in the sample criteria for{" "}
                    {recommended[0].title}.
                  </p>
                  <Button
                    to={`/training/${training.id}?job=${recommended[0].id}`}
                    variant="secondary"
                    className="mt-3 text-xs"
                  >
                    View Training
                  </Button>
                </>
              ) : (
                <p className="text-xs leading-7 text-muted-foreground">
                  Training recommendations will appear when skill development
                  opportunities are identified.
                </p>
              )}
            </section>
            <AssistanceDashboardPanel empty={empty} />
          </aside>
        </div>
      )}
      <MatchAnalysisDialog job={explained} onClose={() => setExplained(null)} />
    </>
  )
}
