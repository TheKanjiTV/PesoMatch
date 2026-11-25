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

import { OverviewSkeleton, StatsSkeleton } from "./LoadingStates.jsx"

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

  const r = useResource("/summary")

  const partner = ["employer", "training_provider"].includes(user.role)
  const employer = user.role === "employer"

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

            "Accept candidates for review, arrange interviews, and record offers or declines.",

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
          ]
        : [
            [
              "Find work that fits your profile",

              "Review match explanations and ask PESO to facilitate a referral.",

              "/jobs",
            ],

            [
              "Build skills for your next opportunity",

              "Explore training and request enrollment with a provider.",

              "/training",
            ],
          ]

  if (r.loading) return <OverviewSkeleton role={user.role} />

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
              ? ""
              : partner
                ? "Coordinate with PESO and keep your organization’s service records up to date."
                : ""
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
              {user.role === "admin" && (
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
              )}
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
              ? "Keep each referral, training enrollment and placement traceable. Follow interviews and help jobseekers who need another pathway."
              : employer
                ? "Create, edit and delete your own vacancies. PESO reviews submissions for publication and verifies employment starts."
                : partner
                  ? "Manage your training programs and learner progress. PESO reviews catalog publication."
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
                    : "/jobs"
              }
            >
              {staff
                ? "Open referral queue"
                : employer
                  ? "Open my vacancies"
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
      {user.role !== "training_provider" && (
        <ResourceState
          resource={r}
          skeleton={<StatsSkeleton employer={employer} />}
        >
          <div
            className={`overview-stats mb-10 grid ${
              employer
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-2 xl:grid-cols-4"
            }`}
          >
            {(employer
              ? [
                  [
                    "My vacancies",
                    r.data?.vacancies,
                    "/jobs",
                    BriefcaseBusiness,
                  ],
                  [
                    "Referred candidates",
                    r.data?.referrals,
                    "/referrals",
                    FileCheck2,
                  ],
                  [
                    "Verified placements",
                    r.data?.placements,
                    "/placements",
                    BookOpen,
                  ],
                ]
              : [
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
                ]
            ).map(([label, value, to, Icon]) => (
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
      <div className="grid gap-10">
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
      </div>
    </>
  )
}
