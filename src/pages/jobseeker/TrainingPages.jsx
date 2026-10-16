import { useState } from "react"
import { useLocation, useParams, useSearchParams } from "react-router"
import {
  assistancePath,
  getSampleAssistance,
} from "../../services/assistanceService.js"
import {
  ArrowLeft,
  GraduationCap,
  SlidersHorizontal,
  X,
  MapPin,
} from "lucide-react"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { useFeedback } from "../../components/common/Feedback.jsx"
import {
  PageHeading,
  Field,
  Button,
  EmptyState,
  Badge,
  Modal,
  panel,
} from "../../components/common/UI.jsx"
import { JourneyLink } from "../../components/common/JourneyLink.jsx"
import { ViewTabs } from "../../components/common/ViewTabs.jsx"
import { SaveButton } from "../../components/common/JobActions.jsx"
import {
  TrainingFilters,
  trainingFilterFields,
} from "../../components/training/TrainingFilters.jsx"
import {
  TrainingCard,
  WhyRecommendedDialog,
  WhyRecommendedPanel,
  RelatedJobsPanel,
  InterestButton,
  TrainingCardSkeleton,
  TrainingDetailsSkeleton,
  TrainingErrorState,
} from "../../components/training/TrainingComponents.jsx"
import {
  getTrainings,
  getRecommendedTrainings,
  getSavedTrainings,
  getTrainingById,
  searchTrainings,
} from "../../services/trainingService.js"

