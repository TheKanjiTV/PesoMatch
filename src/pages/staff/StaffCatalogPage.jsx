import { useState } from "react"
import { useLocation, useParams } from "react-router"
import { mockJobs } from "../../data/mockJobs.js"
import { mockTrainings } from "../../data/mockTrainings.js"
import {
  PageHeading,
  Button,
  EmptyState,
  Badge,
  panel,
} from "../../components/common/UI.jsx"
import {
  StaffBack,
  StaffPermission,
  StaffSearch,
  tableClass,
} from "../../components/staff/StaffShared.jsx"
export default function StaffCatalogPage() {
  const { id } = useParams(),
    { pathname } = useLocation(),
    [search, setSearch] = useState(""),
    training = pathname.startsWith("/peso/training"),
    employers = pathname === "/peso/employers"
  const records = training ? mockTrainings : mockJobs,
    item = records.find((record) => record.id === id)
  if (id && !item)
    return (
      <EmptyState
        heading="h1"
        title="Record not found"
        description="Choose an available sample opportunity."
        action={
          <Button to={training ? "/peso/training" : "/peso/assistance"}>
            Return to Workspace
          </Button>
        }
      />
    )
  if (item)
    return (
      <>
        <StaffBack to={training ? "/peso/training" : "/peso/assistance"}>
          {training ? "Back to Training" : "Back to Employment Assistance"}
        </StaffBack>
        <PageHeading
          title={item.title}
          description={training ? item.provider : item.company}
        />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${panel} overflow-hidden`}>
            {training && (
              <img
                src={item.image}
                alt="Sample workplace training"
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-base font-semibold">
                {training ? "Training Overview" : "About the Opportunity"}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
              {[
                [
                  training ? "Learning Objectives" : "Responsibilities",
                  training ? item.learningObjectives : item.responsibilities,
                ],
                [
                  training ? "Requirements" : "Minimum Qualifications",
                  training ? item.requirements : item.qualifications,
                ],
              ].map(([label, items]) => (
                <section key={label} className="mt-6">
                  <h3 className="text-sm font-semibold">{label}</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7">
                    {(items || []).map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
          <aside className={`${panel} p-5`}>
            <h2 className="text-base font-semibold">
              {training ? "Training Information" : "Recorded Requirements"}
            </h2>
            <p className="mt-3 text-sm leading-7">
              {item.location}
              <br />
              {training ? item.mode : item.employmentType}
              <br />
              {training ? item.duration : item.educationLevel}
            </p>
            <h3 className="mt-5 text-sm font-semibold">
              {training ? "Skills Addressed" : "Required Skills"}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(training ? item.skillsAddressed : item.requiredSkills).map(
                (skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ),
              )}
            </div>
            {training && (
              <>
                <h3 className="mt-5 text-sm font-semibold">
                  Related Opportunities
                </h3>
                {mockJobs
                  .filter((job) => item.jobIds.includes(job.id))
                  .map((job) => (
                    <Button
                      key={job.id}
                      to={`/peso/vacancies/${job.id}`}
                      variant="text"
                      className="mt-2 !px-0 text-left text-xs"
                    >
                      {job.title}
                    </Button>
                  ))}
              </>
            )}
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              Sample information only. Recommend relevant training from an
              assistance record; no enrollment or employer submission is
              performed.
            </p>
          </aside>
        </div>
      </>
    )
  const visible = records.filter((record) =>
    `${record.title} ${record.provider || record.company} ${(record.skillsAddressed || record.requiredSkills).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const content = (
    <>
      <PageHeading
        title={
          training ? "Training Programs" : employers ? "Employers" : "Vacancies"
        }
        description={
          training
            ? "Review sample programs and the skills they address. Recommendations are recorded from assistance requests."
            : "Read-only reference preview. Employer and vacancy management will be implemented with the backend."
        }
      />
      <div className="mb-5">
        <StaffSearch
          value={search}
          onChange={setSearch}
          label={
            training
              ? "Search training, skill or provider"
              : "Search opportunity, employer or skill"
          }
        />
      </div>
      {visible.length ? (
        <div className={`${panel} overflow-hidden`}>
          <div
            role="region"
            aria-label="Opportunity reference list"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className={`${tableClass} min-w-[700px]`}>
              <caption className="sr-only">
                Sample {training ? "training programs" : "opportunities"}
              </caption>
              <thead className="bg-muted">
                <tr>
                  {[
                    training ? "Training" : "Target Job",
                    training ? "Provider" : "Employer",
                    "Location",
                    training ? "Skills Addressed" : "Employment Type",
                    "Action",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.title}</td>
                    <td>{record.provider || record.company}</td>
                    <td>{record.location}</td>
                    <td>
                      {training
                        ? record.skillsAddressed.join(", ")
                        : record.employmentType}
                    </td>
                    <td>
                      <Button
                        to={`/peso/${
                          training ? "training" : "vacancies"
                        }/${record.id}`}
                        variant="secondary"
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No sample records found"
          description="Try another search."
        />
      )}
    </>
  )
  return training ? (
    content
  ) : (
    <StaffPermission
      permission={employers ? "manage_employers" : "manage_vacancies"}
    >
      {content}
    </StaffPermission>
  )
}
