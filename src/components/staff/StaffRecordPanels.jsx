import { Check, LockKeyhole, Globe, Circle } from "lucide-react"

import { Button, panel, Badge } from "../common/UI.jsx"

import { assistanceDate, staffName } from "./StaffShared.jsx"

import { mockJobseekers } from "../../data/mockJobseekers.js"

import { mockJobs } from "../../data/mockJobs.js"

import { mockTrainings } from "../../data/mockTrainings.js"

export function StaffJobseekerSummary({ record }) {
  const person = mockJobseekers.find((item) => item.id === record.jobseekerId)

  return (
    <section className={`${panel} p-5`}>
      <h2 className="text-base font-semibold">Jobseeker Profile</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium">{person.name}</h3>
        <Badge>{person.completion}% Profile Complete</Badge>
      </div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {[
          ["Contact", person.mobile],

          [
            "Email",

            `${person.email} / ${person.verified ? "Verified" : "Unverified"}`,
          ],

          ["Location", person.location],

          ["Education", person.education.attainment],

          ["Preferred occupation", person.occupation],

          [
            "Experience",

            person.experience.length
              ? "Previous work experience"
              : "First-time jobseeker",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words leading-7">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs font-semibold">Key Skills</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {person.skills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
      </div>
      <Button
        to={`/peso/jobseekers/${person.id}`}
        variant="secondary"
        className="mt-5 text-xs"
      >
        View Full Jobseeker Profile
      </Button>
    </section>
  )
}

export function StaffSelectedJob({ record }) {
  const job = mockJobs.find((item) => item.id === record.jobId)

  return (
    <section className={`${panel} p-5`}>
      <h2 className="text-base font-semibold">Selected Opportunity</h2>
      <h3 className="mt-4 font-medium">{job.title}</h3>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        {job.company}
        <br />
        {job.location} / {job.employmentType}
      </p>
      <p className="mt-4 text-sm font-semibold text-primary">
        {job.matchScore}% Sample Match
      </p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        Decision support only. Review the actual qualifications; this score is
        not approval criteria.
      </p>
      <h3 className="mt-5 text-sm font-semibold">Recorded Requirements</h3>
      <ul className="mt-2 space-y-2 text-xs leading-6">
        {job.requiredSkills.map((skill) => (
          <li key={skill} className="flex items-start gap-2">
            <Circle size={13} className="mt-1.5 shrink-0" />
            {skill}
          </li>
        ))}
      </ul>
      <h3 className="mt-5 text-sm font-semibold">Why This May Fit</h3>
      <ul className="mt-2 space-y-2 text-xs">
        {job.matchedCriteria.slice(0, 3).map((item) => (
          <li key={item} className="flex gap-2">
            <Check size={14} />
            {item}
          </li>
        ))}
      </ul>
      <h3 className="mt-5 text-sm font-semibold">Skill Gaps</h3>
      <p className="mt-2 text-xs leading-6">
        {job.skillStatuses

          .map((item) => `${item.skill} / ${item.status}`)

          .join("; ") || "No major skill gaps recorded."}
      </p>
      <Button
        to={`/peso/vacancies/${job.id}`}
        variant="secondary"
        className="mt-4 text-xs"
      >
        View Job Details
      </Button>
    </section>
  )
}

export function StaffAssistanceTimeline({ record }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={`${panel} p-5`}>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Globe size={18} />
          Jobseeker-visible Updates
        </h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Only these messages are included in the public update preview.
        </p>
        <ol className="mt-5 divide-y divide-border">
          {[...record.publicUpdates].reverse().map((item) => (
            <li key={item.id} className="py-4 first:pt-0">
              <p className="text-xs text-muted-foreground">
                {assistanceDate(item.date)}
              </p>
              <p className="mt-1 text-sm leading-7">{item.message}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className={`${panel} p-5`}>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <LockKeyhole size={18} />
          Internal Staff Activity
        </h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Staff-only notes. Excluded from the jobseeker preview.
        </p>
        <ol className="mt-5 divide-y divide-border">
          {[...record.internalActivity].reverse().map((item) => (
            <li key={item.id} className="py-4 first:pt-0">
              <p className="text-xs text-muted-foreground">
                {assistanceDate(item.date)} / {staffName(item.staffId)}
              </p>
              <p className="mt-1 text-sm font-medium">
                {item.action.replaceAll("_", " ").replace(/([A-Z])/g, " $1")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-7">
                {item.note}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export function StaffTrainingRecommendations({ record }) {
  return (
    record.trainingRecommendations.length > 0 && (
      <section className={`${panel} p-5`}>
        <h2 className="text-base font-semibold">
          Recorded Training Recommendations
        </h2>
        <ul className="mt-4 divide-y divide-border">
          {record.trainingRecommendations.map((item) => {
            const training = mockTrainings.find((t) => t.id === item.trainingId)

            return (
              <li key={item.trainingId} className="py-3">
                <h3 className="text-sm font-medium">{training.title}</h3>
                <p className="mt-1 text-xs leading-6">{item.reason}</p>
                <Button
                  to={`/peso/training/${training.id}`}
                  variant="text"
                  className="!px-0 text-xs"
                >
                  View Training
                </Button>
              </li>
            )
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          A recommendation does not mean enrollment or completion.
        </p>
      </section>
    )
  )
}
