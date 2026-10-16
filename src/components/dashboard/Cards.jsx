import { SaveButton } from "../common/JobActions.jsx"

import { useState } from "react"

import { Link } from "react-router"

import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  GraduationCap,
  Handshake,
  MapPin,
  Target,
  UserRound,
  Bell,
  Clock3,
} from "lucide-react"

import {
  panel,
  Button,
  TextLink,
  Badge,
  StatusIcon,
  ProgressBar,
  Modal,
  MatchTooltip,
} from "../common/UI.jsx"

import { profileSections } from "../../data/mockProfile.js"

import { referralSteps } from "../../data/mockReferrals.js"

export function DashboardHeader({ profile }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-[1.5px] text-muted-foreground">
          YOUR EMPLOYMENT JOURNEY
        </p>
        <h1 className="font-display text-[38px] leading-tight tracking-[-0.02em] text-primary sm:text-[42px]">
          Good morning, {profile.firstName}.
        </h1>
        <p className="mt-3 max-w-[660px] text-sm leading-7 text-muted-foreground">
          See your job matches, skills to improve, recommended training, and
          PESO assistance in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button to="/jobseeker/profile">Update Profile</Button>
        <Button variant="secondary" to="/jobseeker/jobs">
          Browse Jobs
        </Button>
      </div>
    </div>
  )
}

