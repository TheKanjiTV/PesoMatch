import { useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { ArrowLeft, GraduationCap } from "lucide-react"
import { useDashboard } from "../../context/DashboardContext.jsx"
import {
  PageHeading,
  Badge,
  Button,
  EmptyState,
  panel,
  StatusIcon,
  ErrorState,
} from "../../components/common/UI.jsx"
import { JourneyLink } from "../../components/common/JourneyLink.jsx"
import {
  SkillSummaryCard,
  SkillStatusRow,
  MatchedSkillsPanel,
  SkillGapPanel,
  SkillDetailDrawer,
  SkillAnalysisSkeleton,
} from "../../components/training/SkillComponents.jsx"
import {
  TrainingCard,
  WhyRecommendedDialog,
  TrainingErrorState,
} from "../../components/training/TrainingComponents.jsx"
import {
  getSkillAnalysis,
  getUserSkillOverview,
} from "../../services/skillAnalysisService.js"
import { getTrainings } from "../../services/trainingService.js"
import { skillStatusLabels } from "../../data/skillAnalysis.js"

export function SkillAnalysisPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { jobs } = useDashboard()
  const analysis = getSkillAnalysis(id)
  const job = jobs.find((item) => item.id === id)
  const [detail, setDetail] = useState(null)
  const [explained, setExplained] = useState(null)
  if (!analysis || !job)
    return (
      <EmptyState
        heading="h1"
        title="Skill analysis not found"
        description="Choose a sample opportunity to explore its recorded requirements."
        action={
          <Button to="/jobs?tab=recommended">View Recommended Jobs</Button>
        }
      />
    )
  const gaps = analysis.requiredSkills.filter((row) => row.status !== "matched")
  const strengths = analysis.requiredSkills.filter(
    (row) => row.status === "matched",
  )
  const trainingIds = new Set(
    [...gaps, ...analysis.preferredSkills].flatMap((row) => row.trainingIds),
  )
  const trainings = getTrainings().filter(
    (item) => trainingIds.has(item.id) && item.jobIds.includes(id),
  )
  const context = `?job=${id}&from=analysis`
  return (
    <>
      <JourneyLink
        back
        to={`/jobseeker/jobs/${id}`}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={18} />
        Back to job details
      </JourneyLink>
      <PageHeading
        title="Skill Analysis"
        description="See how your current skills compare with this job's requirements."
        actions={
          <Button to="/jobseeker/onboarding/3?review=1" variant="secondary">
            Update Skills
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{job.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{job.company}</p>
        </div>
        <Badge>{job.matchScore}% Match / Sample</Badge>
      </div>
      {params.get("preview") === "loading" ? (
        <SkillAnalysisSkeleton />
      ) : params.get("preview") === "error" ? (
        <ErrorState onRetry={() => setParams({})} />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <SkillSummaryCard analysis={analysis} />
            <MatchedSkillsPanel
              rows={strengths}
              jobId={id}
              onDetail={setDetail}
            />
            <SkillGapPanel rows={gaps} jobId={id} onDetail={setDetail} />
            {analysis.preferredSkills.length > 0 && (
              <section className={`${panel} p-5 sm:p-6`}>
                <h2 className="text-lg font-semibold">
                  Optional / Preferred Skills
                </h2>
                <ul className="mt-5 divide-y divide-border">
                  {analysis.preferredSkills.map((row) => (
                    <SkillStatusRow
                      key={row.skill}
                      row={row}
                      jobId={id}
                      onDetail={setDetail}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
          <aside className="min-w-0 space-y-4" aria-label="Related training">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Recommended Training</h2>
              <GraduationCap size={20} className="text-primary" />
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Target job → required skill → development area → related training.
            </p>
            {trainings.length ? (
              trainings.map((item) => (
                <TrainingCard
                  key={item.id}
                  training={item}
                  context={context}
                  onExplain={setExplained}
                />
              ))
            ) : (
              <EmptyState
                title="No training recommendations are available for your current skill gaps."
                description="Explore other training opportunities, including preferred skills."
                action={
                  <Button to="/training?tab=browse">Browse Training</Button>
                }
              />
            )}
            <Button
              to={`/training?tab=recommended&job=${id}&from=analysis`}
              variant="secondary"
              className="w-full"
            >
              View All Related Training
            </Button>
            <Button
              back
              to={`/jobseeker/jobs/${id}`}
              variant="text"
              className="w-full"
            >
              <ArrowLeft size={16} />
              Return to Job
            </Button>
          </aside>
        </div>
      )}
      <SkillDetailDrawer
        row={detail}
        jobId={id}
        jobs={jobs}
        onClose={() => setDetail(null)}
      />
      <WhyRecommendedDialog
        training={explained}
        sourceJob={id}
        context={context}
        onClose={() => setExplained(null)}
      />
    </>
  )
}

export function MySkillsPage() {
  const { jobs } = useDashboard()
  const [detail, setDetail] = useState(null)
  const rows = getUserSkillOverview()
  return (
    <>
      <PageHeading
        title="My Skills"
        description="Explore the sample skill comparison and the opportunities each skill connects to."
        actions={
          <Button to="/jobseeker/onboarding/3?review=1">Update Skills</Button>
        }
      />
      <div className="grid items-start gap-5 md:grid-cols-2">
        {[
          ["matched", "Strong / Matched Skills"],
          ["developing", "Developing Skills"],
          ["needs_improvement", "Skills to Improve"],
          ["not_in_profile", "Not Yet Added"],
          ["optional", "Optional / Preferred Skills"],
        ].map(([status, title]) => {
          const group = rows.filter((row) => row.status === status)
          return (
            group.length > 0 && (
              <section key={status} className={`${panel} p-5`}>
                <h2 className="text-base font-semibold">{title}</h2>
                <ul className="mt-3 divide-y divide-border">
                  {group.map((row) => (
                    <li key={row.skill}>
                      <button
                        onClick={() => setDetail(row)}
                        className="flex min-h-14 w-full items-center gap-3 py-3 text-left text-sm hover:text-primary"
                      >
                        <StatusIcon status={skillStatusLabels[row.status]} />
                        <span>
                          {row.skill}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {row.relatedJobIds.length} sample jobs
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )
        })}
      </div>
      <SkillDetailDrawer
        row={detail}
        jobs={jobs}
        onClose={() => setDetail(null)}
      />
    </>
  )
}