export function TrainingPage() {
  const { savedTraining, jobs } = useDashboard()
  const { user } = useAuth()
  const { notify } = useFeedback()
  const [params, setParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState({})
  const [explained, setExplained] = useState(null)
  const tab = ["recommended", "browse", "saved"].includes(params.get("tab"))
    ? params.get("tab")
    : "recommended"
  const sourceJob = jobs.find((job) => job.id === params.get("job"))
  const source =
    tab === "saved"
      ? getSavedTrainings(user.id, savedTraining)
      : tab === "recommended"
        ? getRecommendedTrainings()
        : getTrainings()
  const filters = Object.fromEntries(
    trainingFilterFields.map(([key]) => [key, params.get(key) || ""]),
  )
  const skill = params.get("skill") || ""
  const search = params.get("search") || ""
  const visible = searchTrainings(
    { ...filters, search, skill, job: sourceJob?.id || "" },
    source,
  )
  const change = (key, value) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        value ? next.set(key, value) : next.delete(key)
        return next
      },
      { replace: true, flushSync: true },
    )
  const clear = () => {
    setParams({ tab })
    setDraftFilters({})
    notify("Filters cleared.")
  }
  const context = new URLSearchParams()
  if (sourceJob) context.set("job", sourceJob.id)
  if (params.get("from") === "analysis") context.set("from", "analysis")
  const contextQuery = context.size ? `?${context}` : ""
  const preview = params.get("preview")
  return (
    <>
      {sourceJob && (
        <JourneyLink
          back
          to={
            params.get("from") === "analysis"
              ? `/jobseeker/jobs/${sourceJob.id}/skill-analysis`
              : `/jobseeker/jobs/${sourceJob.id}`
          }
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
        >
          <ArrowLeft size={18} />
          {params.get("from") === "analysis"
            ? "Back to skill analysis"
            : "Back to target job"}
        </JourneyLink>
      )}
      <PageHeading title="Training" />
      <ViewTabs
        label="Training views"
        value={tab}
        items={[
          ["recommended", "Recommended for You"],
          ["browse", "Browse Training"],
          ["saved", `Saved Training (${savedTraining.length})`],
        ]}
        onChange={(value) => change("tab", value)}
      />
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        key={tab}
        className="tab-enter"
      >
        <div className="mb-5 grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <Field
            label="Search training, skills, or provider"
            value={search}
            onChange={(event) => change("search", event.target.value)}
            placeholder="Search training, skills, or provider"
          />
          <Button
            variant="secondary"
            onClick={() => {
              setDraftFilters(filters)
              setFilterOpen(true)
            }}
            className="lg:hidden"
          >
            <SlidersHorizontal size={17} />
            Filters
          </Button>
          <p className="hidden text-xs text-muted-foreground lg:block">
            {visible.length} training{" "}
            {visible.length === 1 ? "opportunity" : "opportunities"}
          </p>
        </div>
        {(skill || sourceJob || Object.values(filters).some(Boolean)) && (
          <div
            className="mb-5 flex flex-wrap items-center gap-2"
            aria-label="Selected training filters"
          >
            {[
              ["skill", skill],
              ["job", sourceJob?.title],
              ...Object.entries(filters),
            ]
              .filter(([, value]) => value)
              .map(([key, value]) => (
                <button
                  key={key}
                  aria-label={`Remove filter: ${value}`}
                  onClick={() => change(key, "")}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-secondary px-3 text-xs text-primary"
                >
                  {value}
                  <X size={14} />
                </button>
              ))}
            <Button variant="text" className="text-xs" onClick={clear}>
              Clear All
            </Button>
          </div>
        )}
        <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside
            className={`${panel} hidden p-5 lg:block`}
            aria-label="Training filters"
          >
            <h2 className="mb-5 text-base font-semibold">Filters</h2>
            <TrainingFilters
              values={filters}
              onChange={change}
              onClear={clear}
            />
          </aside>
          <section className="min-w-0" aria-label="Training opportunities">
            {tab === "recommended" && (
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Recommended for You</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Based on skills identified from your current sample job
                  matches{sourceJob ? ` for ${sourceJob.title}` : ""}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>
                    <GraduationCap size={14} />
                    Skill development
                  </Badge>
                  {skill && <Badge>{skill}</Badge>}
                </div>
              </div>
            )}
            {preview === "loading" ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[0, 1, 2, 3].map((id) => (
                  <TrainingCardSkeleton key={id} />
                ))}
              </div>
            ) : preview === "error" ? (
              <TrainingErrorState onRetry={() => change("preview", "")} />
            ) : visible.length ? (
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {visible.map((item) => (
                  <TrainingCard
                    key={item.id}
                    training={item}
                    onExplain={setExplained}
                    context={contextQuery}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title={
                  tab === "saved" && !savedTraining.length
                    ? "No saved training yet"
                    : tab === "recommended"
                      ? "No training recommendations are available for your current skill gaps."
                      : "No training programs found."
                }
                description={
                  tab === "saved" && !savedTraining.length
                    ? "Save training opportunities you may want to review later."
                    : "Try another skill, search, or filter."
                }
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => setParams({ tab: "browse" })}>
                      Browse Training
                    </Button>
                    {(search ||
                      skill ||
                      sourceJob ||
                      Object.values(filters).some(Boolean)) && (
                      <Button variant="secondary" onClick={clear}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                }
              />
            )}
          </section>
        </div>
      </div>
      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Training"
        placement="sheet"
      >
        <TrainingFilters
          values={draftFilters}
          onChange={(key, value) =>
            setDraftFilters((current) => ({ ...current, [key]: value }))
          }
          onClear={() => setDraftFilters({})}
          onApply={() => {
            setParams((current) => {
              const next = new URLSearchParams(current)
              trainingFilterFields.forEach(([key]) =>
                draftFilters[key]
                  ? next.set(key, draftFilters[key])
                  : next.delete(key),
              )
              return next
            })
            setFilterOpen(false)
          }}
        />
      </Modal>
      <WhyRecommendedDialog
        training={explained}
        sourceJob={sourceJob?.id}
        context={contextQuery}
        onClose={() => setExplained(null)}
      />
    </>
  )
}

