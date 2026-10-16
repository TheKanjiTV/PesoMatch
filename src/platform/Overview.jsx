import { Link } from "react-router"
import { useState } from "react"
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  FileCheck2,
  LifeBuoy,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "../context/AuthContext.jsx"
import { useResource } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"
import {
  ActionLink,
  Badge,
  date,
  Empty,
  Heading,
  human,
  Notice,
  Sample,
  Source,
  secondaryStyle,
  staffRole,
} from "./ui.jsx"

export function OverviewPage() {
  const [pathwayOpen, setPathwayOpen] = useState(false)
  const { user } = useAuth(),
    staff = staffRole(user.role)
  const r = useResource("/summary"),
    events = useResource("/events")
  const partner = ["employer", "training_provider"].includes(user.role)
  const tasks = staff
    ? [
        [
          "Review the jobseeker registry",
          "Open profiles, skills, and preferences to support an informed referral.",
          "/jobseekers",
        ],
        [
          "Process employment referrals",
          "Review requests, schedule interviews, and verify placement evidence.",
          "/referrals",
        ],
        [
          "Follow up employment outcomes",
          "Check reported status, verify evidence, and review due follow-ups.",
          "/outcomes",
        ],
      ]
    : user.role === "employer"
      ? [
          [
            "Manage your vacancies",
            "Submit a vacancy for PESO review and keep its requirements current.",
            "/jobs",
          ],
          [
            "Coordinate referred candidates",
            "Record interview schedules, hiring offers, and selection results.",
            "/referrals",
          ],
          [
            "Review recorded placements",
            "PESO verifies the employment start and schedules follow-up.",
            "/placements",
          ],
        ]
      : user.role === "training_provider"
        ? [
            [
              "Manage training programs",
              "Publish requirements, skills, schedules, fees, and capacity for PESO review.",
              "/training",
            ],
            [
              "Review enrollment requests",
              "Confirm eligible learners, update progress, and record completion.",
              "/enrollments",
            ],
            [
              "Coordinate community programs",
              "View scheduled orientations, livelihood activities, and job fairs.",
              "/events",
            ],
          ]
        : [
            [
              "Find work that fits your profile",
              "Review match explanations and ask PESO to facilitate a referral.",
              "/matches",
            ],
            [
              "Build skills for your next opportunity",
              "Explore training and request enrollment with a provider.",
              "/training",
            ],
            [
              "Keep your employment status current",
              "Report changes so PESO can provide useful follow-up support.",
              "/outcomes",
            ],
          ]
  return (
    <>
      <div data-tour="overview-heading">
        <Heading
          title={
            staff
              ? "Employment services, connected."
              : `Welcome, ${user.first_name || user.name.split(" ")[0]}.`
          }
          description={
            staff
              ? "A service desk for registration, referrals, upskilling, placement, and continued employment support."
              : partner
                ? "Coordinate with PESO and keep your organization’s service records up to date."
                : "Your employment journey continues here. Choose the next step that works for you."
          }
          action={
            <div className="flex flex-wrap gap-3">
              {user.role === "jobseeker" && (
                <Link
                  to="/profile"
                  data-tour="profile-entry"
                  className={secondaryStyle}
                >
                  My profile & résumé
                </Link>
              )}
              <button
                type="button"
                data-tour-launcher
                className={secondaryStyle}
                onClick={() =>
                  window.dispatchEvent(new Event("peso:open-tour"))
                }
              >
                Replay workspace tutorial
              </button>
            </div>
          }
        />
      </div>
      <div className="overview-banner mb-8 grid overflow-hidden rounded-xl md:grid-cols-[1.4fr_1fr]">
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-tight text-primary">
            {staff
              ? "Turn the next request into the next step."
              : partner
                ? "Better coordination. Clearer progress."
                : "A little support for your next big step."}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {staff
              ? "Keep each referral, training enrollment and placement traceable. Verify outcomes and help jobseekers who need another pathway."
              : partner
                ? "Use your dedicated workspace to manage records. PESO reviews catalog publication and confirms employment placements."
                : "Your profile connects vacancies, training, and PESO services. Review your options, build skills, and keep your service records in one place."}
          </p>
          <div className="mt-6" data-tour="overview-primary-action">
            <ActionLink
              to={
                staff
                  ? "/referrals"
                  : partner
                    ? user.role === "employer"
                      ? "/jobs"
                      : "/enrollments"
                    : "/matches"
              }
            >
              {staff
                ? "Open referral queue"
                : partner
                  ? "Open my workspace"
                  : "Explore my matches"}
            </ActionLink>
          </div>
        </div>
        <div className="overview-pathway border-t p-6 sm:p-8 md:border-l md:border-t-0">
          <h3 className="text-sm font-semibold text-primary">
            Your connected pathway
          </h3>
          <button
            type="button"
            className="mobile-pathway-toggle"
            aria-expanded={pathwayOpen}
            aria-controls="overview-pathway"
            onClick={() => setPathwayOpen(!pathwayOpen)}
          >
            {pathwayOpen ? "Hide pathway" : "View employment pathway"}
            <ArrowRight size={17} />
          </button>
          <ol
            id="overview-pathway"
            className={`${
              pathwayOpen ? "pathway-open" : "pathway-collapsed"
            } mt-5 space-y-4 text-sm text-[#4c6054]`}
          >
            {[
              "Registration & profiling",
              "Vacancies, matching & referral",
              "Training enrollment & upskilling",
              "Employment facilitation & placement",
              "Employment outcome monitoring",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-[#b4c2a8] text-xs">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {!partner && (
        <ResourceState resource={r}>
          <div className="overview-stats mb-10 grid grid-cols-2 xl:grid-cols-4">
            {[
              ["Referrals", r.data?.referrals, "/referrals", FileCheck2],
              [
                "Training enrollments",
                r.data?.enrollments,
                "/enrollments",
                BookOpen,
              ],
              [
                "Verified placements",
                r.data?.placements,
                "/placements",
                BriefcaseBusiness,
              ],
              [
                "Open service requests",
                r.data?.services,
                "/services",
                LifeBuoy,
              ],
            ].map(([label, value, to, Icon]) => (
              <Link key={to} to={to} className="bg-card p-5 hover:bg-secondary">
                <div className="flex items-center justify-between gap-3 text-muted-foreground">
                  <span className="text-xs">{label}</span>
                  <Icon size={17} />
                </div>
                <p className="mt-4 text-3xl font-semibold text-primary tabular-nums">
                  {value ?? 0}
                </p>
              </Link>
            ))}
          </div>
        </ResourceState>
      )}
      <div className="grid gap-10 xl:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-5 font-display text-2xl text-primary">
            What would you like to do?
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card px-6">
            {tasks.map(([h, p, to], index) => (
              <Link
                key={to}
                data-tour={`overview-task-${index}`}
                to={to}
                className="group flex items-center gap-5 py-6"
              >
                <div>
                  <h3 className="text-sm font-semibold text-primary">{h}</h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {p}
                  </p>
                </div>
                <ArrowRight className="ml-auto size-5 shrink-0 text-primary transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl text-primary">
              Events & programs
            </h2>
            <Link
              to="/events"
              aria-label="View all events and programs"
              className="text-xs font-semibold text-primary underline"
            >
              View all
            </Link>
          </div>
          <ResourceState resource={events}>
            {events.data?.data
              .filter((e) => e.status === "published")
              .slice(0, 3)
              .map((e) => (
                <article
                  key={e.id}
                  className="mb-3 rounded-lg border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge>{e.type}</Badge>
                    <Sample record={e} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-primary">
                    {e.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {date(e.event_date || e.starts_at)} · {e.location}
                  </p>
                  <div className="mt-3">
                    <Source record={e} />
                  </div>
                </article>
              ))}
            {!events.data?.data.length && (
              <Empty title="No scheduled events yet" />
            )}
          </ResourceState>
        </section>
      </div>
      {!staff && !partner && (
        <div className="mt-8">
          <Notice>
            Matching suggestions support your decisions. PESO officers review
            referrals, training providers confirm enrollment, and employers
            decide hiring.
          </Notice>
        </div>
      )}
    </>
  )
}
