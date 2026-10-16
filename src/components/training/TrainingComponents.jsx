import { useLocation } from "react-router"
import {
  ArrowLeft,
  Check,
  GraduationCap,
  MapPin,
  Clock,
  CircleAlert,
} from "lucide-react"
import {
  Button,
  Badge,
  Modal,
  StatusIcon,
  Skeleton,
  panel,
} from "../common/UI.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { SaveButton } from "../common/JobActions.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useFeedback } from "../common/Feedback.jsx"
import { getSkillAnalysis } from "../../services/skillAnalysisService.js"
import { skillStatusLabels } from "../../data/skillAnalysis.js"

export function TrainingCard({ training, onExplain, context = "" }) {
  const location = useLocation()
  const { jobs } = useDashboard()
  return (
    <article className={`${panel} flex min-w-0 flex-col overflow-hidden`}>
      <JourneyLink
        to={`/training/${training.id}${context}`}
        state={{ trainingReturn: location.pathname + location.search }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={training.image}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      </JourneyLink>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>
            <Check size={13} />
            {training.availability}
          </Badge>
          <span className="text-xs text-muted-foreground">Sample</span>
          <div className="ml-auto">
            <SaveButton
              id={training.id}
              training
              compact
              title={training.title}
            />
          </div>
        </div>
        <h3 className="mt-4 text-base font-semibold leading-6">
          <JourneyLink
            to={`/training/${training.id}${context}`}
            state={{ trainingReturn: location.pathname + location.search }}
            className="hover:text-primary"
          >
            {training.title}
          </JourneyLink>
        </h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {training.provider}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {training.category} / {training.mode}
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {training.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {training.duration}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {training.skillsAddressed.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-muted px-2 py-1 text-[11px]"
            >
              {skill}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {training.reason}
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Related jobs:{" "}
          {jobs
            .filter((job) => training.jobIds.includes(job.id))
            .slice(0, 2)
            .map((job) => job.title)
            .join(" / ")}
          . {training.jobIds.length} sample opportunities.
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button
            to={`/training/${training.id}${context}`}
            state={{ trainingReturn: location.pathname + location.search }}
            className="text-xs"
            aria-label={`View training: ${training.title}`}
          >
            View Training
          </Button>
          <Button
            variant="text"
            className="text-xs !px-2"
            onClick={() => onExplain(training)}
          >
            Why Recommended
          </Button>
        </div>
      </div>
    </article>
  )
}

export function RelatedJobsPanel({ training, sourceJob, onNavigate }) {
  const { jobs } = useDashboard()
  const related = jobs.filter((job) => training.jobIds.includes(job.id))
  return (
    <section>
      <h3 className="text-sm font-semibold">Related Jobs</h3>
      <ul className="mt-3 divide-y divide-border">
        {related.slice(0, 3).map((job) => (
          <li key={job.id}>
            <JourneyLink
              back
              onClick={onNavigate}
              to={`/jobseeker/jobs/${job.id}`}
              className="block py-3 text-xs hover:text-primary"
            >
              <span className="block font-medium leading-6">{job.title}</span>
              <span className="text-muted-foreground">
                {job.matchScore}% Match / Sample
              </span>
            </JourneyLink>
          </li>
        ))}
      </ul>
      <Button
        variant="text"
        className="!px-0 text-xs"
        to={`/jobs?tab=recommended&q=${encodeURIComponent(training.skillAddressed)}`}
        onClick={onNavigate}
      >
        View Related Jobs
      </Button>
    </section>
  )
}

export function WhyRecommendedPanel({ training, sourceJob }) {
  const { jobs } = useDashboard()
  const job =
    jobs.find(
      (item) => item.id === sourceJob && training.jobIds.includes(item.id),
    ) || jobs.find((item) => training.jobIds.includes(item.id))
  const analysis = job && getSkillAnalysis(job.id)
  const rows = analysis
    ? [...analysis.requiredSkills, ...analysis.preferredSkills].filter((row) =>
        training.skillsAddressed.includes(row.skill),
      )
    : []
  return (
    <section>
      <h3 className="text-sm font-semibold">Why Recommended</h3>
      {job && (
        <p className="mt-3 text-xs leading-6">
          {job.title} lists skills addressed by this training.
        </p>
      )}
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {training.reason}
      </p>
      <h4 className="mt-4 text-xs font-semibold">
        Profile skill status / Sample comparison
      </h4>
      <ul className="mt-3 space-y-3">
        {rows.map((row) => (
          <li key={row.skill} className="text-xs">
            <span className="flex items-center gap-2">
              <StatusIcon status={skillStatusLabels[row.status]} />
              {row.skill}
            </span>
            <span className="mt-1 block pl-6 text-muted-foreground">
              {skillStatusLabels[row.status]}
            </span>
          </li>
        ))}
      </ul>
      {job && (
        <JourneyLink
          back
          to={`/jobseeker/jobs/${job.id}/skill-analysis`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary"
        >
          <ArrowLeft size={15} />
          View Skill Analysis
        </JourneyLink>
      )}
    </section>
  )
}

export function WhyRecommendedDialog({
  training,
  sourceJob,
  onClose,
  context = "",
}) {
  return (
    <Modal
      open={!!training}
      title="Why this training was recommended"
      onClose={onClose}
      placement="sheet"
    >
      {training && (
        <>
          <h3 className="mb-5 text-lg font-semibold">{training.title}</h3>
          <WhyRecommendedPanel training={training} sourceJob={sourceJob} />
          <div className="my-5 border-t border-border" />
          <RelatedJobsPanel
            training={training}
            sourceJob={sourceJob}
            onNavigate={onClose}
          />
          <Button
            to={`/training/${training.id}${context}`}
            onClick={onClose}
            className="mt-5"
          >
            View Training Details
          </Button>
        </>
      )}
    </Modal>
  )
}

export function InterestButton({ training }) {
  const { interestedTraining, setInterestedTraining } = useDashboard()
  const { notify } = useFeedback()
  const active = interestedTraining.includes(training.id)
  const change = (next) =>
    setInterestedTraining((ids) =>
      next
        ? [...new Set([...ids, training.id])]
        : ids.filter((id) => id !== training.id),
    )
  return (
    <Button
      variant="secondary"
      aria-pressed={active}
      className="w-full"
      onClick={() => {
        change(!active)
        notify(active ? "Interest removed." : "Marked as interested.", {
          undo: () => change(active),
        })
      }}
    >
      <Check size={16} />
      {active ? "Interested" : "I'm Interested"}
    </Button>
  )
}

export function TrainingCardSkeleton() {
  return <Skeleton kind="training" label="Loading training opportunity" />
}
export function TrainingDetailsSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton kind="training" label="Loading training details" />
      <RecommendationSkeleton />
    </div>
  )
}
export function RecommendationSkeleton() {
  return <Skeleton kind="training" label="Loading training recommendations" />
}
export function TrainingErrorState({ onRetry }) {
  return (
    <div role="alert" className={`${panel} p-6`}>
      <h2 className="flex items-center gap-2 font-semibold">
        <CircleAlert size={18} />
        We couldn't load training opportunities.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button className="mt-4" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )
}