export function TrainingDetailsPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const { jobs, requests, accountId } = useDashboard()
  const item = getTrainingById(id)
  const sourceAssistance = (
    params.get("assistanceExample") === "1"
      ? getSampleAssistance(accountId)
      : requests
  ).find(
    (record) =>
      record.id === params.get("assistance") &&
      record.trainingIds?.includes(id),
  )
  const sourceJob = jobs.find(
    (job) => job.id === params.get("job") && item?.jobIds.includes(job.id),
  )
  const fromAnalysis = sourceJob && params.get("from") === "analysis"
  const returnPath = location.state?.trainingReturn
  const safeReturn =
    typeof returnPath === "string" && /^\/training(?:\?|$)/.test(returnPath)
      ? returnPath
      : null
  const backPath =
    (sourceAssistance && assistancePath(sourceAssistance)) ||
    safeReturn ||
    (fromAnalysis
      ? `/jobseeker/jobs/${sourceJob.id}/skill-analysis`
      : sourceJob
        ? `/jobseeker/jobs/${sourceJob.id}`
        : "/training")
  const backLabel = sourceAssistance
    ? "Back to PESO Assistance"
    : safeReturn
      ? "Back to training"
      : fromAnalysis
        ? "Back to skill analysis"
        : sourceJob
          ? "Back to target job"
          : "Back to training"
  if (!item)
    return (
      <EmptyState
        heading="h1"
        icon={GraduationCap}
        title="Training not found"
        description="This sample training is not available."
        action={<Button to="/training">Browse Training</Button>}
      />
    )
  return (
    <>
      <JourneyLink
        back
        to={backPath}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <ArrowLeft size={18} />
        {backLabel}
      </JourneyLink>
      {params.get("preview") === "loading" ? (
        <TrainingDetailsSkeleton />
      ) : params.get("preview") === "error" ? (
        <TrainingErrorState
          onRetry={() =>
            setParams((current) => {
              const next = new URLSearchParams(current)
              next.delete("preview")
              return next
            })
          }
        />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className={`${panel} min-w-0 overflow-hidden`}>
            <img
              src={item.image}
              alt="People practicing workplace skills together"
              className="aspect-video max-h-80 w-full object-cover"
            />
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <GraduationCap size={14} />
                  {item.availability}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Sample Training Opportunity
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold leading-9">
                {item.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.provider}
              </p>
              <dl className="my-6 grid gap-5 border-y border-border py-5 sm:grid-cols-2">
                {[
                  ["Category", item.category],
                  ["Mode", item.mode],
                  ["Location", item.location],
                  ["Duration", item.duration],
                  ["Schedule", item.schedule],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-sm font-medium leading-6">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <TrainingInfoPanel title="About This Training">
                <p>{item.description}</p>
              </TrainingInfoPanel>
              <TrainingInfoPanel title="Learning Objectives">
                <ul className="list-disc space-y-2 pl-5">
                  {item.learningObjectives.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </TrainingInfoPanel>
              <TrainingInfoPanel title="Skills Covered">
                <div className="flex flex-wrap gap-2">
                  {item.skillsAddressed.map((skill) => (
                    <Badge key={skill}>
                      <GraduationCap size={14} />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </TrainingInfoPanel>
              <TrainingInfoPanel title="Requirements">
                <ul className="list-disc space-y-2 pl-5">
                  {item.requirements.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </TrainingInfoPanel>
              <TrainingInfoPanel title="Who This Training Is For">
                <p>{item.audience}</p>
              </TrainingInfoPanel>
              <TrainingInfoPanel title="Registration Details">
                <p>{item.registrationDetails}</p>
              </TrainingInfoPanel>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                <SaveButton id={item.id} training />
                {sourceJob && (
                  <Button
                    back
                    to={`/jobseeker/jobs/${sourceJob.id}`}
                    variant="secondary"
                  >
                    <ArrowLeft size={16} />
                    Return to Job
                  </Button>
                )}
                <Button to="/training?tab=browse" variant="text">
                  Explore More Training
                </Button>
              </div>
            </div>
          </article>
          <aside
            className={`${panel} space-y-5 p-5`}
            aria-label="Training guidance"
          >
            <WhyRecommendedPanel training={item} sourceJob={sourceJob?.id} />
            <section className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Skills Addressed</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.skillsAddressed.map((skill) => (
                  <JourneyLink
                    key={skill}
                    to={`/training?tab=recommended&skill=${encodeURIComponent(skill)}`}
                    className="inline-flex min-h-10 items-center rounded-md bg-muted px-2 text-xs hover:text-primary"
                  >
                    {skill}
                  </JourneyLink>
                ))}
              </div>
            </section>
            <div className="border-t border-border pt-5">
              <RelatedJobsPanel training={item} sourceJob={sourceJob?.id} />
            </div>
            <div className="space-y-3 border-t border-border pt-5">
              <SaveButton id={item.id} training />
              <InterestButton training={item} />
              <p className="text-xs leading-6 text-muted-foreground">
                Saved and interested items stay in this browser for your
                account. These actions do not register you.
              </p>
            </div>
            <Button
              to="/jobseeker/onboarding/3?review=1"
              variant="text"
              className="w-full"
            >
              Update Skills
            </Button>
          </aside>
        </div>
      )}
    </>
  )
}

function TrainingInfoPanel({ title, children }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <div className="max-w-[72ch] text-sm leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