export function StatCard({
  title,

  value,

  description,

  icon: Icon,

  to,

  action,

  progress,
}) {
  return (
    <article className={`${panel} flex min-w-0 flex-col p-5`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xs font-medium leading-5 text-muted-foreground">
          {title}
        </h2>
        <Icon size={18} aria-hidden="true" className="shrink-0 text-primary" />
      </div>
      <p className="mt-3 text-[28px] font-semibold tabular-nums leading-tight text-primary">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      {progress !== undefined && (
        <ProgressBar
          value={progress}
          label="Profile completion"
          className="mt-3"
        />
      )}
      <div className="mt-auto pt-2">
        <TextLink to={to}>{action}</TextLink>
      </div>
    </article>
  )
}

export function ProfileNotice({ profile }) {
  if (profile.profileCompletion === 100) return null

  return (
    <div className="mb-6 grid items-center gap-4 rounded-xl border border-[#d1deca] bg-secondary px-5 py-4 sm:grid-cols-[1fr_180px_auto]">
      <p className="max-w-xl text-sm leading-6">
        Complete your jobseeker profile to improve the relevance of your job and
        training recommendations.
      </p>
      <div>
        <p className="mb-2 text-xs font-semibold text-primary">
          {profile.profileCompletion}% Complete
        </p>
        <ProgressBar
          value={profile.profileCompletion}
          label="Profile completion notice"
        />
      </div>
      <Button variant="secondary" to="/jobseeker/profile">
        Complete Profile
      </Button>
    </div>
  )
}

export { MatchAnalysisDialog as MatchDialog } from "../jobs/JobsGuidance.jsx"

export function JobMatchCard({ job, onExplain }) {
  return (
    <article className={`${panel} flex min-w-0 flex-col p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Job opportunity</span>
        <Badge>{job.matchLabel}</Badge>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-7 text-primary">
        <Link to={`/jobseeker/jobs/${job.id}`} className="hover:underline">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin size={14} />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <BriefcaseBusiness size={14} />
          {job.employmentType}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-lg font-semibold tabular-nums text-primary">
          {job.matchScore}% Match
        </span>
        <MatchTooltip />
      </div>
      <ProgressBar
        value={job.matchScore}
        label={`${job.title}: ${job.matchScore}% illustrative match`}
      />
      <h4 className="mt-5 text-xs font-semibold text-foreground">
        Why this may fit
      </h4>
      <ul className="mt-3 space-y-2">
        {job.matchedCriteria.map((item) => (
          <li
            key={item}
            className="flex items-start justify-between gap-2 text-[13px] leading-5"
          >
            <span className="flex gap-2">
              <Check size={14} className="mt-0.5 shrink-0 text-primary" />
              {item}
            </span>
            <span className="text-xs text-muted-foreground">Matched</span>
          </li>
        ))}
      </ul>
      <p className="mb-5 mt-3 flex items-start gap-2 text-[13px] leading-5 text-[#805b12]">
        <CircleAlert size={15} className="mt-0.5 shrink-0" />
        {job.skillGaps.join(", ")} — Needs improvement
      </p>
      <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
          variant="secondary"
          onClick={() => onExplain(job)}
          className="flex-1"
        >
          Why You Match
        </Button>
        <Button to={`/jobseeker/jobs/${job.id}`} className="flex-1">
          View Job
          <ArrowRight size={15} />
        </Button>
      </div>
    </article>
  )
}

export function SkillGapCard({ skills }) {
  return (
    <div className={`${panel} p-5 sm:p-6`}>
      <ul className="divide-y divide-border">
        {skills.map((skill) => (
          <li
            key={skill.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <StatusIcon status={skill.status} />
              {skill.name}
            </span>
            <Badge>{skill.status}</Badge>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        “Not in Profile” means no skill information is recorded; it does not
        prove you lack the skill.
      </p>
      <div className="mt-4 border-t border-border pt-2">
        <TextLink to="/jobseeker/skills">View Full Skill Analysis</TextLink>
      </div>
    </div>
  )
}

export function TrainingCard({ training, compact = false }) {
  const [explain, setExplain] = useState(false)

  const image =
    training.id === "excel"
      ? "/images/career-portrait.jpg"
      : training.id === "communication"
        ? "/images/team-collaboration.jpg"
        : "/images/career-workspace.jpg"

  return (
    <article className={`${panel} flex flex-col overflow-hidden`}>
      <Link to={`/training/${training.id}`} tabIndex={-1} aria-hidden="true">
        <img
          src={image}
          alt=""
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
          {training.category}
        </p>
        <h3 className="mt-3 text-base font-semibold leading-6">
          <Link to={`/training/${training.id}`} className="hover:text-primary">
            {training.title}
          </Link>
        </h3>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {training.reason}
        </p>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Skill to develop:{" "}
          <span className="font-medium text-foreground">
            {training.skillAddressed}
          </span>
        </p>
        {!compact && (
          <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
            {training.provider}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button to={`/training/${training.id}`} className="text-xs">
            View Training
          </Button>
          {!compact && <SaveButton id={training.id} training />}
        </div>
        <button
          aria-expanded={explain}
          onClick={() => setExplain(!explain)}
          className="mt-2 flex min-h-10 items-center gap-2 text-left text-[11px] text-primary hover:underline"
        >
          Why Recommended
          <ChevronIcon open={explain} />
        </button>
        {explain && (
          <p className="mt-2 border-t border-border pt-3 text-xs leading-6 text-muted-foreground">
            Job requirement → {training.skillAddressed} → targeted training.{" "}
            {training.reason} These sample recommendations do not verify your
            qualifications or reserve a place.
          </p>
        )}
      </div>
    </article>
  )
}

function ChevronIcon({ open }) {
  return <ArrowRight size={14} className={open ? "rotate-90" : ""} />
}

export function ProfileCompletionCard({ profile }) {
  return (
    <div className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Profile Completion
        </span>
        <span className="text-lg font-semibold tabular-nums text-primary">
          {profile.profileCompletion}%
        </span>
      </div>
      <ProgressBar
        value={profile.profileCompletion}
        label="Jobseeker profile completion"
        className="mt-3"
      />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {profileSections.map((item) => {
          const status =
            ["experience", "certifications"].includes(item.field) &&
            profile[item.field]?.trim()
              ? "Completed"
              : item.status

          return (
            <li
              key={item.field}
              className="flex items-center gap-2 text-xs leading-5"
            >
              <StatusIcon status={status} />
              {item.name}
              <span className="sr-only">{status}</span>
            </li>
          )
        })}
      </ul>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        Keep your profile updated so PesoMatch can provide more relevant
        recommendations.
      </p>
      <TextLink to="/jobseeker/profile">
        {profile.profileCompletion === 100
          ? "Review Profile"
          : "Complete Profile"}
      </TextLink>
    </div>
  )
}

export function PreferencesCard({ profile }) {
  return (
    <div className={`${panel} p-5 sm:p-6`}>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {[
          ["Preferred Field", profile.preferredFields.join(" / ")],

          ["Preferred Location", profile.preferredLocation],

          ["Employment Type", profile.employmentType],

          ["Work Arrangement", profile.workArrangement.join(" / ")],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1.5 text-sm leading-6 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <TextLink to="/jobseeker/profile?tab=preferences">
          Edit Preferences
        </TextLink>
      </div>
    </div>
  )
}

export function ReferralStatusCard({ referral, details = false }) {
  const formatDate = (value) =>
    new Intl.DateTimeFormat("en-PH", {
      year: "numeric",

      month: "long",

      day: "numeric",

      timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`))

  return (
    <article className={`${panel} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Sample referral · {referral.reference}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-primary">
            {referral.jobTitle}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {referral.company}
          </p>
        </div>
        <Badge status="Active Referral">{referral.status}</Badge>
      </div>
      <ol className="my-7 grid gap-4 md:grid-cols-6 md:gap-3">
        {referralSteps.map((step, index) => (
          <li
            key={step}
            aria-current={index === referral.currentStep ? "step" : undefined}
            className="flex items-start gap-3 md:block"
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                index < referral.currentStep
                  ? "bg-[#eaf7ee] text-[#216638]"
                  : index === referral.currentStep
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {index < referral.currentStep ? (
                <Check size={14} />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </span>
            <div className="md:mt-3">
              <p
                className={`text-xs leading-5 ${
                  index === referral.currentStep
                    ? "font-semibold text-primary"
                    : "text-foreground"
                }`}
              >
                {step}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {index < referral.currentStep
                  ? "Completed"
                  : index === referral.currentStep
                    ? "Current"
                    : "Pending"}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
        {[
          ["PESO Office", referral.office],

          ["Date Referred", formatDate(referral.dateReferred)],

          ["Last Update", formatDate(referral.lastUpdate)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      {details ? (
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          {referral.notes}
        </p>
      ) : (
        <div className="mt-4">
          <TextLink to="/jobseeker/assistance">
            View Assistance Details
          </TextLink>
        </div>
      )}
    </article>
  )
}

export function NotificationItem({ item, onRead }) {
  const Icon =
    {
      job: BriefcaseBusiness,

      training: GraduationCap,

      profile: UserRound,

      referral: Handshake,
    }[item.type] || Bell

  return (
    <li className="flex gap-3 border-b border-border py-4 last:border-0">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to={item.to}
            onClick={() => onRead?.(item.id)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            {item.title}
          </Link>
          <span className="text-xs text-muted-foreground">{item.time}</span>
        </div>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          {item.message}
        </p>
        {onRead && !item.read && (
          <button
            onClick={() => onRead(item.id)}
            className="mt-1 min-h-11 text-xs font-semibold text-primary hover:underline"
          >
            Mark as read
          </button>
        )}
      </div>
    </li>
  )
}

export function QuickActionCard() {
  return (
    <div className={`${panel} divide-y divide-border px-5`}>
      {[
        ["Find Jobs", "/jobseeker/jobs", BriefcaseBusiness],

        ["Update Profile", "/jobseeker/profile", UserRound],

        ["Explore Training", "/training", GraduationCap],

        ["View PESO Assistance", "/jobseeker/assistance", Handshake],
      ].map(([label, to, Icon]) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-16 items-center gap-3 py-4 text-sm font-medium text-primary hover:underline"
        >
          <Icon size={18} />
          {label}
          <ArrowRight size={15} className="ml-auto" />
        </Link>
      ))}
    </div>
  )
}
