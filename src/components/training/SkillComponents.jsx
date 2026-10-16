import { GraduationCap, Check } from "lucide-react"
import {
  Badge,
  Button,
  Modal,
  ProgressBar,
  Skeleton,
  StatusIcon,
  panel,
} from "../common/UI.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import {
  skillStatusLabels,
  describeAnalysisSkill,
} from "../../data/skillAnalysis.js"
import { getSkillTraining } from "../../services/skillAnalysisService.js"

export function SkillSummaryCard({ analysis }) {
  const counts = Object.fromEntries(
    Object.keys(skillStatusLabels).map((status) => [
      status,
      analysis.requiredSkills.filter((row) => row.status === status).length,
    ]),
  )
  // An inventory of fixed records, not a proficiency score or AI assessment.
  return (
    <section className={`${panel} p-5`} aria-label="Skill summary">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {analysis.requiredSkills.length} Required Skills
        </h2>
        <Badge>Sample comparison</Badge>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(counts)
          .filter(([status]) => status !== "optional")
          .map(([status, count]) => (
            <div key={status}>
              <dt className="flex items-center gap-2 text-xs leading-6 text-muted-foreground">
                <StatusIcon status={skillStatusLabels[status]} />
                {skillStatusLabels[status]}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {count}
              </dd>
            </div>
          ))}
      </dl>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        Recorded profile skills compared with the job's required skills. These
        fixed sample results do not change when you edit your profile.
      </p>
    </section>
  )
}

export function SkillStatusRow({ row, jobId, onDetail }) {
  const training = getSkillTraining(row.skill)
  const trainingLink = `/training?tab=recommended&skill=${encodeURIComponent(row.skill)}${
    jobId ? `&job=${jobId}&from=analysis` : ""
  }`
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button
          onClick={() => onDetail(row)}
          className="min-h-10 text-left text-sm font-semibold text-foreground hover:text-primary"
        >
          {row.skill}
        </button>
        <Badge status={skillStatusLabels[row.status]}>
          <StatusIcon status={skillStatusLabels[row.status]} />
          {skillStatusLabels[row.status]}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] text-muted-foreground">
            Your Profile / Sample
          </dt>
          <dd className="mt-1 text-xs">
            {row.currentLevel
              ? `${row.skill} / ${row.currentLevel}`
              : "Not recorded"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Job Requirement</dt>
          <dd className="mt-1 text-xs">
            {row.skill} / {row.requiredLevel}
          </dd>
        </div>
      </dl>
      <p className="mt-3 max-w-[72ch] text-xs leading-6 text-muted-foreground">
        {describeAnalysisSkill(row)}
      </p>
      {row.status !== "matched" && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Appears in {row.relatedJobIds.length} sample{" "}
          {row.relatedJobIds.length === 1 ? "opportunity" : "opportunities"}.
          {training.length
            ? ` Related training: ${training.map((item) => item.title).join(", ")}.`
            : ""}
        </p>
      )}
      {row.status !== "matched" && (
        <Button to={trainingLink} variant="text" className="mt-1 !px-0 text-xs">
          <GraduationCap size={15} />
          {training.length ? "View Related Training" : "Find Training"}
        </Button>
      )}
    </li>
  )
}

export function MatchedSkillsPanel({ rows, onDetail, jobId }) {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold">Your Strengths for This Role</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        Skills aligned with this opportunity's recorded requirements.
      </p>
      {rows.length ? (
        <ul className="mt-5 divide-y divide-border">
          {rows.map((row) => (
            <SkillStatusRow
              key={row.skill}
              row={row}
              jobId={jobId}
              onDetail={onDetail}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Add your skills to your profile to keep your information current.
        </p>
      )}
    </section>
  )
}

export function SkillGapPanel({ rows, onDetail, jobId }) {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <h2 className="text-lg font-semibold">
        {rows.length ? "Skills to Improve" : "No major skill gaps identified"}
      </h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        {rows.length
          ? "These skills may help strengthen your readiness for this opportunity."
          : "Your current profile matches the recorded core skills for this opportunity."}
      </p>
      {rows.length > 0 && (
        <ul className="mt-5 divide-y divide-border">
          {rows.map((row) => (
            <SkillStatusRow
              key={row.skill}
              row={row}
              jobId={jobId}
              onDetail={onDetail}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export function SkillDetailDrawer({ row, jobId, jobs, onClose }) {
  const training = row ? getSkillTraining(row.skill) : []
  return (
    <Modal
      open={!!row}
      title={row?.skill || "Skill Details"}
      onClose={onClose}
      placement="sheet"
    >
      {row && (
        <>
          <Badge status={skillStatusLabels[row.status]}>
            <StatusIcon status={skillStatusLabels[row.status]} />
            {skillStatusLabels[row.status]}
          </Badge>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {describeAnalysisSkill(row)}
          </p>
          <p className="mt-4 text-xs">
            Appears in {row.relatedJobIds.length} sample jobs /{" "}
            {training.length} related training{" "}
            {training.length === 1 ? "program" : "programs"}
          </p>
          <h3 className="mt-6 text-sm font-semibold">Related Jobs</h3>
          <ul className="mt-3 space-y-2">
            {jobs
              .filter((job) => row.relatedJobIds.includes(job.id))
              .map((job) => (
                <li key={job.id}>
                  <JourneyLink
                    to={`/jobseeker/jobs/${job.id}`}
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center text-xs font-medium text-primary"
                  >
                    {job.title}
                  </JourneyLink>
                </li>
              ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={onClose}
              to={`/training?tab=recommended&skill=${encodeURIComponent(row.skill)}${
                jobId ? `&job=${jobId}&from=analysis` : ""
              }`}
            >
              View Training
            </Button>
            <Button
              onClick={onClose}
              to={`/jobs?tab=recommended&q=${encodeURIComponent(row.skill)}`}
              variant="secondary"
            >
              View Jobs
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

export function SkillAnalysisSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton kind="profile" label="Loading skill summary" />
      <Skeleton kind="profile" label="Loading skill analysis" />
    </div>
  )
}
