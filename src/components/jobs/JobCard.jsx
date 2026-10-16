import { Check, CircleAlert, MapPin } from "lucide-react"

import { Badge, Button, panel } from "../common/UI.jsx"

import { JourneyLink } from "../common/JourneyLink.jsx"

import { SaveButton } from "../common/JobActions.jsx"

import { CompanyMark } from "./JobVisuals.jsx"

export function JobCard({
  job,
  recommended = false,
  onExplain,
  onPreview,
  selected = false,
  compact = false,
}) {
  return (
    <article
      className={`${panel} relative flex min-w-0 flex-col p-5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40 ${
        selected ? "border-primary/50" : ""
      }`}
    >
      <div className="flex items-center gap-3 pr-11">
        <CompanyMark job={job} small={compact} />
        <p className="text-xs font-medium leading-5">
          {job.company}
          <span className="mt-1 block text-[10px] font-normal text-muted-foreground">
            Fictional employer
          </span>
        </p>
      </div>
      <div className="absolute right-3 top-4 z-20">
        <SaveButton id={job.id} compact title={job.title} />
      </div>
      <h3 className="mt-4 text-sm font-semibold leading-6">
        <JourneyLink
          to={`/jobseeker/jobs/${job.id}`}
          className="after:absolute after:inset-0 after:rounded-xl focus:outline-none"
        >
          {job.title}
        </JourneyLink>
      </h3>
      <p className="mt-1 flex items-start gap-1 text-[11px] leading-6 text-muted-foreground">
        <MapPin size={13} className="mt-1 shrink-0" />
        {job.location}
      </p>
      <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
        {job.employmentType} / {job.workArrangement}
      </p>
      {!compact && (
        <p className="mt-3 line-clamp-2 text-xs leading-6 text-muted-foreground">
          {job.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-primary">
          {job.matchScore}% Match
        </span>
        <Badge>{job.matchLabel}</Badge>
      </div>
      {recommended && (
        <>
          <ul className="mt-3 grid gap-1 text-[11px] leading-6">
            {job.matchedCriteria.slice(0, compact ? 2 : 4).map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check size={13} className="shrink-0 text-[#216638]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-start gap-2 text-[11px] leading-6 text-[#805b12]">
            <CircleAlert size={14} className="mt-1 shrink-0" />
            {job.skillGaps[0]} / Needs attention
          </p>
        </>
      )}
      {!compact && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Posted {job.postedLabel}
        </p>
      )}
      <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-4">
        <Button
          to={`/jobseeker/jobs/${job.id}`}
          aria-label={`View ${job.title}`}
          className="min-h-10 !px-3 text-xs"
        >
          View Job
        </Button>
        {onExplain && (
          <Button
            variant="secondary"
            onClick={() => onExplain(job)}
            className="min-h-10 !px-3 text-xs"
          >
            Why You Match
          </Button>
        )}
        {onPreview && (
          <button
            onClick={() => onPreview(job.id)}
            aria-pressed={selected}
            className="min-h-10 text-xs text-primary hover:underline"
          >
            Preview guidance
          </button>
        )}
      </div>
    </article>
  )
}

export const RecommendedJobCard = (props) => <JobCard recommended {...props} />

export const SavedJobCard = JobCard
