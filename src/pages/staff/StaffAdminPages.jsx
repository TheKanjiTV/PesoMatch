import { useState } from "react"
import { useLocation } from "react-router"
import { mockStaff } from "../../data/mockStaff.js"
import { mockJobs } from "../../data/mockJobs.js"
import { roleLabels } from "../../services/staffPermissions.js"
import {
  PageHeading,
  Button,
  Modal,
  panel,
} from "../../components/common/UI.jsx"
import {
  StaffPermission,
  tableClass,
  assistanceDate,
} from "../../components/staff/StaffShared.jsx"
export default function StaffAdminPages() {
  const { pathname } = useLocation(),
    [dialog, setDialog] = useState(null),
    section = pathname.split("/").at(-1)
  const permission =
    section === "staff"
      ? "manage_staff"
      : section === "reference-data"
        ? "manage_reference"
        : "manage_settings"
  const title =
    section === "staff"
      ? "Staff Accounts"
      : section === "reference-data"
        ? "Skills / Reference Data"
        : "System Settings"
  return (
    <StaffPermission permission={permission}>
      <PageHeading
        title={title}
        description="Administrative preview. Backend management and production permissions are not connected."
      />
      {section === "staff" ? (
        <div className={`${panel} overflow-hidden`}>
          <div
            role="region"
            aria-label="Staff accounts"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className={`${tableClass} min-w-[800px]`}>
              <caption className="sr-only">Sample staff accounts</caption>
              <thead className="bg-muted">
                <tr>
                  {[
                    "Name / Email",
                    "Role",
                    "Status",
                    "Last Active",
                    "Actions",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockStaff.map((person) => (
                  <tr key={person.id}>
                    <td>
                      {person.name}
                      <span className="block text-muted-foreground">
                        {person.email}
                      </span>
                    </td>
                    <td>{roleLabels[person.role]}</td>
                    <td>{person.active ? "Active" : "Inactive"}</td>
                    <td>{assistanceDate(person.lastActive)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {["View", "Edit Role", "Deactivate"].map((action) => (
                          <Button
                            key={action}
                            variant="text"
                            className="text-xs"
                            onClick={() => setDialog({ action, person })}
                            aria-label={`${action} ${person.name}`}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : section === "reference-data" ? (
        <section className={`${panel} p-5`}>
          <h2 className="text-base font-semibold">Recorded Sample Skills</h2>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            {[...new Set(mockJobs.flatMap((job) => job.requiredSkills))]
              .sort()
              .map((skill) => (
                <li key={skill} className="border-b border-border pb-3">
                  {skill}
                </li>
              ))}
          </ul>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Reference editing and destructive actions are reserved for future
            authorized backend workflows.
          </p>
        </section>
      ) : (
        <div className={`${panel} divide-y divide-border px-6`}>
          {[
            [
              "PESO Office Information",
              "Sample PESO Bansud. Official office hours and contact information are not connected.",
            ],
            [
              "Reference Data",
              "Skills and categories are currently predefined sample records.",
            ],
            [
              "Notification Preferences",
              "Prototype updates stay in the browser. Email and SMS delivery are not configured.",
            ],
            [
              "System Configuration",
              "Production authorization, audit retention and government reporting will be specified with the backend.",
            ],
          ].map(([name, description]) => (
            <section key={name} className="py-6">
              <h2 className="text-base font-semibold">{name}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                {description}
              </p>
            </section>
          ))}
        </div>
      )}
      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={
          dialog ? `${dialog.action} — ${dialog.person.name}` : "Staff account"
        }
      >
        {dialog && (
          <>
            <p className="text-sm leading-7">
              {dialog.person.email}
              <br />
              {roleLabels[dialog.person.role]} /{" "}
              {dialog.person.active ? "Active" : "Inactive"}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {dialog.action === "View"
                ? "This is a fictional staff account."
                : `${dialog.action} is a future administrative workflow. No account is changed or deactivated in this preview. A future action will require explicit confirmation and backend authorization.`}
            </p>
            <Button className="mt-5" onClick={() => setDialog(null)}>
              Close Preview
            </Button>
          </>
        )}
      </Modal>
    </StaffPermission>
  )
}
