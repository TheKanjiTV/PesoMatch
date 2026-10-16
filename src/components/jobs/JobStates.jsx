import { BriefcaseBusiness, RotateCcw } from "lucide-react"

import { Button, EmptyState, Skeleton, panel } from "../common/UI.jsx"

export const JobCardSkeleton = () => <Skeleton kind="job" />

export const JobDetailsSkeleton = () => (
  <Skeleton kind="profile" label="Loading job details" />
)

export const MatchPanelSkeleton = () => (
  <Skeleton kind="summary" label="Loading match guidance" />
)

export function JobsErrorState({ onRetry }) {
  return (
    <div role="alert" className={`${panel} p-6`}>
      <h2 className="text-base font-semibold">
        We couldn't load job opportunities.
      </h2>
      <Button onClick={onRetry} variant="secondary" className="mt-4">
        <RotateCcw size={16} />
        Try Again
      </Button>
    </div>
  )
}

export function JobEmptyState({ saved = false, recommended = false, onClear }) {
  return (
    <EmptyState
      icon={BriefcaseBusiness}
      title={
        saved
          ? "No saved jobs yet."
          : recommended
            ? "No recommended jobs yet"
            : "No jobs found"
      }
      description={
        saved
          ? "Save opportunities you're interested in so you can review them later."
          : recommended
            ? "Complete or update your profile to help PesoMatch identify relevant opportunities."
            : "Try changing your search or filters."
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {onClear && (
            <Button variant="secondary" onClick={onClear}>
              Clear Filters
            </Button>
          )}
          <Button to="/jobs?tab=browse">Browse All Jobs</Button>
        </div>
      }
    />
  )
}
