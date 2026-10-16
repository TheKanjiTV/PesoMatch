import { useState } from "react"

import { useParams } from "react-router"

import { useStaff } from "../../context/StaffContext.jsx"

import { mockJobseekers } from "../../data/mockJobseekers.js"

import { mockJobs } from "../../data/mockJobs.js"

import { mockTrainings } from "../../data/mockTrainings.js"

import { assistanceStatuses } from "../../data/assistanceStatuses.js"

import { outcomeOptions } from "../../services/staffAssistanceService.js"

import {
  PageHeading,
  Field,
  Button,
  EmptyState,
  Badge,
  panel,
} from "../../components/common/UI.jsx"

import {
  StaffSearch,
  StaffBack,
  StaffLoadState,
  AssistanceTable,
  tableClass,
  assistanceDate,
} from "../../components/staff/StaffShared.jsx"

export default function StaffJobseekersPage() {
  const { state } = useStaff(),
    [filters, setFilters] = useState({})

  const set = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const related = (id) => state.records.filter((r) => r.jobseekerId === id)

  const people = mockJobseekers.filter(
    (person) =>
      `${person.name} ${person.occupation} ${person.skills.join(" ")}`

        .toLowerCase()

        .includes((filters.search || "").toLowerCase()) &&
      (!filters.municipality || person.municipality === filters.municipality) &&
      (!filters.profile ||
        (filters.profile === "complete"
          ? person.completion === 100
          : person.completion < 100)) &&
      (!filters.employment ||
        related(person.id).some((r) => r.outcome === filters.employment)) &&
      (!filters.assistance ||
        related(person.id).some((r) => r.status === filters.assistance)),
  )

  const select = (label, key, options) => (
    <Field
      key={key}
      label={label}
      value={filters[key] || ""}
      onChange={(e) => set(key, e.target.value)}
    >
      <option value="">All</option>
      {options.map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </Field>
  )

  return (
    <>
      <PageHeading
        title="Jobseekers"
        description="Review employment profiles, current assistance and the support each person may need."
      />
      <div className={`${panel} mb-5 p-4`}>
        <StaffSearch
          label="Search name, skill or preferred occupation"
          value={filters.search || ""}
          onChange={(value) => set("search", value)}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {select(
            "Municipality",

            "municipality",

            mockJobseekers.map((p) => [p.municipality, p.municipality]),
          )}
          {select("Profile status", "profile", [
            ["complete", "Complete"],

            ["incomplete", "Incomplete"],
          ])}
          {select(
            "Employment outcome",

            "employment",

            Object.entries(outcomeOptions),
          )}
          {select(
            "Assistance status",

            "assistance",

            Object.entries(assistanceStatuses).map(([id, item]) => [
              id,

              item.label,
            ]),
          )}
        </div>
        <Button
          variant="text"
          onClick={() => setFilters({})}
          className="mt-2 text-xs"
        >
          Clear Filters
        </Button>
      </div>
      <StaffLoadState kind="jobseeker profile">
        {!people.length ? (
          <EmptyState
            title="No jobseekers found"
            description="Try another name or change your filters."
          />
        ) : (
          <div className={`${panel} overflow-hidden`}>
            <div
              tabIndex={0}
              role="region"
              aria-label="Jobseeker directory"
              className="overflow-x-auto"
            >
              <table className={`${tableClass} min-w-[800px]`}>
                <caption className="sr-only">Sample jobseeker profiles</caption>
                <thead className="bg-muted">
                  <tr>
                    {[
                      "Name / Location",

                      "Profile",

                      "Preferred Occupation",

                      "Active Assistance",

                      "Latest Activity",

                      "Action",
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {people.map((person) => {
                    const records = related(person.id)

                    return (
                      <tr key={person.id} className="hover:bg-secondary/40">
                        <td>
                          <span className="font-medium">{person.name}</span>
                          <span className="block text-muted-foreground">
                            {person.location}
                          </span>
                        </td>
                        <td>{person.completion}% complete</td>
                        <td>{person.occupation}</td>
                        <td>
                          {
                            records.filter(
                              (r) => r.status !== "outcome_recorded",
                            ).length
                          }
                        </td>
                        <td>
                          {assistanceDate(
                            records

                              .map((r) => r.updatedAt)

                              .sort()

                              .at(-1),
                          )}
                        </td>
                        <td>
                          <Button
                            to={`/peso/jobseekers/${person.id}`}
                            variant="secondary"
                            className="text-xs"
                            aria-label={`View ${person.name}`}
                          >
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </StaffLoadState>
    </>
  )
}

export function StaffJobseekerDetails() {
  const { id } = useParams(),
    { state } = useStaff(),
    person = mockJobseekers.find((item) => item.id === id)

  if (!person)
    return (
      <EmptyState
        heading="h1"
        title="Jobseeker not found"
        description="Select an available sample profile."
        action={<Button to="/peso/jobseekers">View Jobseekers</Button>}
      />
    )

  const records = state.records.filter((item) => item.jobseekerId === id),
    jobIds = [...new Set(records.map((r) => r.jobId))],
    jobs = mockJobs.filter((job) => jobIds.includes(job.id)).slice(0, 3),
    trainings = mockTrainings.filter((t) =>
      t.jobIds.some((id) => jobIds.includes(id)),
    )

  return (
    <>
      <StaffBack to="/peso/jobseekers">Back to Jobseekers</StaffBack>
      <PageHeading
        title={person.name}
        description="Sample jobseeker / Employment assistance profile"
        actions={<Badge>{person.completion}% Profile Complete</Badge>}
      />
      <StaffLoadState kind="jobseeker profile">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">
                Basic Information &amp; Contact
              </h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                {[
                  ["Name", person.name],

                  ["Location", person.location],

                  ["Contact", person.mobile],

                  [
                    "Email",

                    `${person.email} / ${
                      person.verified ? "Verified" : "Unverified"
                    }`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-2 break-words leading-7">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">
                Education &amp; Qualifications
              </h2>
              <p className="mt-3 text-sm leading-7">
                {person.education.attainment}
                <br />
                {person.education.school}
                <br />
                {person.education.program}
              </p>
              <h3 className="mt-5 text-sm font-semibold">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {person.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
              <h3 className="mt-5 text-sm font-semibold">Certifications</h3>
              <p className="mt-2 text-sm">
                {person.certifications.join(", ") ||
                  "No certifications recorded."}
              </p>
              <h3 className="mt-5 text-sm font-semibold">Languages</h3>
              <p className="mt-2 text-sm leading-7">
                {person.languages.join("; ")}
              </p>
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Work Experience</h2>
              {person.experience.length ? (
                person.experience.map((item) => (
                  <div key={item.title} className="mt-4">
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.company} / {item.period}
                    </p>
                    <p className="mt-2 text-sm leading-7">{item.description}</p>
                  </div>
                ))
              ) : (
                <p className="mt-3 text-sm leading-7">
                  Fresh graduate / First-time jobseeker. No previous employment
                  recorded.
                </p>
              )}
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Job Preferences</h2>
              <p className="mt-3 text-sm leading-7">
                {person.preferences.occupations.join(", ")}
                <br />
                {person.preferences.location}
                <br />
                {person.preferences.employmentTypes.join(", ")} /{" "}
                {person.preferences.arrangements.join(", ")}
              </p>
            </section>
          </div>
          <aside className="space-y-5">
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">
                Recommended Jobs &amp; Skill Gaps
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Predefined sample guidance; scores are not hiring criteria.
              </p>
              {jobs.map((job) => (
                <div key={job.id} className="mt-4 border-t border-border pt-4">
                  <h3 className="text-sm font-medium">{job.title}</h3>
                  <p className="mt-2 text-xs text-primary">
                    {job.matchScore}% Sample Match
                  </p>
                  <p className="mt-2 text-xs leading-6">
                    Skills to improve:{" "}
                    {job.skillGaps.join(", ") || "None recorded"}
                  </p>
                  <Button
                    to={`/peso/vacancies/${job.id}`}
                    variant="text"
                    className="!px-0 text-xs"
                  >
                    Review Opportunity
                  </Button>
                </div>
              ))}
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">
                Training Recommendations
              </h2>
              {trainings.map((item) => (
                <Button
                  key={item.id}
                  to={`/peso/training/${item.id}`}
                  variant="text"
                  className="mt-2 !justify-start !px-0 text-left text-xs"
                >
                  {item.title}
                </Button>
              ))}
            </section>
            <section className={`${panel} p-5`}>
              <h2 className="text-base font-semibold">Employment Outcomes</h2>
              {records

                .filter((r) => r.outcome)

                .map((r) => (
                  <p key={r.id} className="mt-3 text-sm leading-7">
                    {outcomeOptions[r.outcome]}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {r.jobTitle} / {assistanceDate(r.outcomeAt)}
                    </span>
                  </p>
                ))}
              {!records.some((r) => r.outcome) && (
                <p className="mt-3 text-sm">No outcome recorded yet.</p>
              )}
            </section>
          </aside>
        </div>
        <section className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">
            PESO Assistance History
          </h2>
          <AssistanceTable records={records} compact />
        </section>
      </StaffLoadState>
    </>
  )
}
