import { ArrowRight, BriefcaseBusiness } from "lucide-react"

import { Button, EmptyState, panel } from "../common/UI.jsx"

import { JourneyLink } from "../common/JourneyLink.jsx"

export function CompactRecommendations({ jobs }) {
  return (
    <section data-tour="jobs" className={`${panel} overflow-hidden`}>
      <h2 className="px-4 py-4 text-sm font-semibold">Recommended Jobs</h2>
      {jobs.length ? (
        <ul className="divide-y divide-border px-4">
          {jobs.map((job) => (
            <li key={job.id} className="py-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <BriefcaseBusiness size={18} />
                </span>
                <div className="min-w-0">
                  <JourneyLink
                    to={`/jobseeker/jobs/${job.id}`}
                    className="text-xs font-semibold leading-5 text-primary hover:underline"
                  >
                    {job.title}
                  </JourneyLink>
                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    {job.company}
                    <br />
                    {job.location}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-primary">
                    {job.matchScore}% match{" "}
                    <span className="font-normal text-muted-foreground">
                      · {job.matchLabel}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No recommended jobs"
          description="Update your profile to explore opportunities."
        />
      )}
      <JourneyLink
        to="/jobs?tab=recommended"
        className="flex min-h-12 items-center gap-2 border-t border-border px-4 text-[11px] font-medium text-primary hover:bg-muted"
      >
        View all recommended jobs <ArrowRight size={15} />
      </JourneyLink>
    </section>
  )
}
