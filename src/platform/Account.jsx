import { useEffect, useState } from "react"

import { withMinimumLoading } from "./loading.js"

import { useWorkspaceActivity } from "./WorkspaceLoading.jsx"

import { useResource } from "./api.js"

import { ResourceState } from "./ResourceState.jsx"

import { Link, useNavigate } from "react-router"

import { useAuth } from "../context/AuthContext.jsx"

import { PrivacyRequests } from "./PrivacyRequests.jsx"

import { ResumePanel } from "./Resume.jsx"

import { AppearanceSettings } from "./Appearance.jsx"
import { AccountHistory } from "./AccountHistory.jsx"

import {
  deleteAccount,
  getProfile,
  getSkills,
  updateAccount,
  updatePassword,
} from "../services/account.js"

import {
  Badge,
  Contact,
  Editor,
  Heading,
  Notice,
  primaryStyle,
  roles,
  secondaryStyle,
} from "./ui.jsx"

import { ProfileSkeleton, SettingsSkeleton } from "./LoadingStates.jsx"

export function ProfilePage() {
  const { user, onboarding } = useAuth()

  const [profile, setProfile] = useState(null),
    [error, setError] = useState(""),
    [skills, setSkills] = useState([])

  useWorkspaceActivity(!profile && !error)

  useEffect(() => {
    let alive = true

    withMinimumLoading(() => Promise.all([getProfile(), getSkills()]))

      .then(([p, s]) => {
        if (!alive) return

        setProfile(p.data)

        setSkills(s.data)
      })

      .catch((e) => {
        if (alive) setError(e.message)
      })

    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <Heading
        title="My Jobseeker Profile"
        description="Keep your skills, education, experience, and preferences current so PESO can support your next step."
      />
      <ResumePanel
        onApplied={async () => {
          const r = await getProfile()

          setProfile(r.data)
        }}
      />
      {error && <Notice error>{error}</Notice>}
      {!profile && !error ? (
        <ProfileSkeleton />
      ) : (
        profile && (
          <>
            <div className="mb-8 rounded-lg border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-primary">
                    {user.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <Contact value={user.email} />
                  </p>
                </div>
                <Badge>
                  {onboarding?.completed
                    ? "Profile complete"
                    : "Setup in progress"}
                </Badge>
              </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {[
                [
                  "Personal information",

                  "1",

                  [
                    [
                      "Location",

                      [
                        profile.personal.barangay,

                        profile.personal.municipality,

                        profile.personal.province,
                      ]

                        .filter(Boolean)

                        .join(", "),
                    ],

                    ["Mobile", profile.personal.mobile_number],
                  ],
                ],

                [
                  "Education",

                  "2",

                  [
                    [
                      "Highest attainment",

                      profile.education.highest_attainment,
                    ],

                    ["School", profile.education.school_name],

                    ["Program", profile.education.course_program],
                  ],
                ],

                [
                  "Skills & qualifications",

                  "3",

                  [
                    [
                      "Skills",

                      skills

                        .filter((s) => profile.skills.skills.includes(s.id))

                        .map((s) => s.name)

                        .join(", "),
                    ],

                    [
                      "Certifications",

                      profile.skills.certifications

                        .map((c) => c.certification_name)

                        .join(", "),
                    ],

                    [
                      "Languages",

                      profile.skills.languages

                        .map((c) => c.language)

                        .join(", "),
                    ],
                  ],
                ],

                [
                  "Work experience",

                  "4",

                  profile.work_experience.experiences.length
                    ? profile.work_experience.experiences.map((e) => [
                        e.job_title,

                        e.company_name,
                      ])
                    : [["Experience", "No work experience declared"]],
                ],

                [
                  "Employment preferences",

                  "5",

                  [
                    ["Occupations", profile.preferences.occupations.join(", ")],

                    ["Location", profile.preferences.preferred_location],

                    [
                      "Employment types",

                      profile.preferences.employment_types.join(", "),
                    ],

                    [
                      "Work arrangements",

                      profile.preferences.work_arrangements.join(", "),
                    ],
                  ],
                ],
              ].map(([label, step, rows]) => (
                <section
                  key={step}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-2xl text-primary">
                      {label}
                    </h2>
                    <Link
                      className={secondaryStyle}
                      to={`/jobseeker/onboarding/${step}?review=1`}
                    >
                      Edit
                    </Link>
                  </div>
                  <dl className="mt-5 space-y-4">
                    {rows.map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="mt-1 text-sm leading-6">
                          {k === "Mobile" ? (
                            <Contact value={v} phone />
                          ) : (
                            v || "Not provided"
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </>
        )
      )}
    </>
  )
}

export function AccountPage() {
  const { user, refresh, logout } = useAuth(),
    navigate = useNavigate()

  const [editor, setEditor] = useState(null),
    [message, setMessage] = useState("")

  const contact = useResource(
    user.role === "jobseeker" ? "/jobseeker/profile" : "/auth/user",

    "/api",
  )

  const mobile = contact.data?.data?.personal?.mobile_number || ""

  const fields = {
    account: [
      { name: "first_name", label: "First name" },

      { name: "middle_name", label: "Middle name", required: false },

      { name: "last_name", label: "Last name" },

      { name: "email", label: "Email address", type: "email" },

      { name: "mobile_number", label: "Mobile number (+639XXXXXXXXX)" },

      { name: "current_password", label: "Current password", type: "password" },
    ],

    password: [
      { name: "current_password", label: "Current password", type: "password" },

      {
        name: "password",

        label: "New password",

        type: "password",

        minLength: 8,
      },

      {
        name: "password_confirmation",

        label: "Confirm new password",

        type: "password",

        minLength: 8,
      },
    ],

    delete: [
      { name: "current_password", label: "Current password", type: "password" },

      {
        name: "confirmation",

        label: "Type DELETE to permanently delete your account",

        pattern: "DELETE",
      },
    ],
  }

  async function save(v) {
    if (editor === "password") await updatePassword(v)
    else if (editor === "delete") {
      if (v.confirmation !== "DELETE")
        throw new Error("Type DELETE to confirm.")

      await deleteAccount({ current_password: v.current_password })

      await refresh()

      navigate("/")

      return
    } else {
      const { role, id, name, ...body } = v

      await updateAccount(
        Object.fromEntries(
          fields.account.map((f) => [f.name, body[f.name] ?? ""]),
        ),
      )

      await contact.reload()

      await refresh()
    }

    setMessage(
      editor === "password"
        ? "Password updated. Other sessions have been signed out."
        : "Account information saved.",
    )
  }

  if (!contact.data)
    return <ResourceState resource={contact} skeleton={<SettingsSkeleton />} />

  return (
    <>
      <Heading
        title="Account Settings"
        description="Manage your contact information, password, and account."
      />
      {message && (
        <div className="mb-5">
          <Notice>{message}</Notice>
        </div>
      )}
      {editor && (
        <Editor
          key={editor}
          title={
            {
              account: "Update account information",

              password: "Change password",

              delete: "Delete account permanently",
            }[editor]
          }
          fields={fields[editor]}
          submitLabel={
            editor === "delete" ? "Delete account permanently" : "Save record"
          }
          pendingLabel={editor === "delete" ? "Deleting…" : "Saving…"}
          initial={
            editor === "account" ? { ...user, mobile_number: mobile } : {}
          }
          onClose={() => setEditor(null)}
          onSave={save}
          help={
            editor === "delete"
              ? "Deletion removes your live account, profile, résumé and linked service records. Audit entries and privacy requests may remain without the account link; backups require operator review. For a retention review, submit a privacy request instead. This action cannot be undone."
              : undefined
          }
        />
      )}
      <AppearanceSettings />
      <button
        className={`${secondaryStyle} mb-6`}
        onClick={() => window.dispatchEvent(new Event("peso:open-tour"))}
      >
        Replay workspace tutorial
      </button>
      <section className="rounded-lg border border-border bg-card px-6">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-border py-6">
          <div>
            <h2 className="text-base font-semibold text-primary">
              Account information
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {user.name} · <Contact value={user.email} />
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {roles[user.role]}
            </p>
          </div>
          <button
            className={secondaryStyle}
            onClick={() => setEditor("account")}
          >
            Edit account
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-border py-6">
          <div>
            <h2 className="text-base font-semibold text-primary">
              Password & security
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use a unique password. Updating it signs out your other sessions.
            </p>
          </div>
          <button
            className={secondaryStyle}
            onClick={() => setEditor("password")}
          >
            Change password
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 py-6">
          <div>
            <h2 className="text-base font-semibold text-error-ink">
              Delete account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Permanently remove your account and personal records.
            </p>
          </div>
          <button
            className={secondaryStyle}
            onClick={() => setEditor("delete")}
          >
            Delete account
          </button>
        </div>
      </section>
      <AccountHistory />
      <PrivacyRequests />
    </>
  )
}
