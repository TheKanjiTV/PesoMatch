import { useFeedback } from "../../components/common/Feedback.jsx"

import { useState } from "react"
import { useSearchParams } from "react-router"
import { ProfileEditor } from "../../components/common/ProfileEditor.jsx"

import {
  Bell,
  Handshake,
  GraduationCap,
  SlidersHorizontal,
  UserRound,
  BriefcaseBusiness,
  BookOpen,
  Check,
  Pencil,
} from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import {
  PageHeading,
  Button,
  Badge,
  Skeleton,
  ErrorState,
  EmptyState,
  TextLink,
  StatusIcon,
  panel,
} from "../../components/common/UI.jsx"

import {
  ReferralStatusCard,
  NotificationItem,
} from "../../components/dashboard/Cards.jsx"

export function SkillsPage() {
  const { skillGaps, jobs, trainings } = useDashboard()

  return (
    <>
      <PageHeading
        title="Your Skill Analysis"
        description="See how each skill connects to a target job and a practical next step. This is a predefined example, not a new assessment."
      />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {skillGaps.map((skill) => (
          <article key={skill.id} className={`${panel} p-6`}>
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <StatusIcon status={skill.status} />
                {skill.name}
              </h2>
              <Badge>{skill.status}</Badge>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {skill.reason}
            </p>
            <div className="mt-5 grid gap-5 border-t border-border pt-4 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground">
                  Related job requirements
                </h3>
                {jobs

                  .filter((job) => skill.jobIds.includes(job.id))

                  .map((job) => (
                    <div key={job.id}>
                      <TextLink to={`/jobseeker/jobs/${job.id}`}>
                        {job.title}
                      </TextLink>
                    </div>
                  ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground">
                  Training to consider
                </h3>
                {trainings

                  .filter((item) => skill.trainingIds.includes(item.id))

                  .map((item) => (
                    <div key={item.id}>
                      <TextLink to={`/training/${item.id}`}>
                        {item.title}
                      </TextLink>
                    </div>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export { AssistancePage } from "./AssistancePage.jsx"

export function NotificationsPage() {
  const { notifications, markRead, replaceNotifications } = useDashboard()

  const { notify } = useFeedback()

  const [unreadOnly, setUnreadOnly] = useState(false)

  const visible = notifications.filter((item) => !unreadOnly || !item.read)

  return (
    <>
      <PageHeading
        title="Notifications"
        description="Sample updates on your profile, matching, training, and PESO assistance."
        actions={
          <Button
            variant="secondary"
            disabled={notifications.every((item) => item.read)}
            onClick={() => {
              const previous = notifications

              markRead()

              notify("Notifications marked as read.", {
                undo: () => replaceNotifications(previous),
              })
            }}
          >
            Mark all as read
          </Button>
        }
      />
      <div className="mb-5 flex gap-2">
        <Button
          variant={unreadOnly ? "secondary" : "primary"}
          aria-pressed={!unreadOnly}
          onClick={() => setUnreadOnly(false)}
        >
          All updates
        </Button>
        <Button
          variant={unreadOnly ? "primary" : "secondary"}
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(true)}
        >
          Unread
        </Button>
      </div>
      {visible.length ? (
        <ul className={`${panel} px-5`}>
          {visible.map((item) => (
            <li key={item.id} className="relative">
              <ul>
                <NotificationItem item={item} onRead={markRead} />
              </ul>
              <Button
                variant="text"
                className="mb-2"
                onClick={() => {
                  const previous = notifications

                  replaceNotifications(
                    notifications.filter((n) => n.id !== item.id),
                  )

                  notify("Notification dismissed.", {
                    type: "info",

                    undo: () => replaceNotifications(previous),
                  })
                }}
              >
                Dismiss {item.title}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="No unread sample notifications. New updates will appear here when available."
          action={
            <Button variant="secondary" onClick={() => setUnreadOnly(false)}>
              View all updates
            </Button>
          }
        />
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Read status is kept only while this demo workspace is open.
      </p>
    </>
  )
}

export { PrivacySettingsPage as SettingsPage } from "./PrivacySettingsPage.jsx"

function ProfileDetails({ items, wide = false }) {
  return (
    <dl
      className={`grid gap-x-6 gap-y-4 sm:grid-cols-2 ${
        wide ? "xl:grid-cols-3" : ""
      }`}
    >
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">{label}</dt>
          <dd className="mt-1 break-words text-sm leading-6">
            {value || "Not provided"}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ProfileSection({
  title,
  step,
  onEdit,
  icon: Icon,
  children,
  className = "",
}) {
  return (
    <section className={`${panel} overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          <Icon size={18} className="text-muted-foreground" />
          {title}
        </h2>
        <Button
          onClick={() => onEdit(step)}
          variant="text"
          className="!px-2 !text-xs"
          aria-label={`Edit ${title}`}
        >
          <Pencil size={13} />
          Edit
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function ProfilePage() {
  const [params, setParams] = useSearchParams()
  const initialStep = Number(params.get("edit"))
  const [editing, setEditing] = useState(null)
  const editingStep =
    editing || (initialStep >= 1 && initialStep <= 5 ? initialStep : null)
  const closeEditor = () => {
    setEditing(null)
    if (params.has("edit")) {
      const next = new URLSearchParams(params)
      next.delete("edit")
      setParams(next, { replace: true })
    }
  }
  const {
    profile,
    serverProfile: data,
    profileLoading,
    profileError,
    reloadProfile,
  } = useDashboard()

  if (profileLoading && !data)
    return (
      <>
        <PageHeading title="Your Jobseeker Profile" />
        <Skeleton kind="profile" />
      </>
    )

  if (profileError || !data)
    return (
      <>
        <PageHeading title="Your Jobseeker Profile" />
        <ErrorState onRetry={reloadProfile} />
      </>
    )

  const {
    personal,
    education,
    skills: qualifications,
    work_experience: work,
    preferences,
  } = data

  return (
    <>
      <PageHeading
        title="Your Jobseeker Profile"
        description="Your experience. Your skills. Your next opportunity."
        actions={
          <Button onClick={() => setEditing(1)}>
            <Pencil size={15} />
            Edit Profile
          </Button>
        }
      />
      <section
        className={`${panel} mb-5 flex flex-col overflow-hidden sm:flex-row`}
      >
        <div className="relative h-36 shrink-0 overflow-hidden sm:h-auto sm:w-52">
          <img
            src="/images/office-team.jpg"
            alt="A collaborative workplace"
            className="size-full object-cover"
          />
          <span className="absolute inset-0 bg-primary/15" />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              JOBSEEKER PROFILE
            </div>
            <h2 className="text-xl font-semibold">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="mt-2 text-sm leading-6">
              {profile.headline || "Add a headline to introduce yourself"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{profile.role}</p>
            <p className="mt-1 break-all text-xs leading-6 text-muted-foreground">
              {profile.email}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {[personal.municipality, personal.province]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-primary">
            <Check size={14} />
            {profile.profileCompletion}% complete
          </span>
        </div>
      </section>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <ProfileSection
          title="Personal Information"
          step={1}
          onEdit={setEditing}
          icon={UserRound}
        >
          <ProfileDetails
            items={[
              [
                "Full name",
                [personal.first_name, personal.middle_name, personal.last_name]
                  .filter(Boolean)
                  .join(" "),
              ],
              ["Birth date", personal.birth_date],
              ["Sex (optional)", personal.sex],
              ["Mobile number", personal.mobile_number],
              ["Address", personal.address_line],
              [
                "Locality",
                [personal.barangay, personal.municipality, personal.province]
                  .filter(Boolean)
                  .join(", "),
              ],
            ]}
          />
        </ProfileSection>
        <ProfileSection
          title="Skills & Qualifications"
          step={3}
          onEdit={setEditing}
          icon={BookOpen}
        >
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
          <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
            {[
              [
                "Certifications",
                qualifications.certifications || [],
                (item) =>
                  [
                    item.certification_name,
                    item.issuing_organization,
                    item.issued_at,
                  ]
                    .filter(Boolean)
                    .join(" / "),
              ],
              [
                "Languages",
                qualifications.languages || [],
                (item) => `${item.language} / ${item.proficiency}`,
              ],
              [
                "Licenses",
                qualifications.licenses || [],
                (item) =>
                  [item.license_name, item.expiry_date]
                    .filter(Boolean)
                    .join(" / "),
              ],
            ].map(([label, items, format]) => (
              <section key={label}>
                <h3 className="text-xs font-medium">{label}</h3>
                {items.length ? (
                  <ul className="mt-2 space-y-2 text-xs leading-6 text-muted-foreground">
                    {items.map((item, index) => (
                      <li key={index}>{format(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    None added (optional)
                  </p>
                )}
              </section>
            ))}
          </div>
        </ProfileSection>
        <ProfileSection
          title="Education"
          step={2}
          onEdit={setEditing}
          icon={GraduationCap}
        >
          <ProfileDetails
            items={[
              ["Highest attainment", education.highest_attainment],
              ["School / institution", education.school_name],
              ["Course / program", education.course_program],
              ["Educational status", education.educational_status],
              ["Year level", education.year_level],
              ["Year graduated", education.year_graduated],
            ]}
          />
        </ProfileSection>
        <ProfileSection
          title="Work Experience"
          step={4}
          onEdit={setEditing}
          icon={BriefcaseBusiness}
        >
          {work.has_experience ? (
            <div className="divide-y divide-border">
              {work.experiences.map((item, index) => (
                <div key={index} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="text-sm font-semibold">{item.job_title}</h3>
                  <p className="mt-1 text-sm">{item.company_name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.start_date} /{" "}
                    {item.is_current ? "Present" : item.end_date}
                  </p>
                  {item.description && (
                    <p className="mt-3 whitespace-pre-wrap text-xs leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-background p-4">
              <p className="text-sm font-medium">
                Ready for a first opportunity
              </p>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">
                No previous work experience recorded. This section is complete.
              </p>
            </div>
          )}
        </ProfileSection>
        <ProfileSection
          title="Job Preferences"
          step={5}
          onEdit={setEditing}
          icon={SlidersHorizontal}
          className="xl:col-span-2"
        >
          <ProfileDetails
            wide
            items={[
              ["Preferred occupations", profile.preferredFields.join(", ")],
              ["Industry", preferences.preferred_industry],
              ["Location", preferences.preferred_location],
              ["Employment type", profile.employmentType],
              ["Work arrangement", profile.workArrangement.join(" / ")],
              [
                "Willing to relocate",
                preferences.willing_to_relocate ? "Yes" : "No",
              ],
            ]}
          />
          <div className="mt-3">
            <Button variant="text" onClick={() => setEditing(5)}>
              Edit Preferences
            </Button>
          </div>
        </ProfileSection>
      </div>
      {editingStep && (
        <ProfileEditor
          key={editingStep}
          step={editingStep}
          onClose={closeEditor}
        />
      )}
    </>
  )
}
