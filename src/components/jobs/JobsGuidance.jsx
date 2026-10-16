import {
  describeMatchedCriterion,
  describeSkillStatus,
} from "../../data/mockJobs.js"

import { Check, CircleAlert, GraduationCap, Target } from "lucide-react"

import {
  Badge,
  Button,
  Modal,
  ProgressBar,
  StatusIcon,
  panel,
} from "../common/UI.jsx"

import { JourneyLink } from "../common/JourneyLink.jsx"

import { CompanyMark } from "./JobVisuals.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

export const matchDisclaimer =
  "Match results are sample decision-support data and do not guarantee employment."

export function MatchScoreCard({ job }) {
  return (
    <section aria-label="Match score">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-2xl font-semibold tabular-nums text-primary">
          {job.matchScore}% Match
        </h3>
        <Target size={20} className="text-primary" />
      </div>
      <div className="mt-2">
        <Badge>{job.matchLabel}</Badge>
      </div>
      <ProgressBar
        value={job.matchScore}
        label="Predefined sample match score"
        className="mt-4"
      />
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Sample comparison of a demonstration profile with this role's recorded
        criteria.
      </p>
    </section>
  )
}

export function SkillGapPanel({ job }) {
  const rows = [
    ...job.skillStatuses,

    ...job.matchedCriteria

      .filter((value) => !/education|location|preference/i.test(value))

      .slice(0, 1)

      .map((skill) => ({ skill, status: "Matched" })),
  ]

  return (
    <section>
      <h3 className="text-sm font-semibold">Skills to improve</h3>
      <ul className="mt-3 space-y-3">
        {rows.map(({ skill, status }) => (
          <li
            key={skill}
            className="flex flex-wrap items-center justify-between gap-2 text-xs"
          >
            <span className="flex items-center gap-2">
              <StatusIcon status={status} />
              {skill}
            </span>
            <span className="text-[10px] text-muted-foreground">{status}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
        Not in Profile means information is missing; it does not prove a lack of
        skill.
      </p>
      <Button
        to={`/jobseeker/jobs/${job.id}/skill-analysis`}
        variant="text"
        className="mt-1 !px-0 text-xs"
      >
        View Full Skill Analysis
      </Button>
      {job.skillStatuses[0] && (
        <Button
          to={`/training?tab=recommended&skill=${encodeURIComponent(job.skillStatuses[0].skill)}&job=${job.id}`}
          variant="text"
          className="!px-0 text-xs"
        >
          View Related Training
        </Button>
      )}
    </section>
  )
}

export function TrainingRecommendationCard({ job }) {
  const { trainings } = useDashboard()

  const item = job.trainingIds
    .map((id) => trainings.find((training) => training.id === id))
    .find(Boolean)

  return (
    <section id="recommended-training">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <GraduationCap size={17} />
        Recommended training
      </h3>
      {item ? (
        <>
          <p className="mt-3 text-xs font-semibold">{item.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {item.category} / Sample training
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Recommended to develop {item.skillAddressed.toLowerCase()} for the
            sample requirements of {job.title}.
          </p>
          <Button
            to={`/training/${item.id}?job=${job.id}`}
            variant="secondary"
            className="mt-3 min-h-10 text-xs"
          >
            View Training
          </Button>
        </>
      ) : (
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          Training recommendations will appear when skill development
          opportunities are identified.
        </p>
      )}
    </section>
  )
}

export function SimilarJobsPanel({ job }) {
  const { jobs } = useDashboard()

  const similar = jobs.filter((item) => job.similarJobIds.includes(item.id))

  return (
    <section>
      <h3 className="text-sm font-semibold">Similar jobs</h3>
      <ul className="mt-3 divide-y divide-border">
        {similar.slice(0, 3).map((item) => (
          <li key={item.id}>
            <JourneyLink
              to={`/jobseeker/jobs/${item.id}`}
              className="flex min-h-16 items-center gap-3 py-3 text-xs hover:text-primary"
            >
              <CompanyMark job={item} small />
              <span>
                <span className="block font-medium leading-5">
                  {item.title}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {item.matchScore}% sample match
                </span>
              </span>
            </JourneyLink>
          </li>
        ))}
      </ul>
      <Button
        to="/jobs?tab=browse"
        variant="text"
        className="mt-2 !px-0 text-xs"
      >
        View More Jobs
      </Button>
    </section>
  )
}

export function JobsGuidance({ job, onExplain }) {
  return (
    <aside
      aria-label={`PesoMatch guidance for ${job.title}`}
      className={`${panel} min-w-0 p-5`}
    >
      <h2 className="mb-4 text-sm font-semibold">PesoMatch guidance</h2>
      <p className="mb-4 text-xs leading-6 text-muted-foreground">
        {job.title}
      </p>
      <div className="space-y-5 divide-y divide-border [&>section:not(:first-child)]:pt-5">
        <MatchScoreCard job={job} />
        <section>
          <h3 className="text-sm font-semibold">Why this may fit</h3>
          <ul className="mt-3 space-y-2">
            {job.matchedCriteria.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs leading-6"
              >
                <Check size={14} className="mt-1 shrink-0 text-[#216638]" />
                <span>
                  {item}
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    Matched
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {job.skillStatuses[0] && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-[#805b12]">
              <CircleAlert size={14} className="mt-1 shrink-0" />
              <span>
                {job.skillStatuses[0].skill}
                <span className="ml-2 text-[10px]">
                  {job.skillStatuses[0].status}
                </span>
              </span>
            </p>
          )}
          <button
            onClick={() => onExplain(job)}
            className="mt-2 min-h-11 text-left text-xs font-semibold text-primary hover:underline"
          >
            View Full Match Analysis
          </button>
        </section>
        <SkillGapPanel job={job} />
        <TrainingRecommendationCard job={job} />
        <SimilarJobsPanel job={job} />
      </div>
      <p className="mt-5 border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
        {matchDisclaimer}
      </p>
    </aside>
  )
}

export function MatchAnalysisDialog({ job, onClose }) {
  const { trainings } = useDashboard()

  const training = job?.trainingIds
    .map((id) => trainings.find((item) => item.id === id))
    .find(Boolean)

  return (
    <Modal open={!!job} onClose={onClose} title="Why You Match">
      {job && (
        <>
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{job.company}</p>
          <div className="mt-5">
            <MatchScoreCard job={job} />
          </div>
          <h3 className="mt-6 text-sm font-semibold">Matched criteria</h3>
          <ul className="mt-3 space-y-4">
            {job.matchedCriteria.map((item) => (
              <li key={item} className="flex gap-3">
                <Check size={17} className="mt-0.5 shrink-0 text-[#216638]" />
                <div>
                  <p className="text-sm font-medium">{item}</p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {describeMatchedCriterion(job, item)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm font-semibold">Needs attention</h3>
          <ul className="mt-3 space-y-4">
            {job.skillStatuses.map(({ skill, status }) => (
              <li key={skill} className="flex gap-3">
                <StatusIcon status={status} />
                <div>
                  <p className="text-sm font-medium">
                    {skill} / {status}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {describeSkillStatus(job, skill, status)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              to={`/jobseeker/jobs/${job.id}/skill-analysis`}
              variant="secondary"
              onClick={onClose}
            >
              View Full Skill Analysis
            </Button>
            <Button to={`/jobseeker/jobs/${job.id}`} onClick={onClose}>
              View Full Job
            </Button>
            {training && (
              <Button
                to={`/training/${training.id}?job=${job.id}`}
                variant="secondary"
                onClick={onClose}
              >
                View Recommended Training
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            These results illustrate a future comparison of profile information
            with job criteria. They are predefined, not a live assessment. A
            high match does not guarantee employment.
          </p>
        </>
      )}
    </Modal>
  )
}
