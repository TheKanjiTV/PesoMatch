import { useState } from "react"

import { useLocation } from "react-router"

import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  GraduationCap,
  Handshake,
  LayoutGrid,
  MessageSquare,
  Settings,
  Target,
  UserRound,
} from "lucide-react"

import { JourneyLink } from "../common/JourneyLink.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

const jobViews = [
  ["recommended", "Recommended for You", Target],

  ["browse", "Browse All Jobs", BriefcaseBusiness],

  ["saved", "Saved Jobs", Bookmark],
]

export function WorkspaceNavigation({ mobile = false }) {
  const { pathname, search } = useLocation()

  const { notifications, messages } = useDashboard()

  const [expanded, setExpanded] = useState(true)
  const [trainingExpanded, setTrainingExpanded] = useState(true)
  const trainingActive =
    pathname === "/training" || pathname.startsWith("/training/")

  const jobsActive =
    pathname === "/jobs" || pathname.startsWith("/jobseeker/jobs/")

  const requestedTab = new URLSearchParams(search).get("tab")

  const tab = ["recommended", "browse", "saved"].includes(requestedTab)
    ? requestedTab
    : "recommended"

  const id = mobile ? "mobile-job-views" : "sidebar-job-views"

  const style = (active, child = false) =>
    `flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
      child ? "text-sm" : "text-[15px]"
    } ${
      mobile
        ? active
          ? "bg-white/15 font-semibold text-white"
          : "text-white/90 hover:bg-white/10"
        : active
          ? "bg-secondary font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`

  const entries = [
    ["/jobseeker/assistance", "PESO Assistance", Handshake],

    [
      "/jobseeker/notifications",

      "Notifications",

      Bell,

      notifications.filter((item) => !item.read).length,
    ],

    [
      "/jobseeker/messages",

      "Messages",

      MessageSquare,

      messages.filter((item) => !item.read).length,
    ],

    ["/jobseeker/profile", "My Profile", UserRound],

    ["/jobseeker/settings", "Settings", Settings],
  ]

  return (
    <div className="space-y-1">
      <JourneyLink
        to="/dashboard"
        aria-current={pathname === "/dashboard" ? "page" : undefined}
        className={style(pathname === "/dashboard")}
      >
        <LayoutGrid size={20} className="shrink-0" /> Dashboard
      </JourneyLink>
      <div data-tour={mobile ? undefined : "jobs-nav"}>
        <button
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          className={style(jobsActive)}
        >
          <BriefcaseBusiness size={20} className="shrink-0" /> Jobs{" "}
          <ChevronDown
            size={14}
            className={`ml-auto shrink-0 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        {expanded && (
          <div
            id={id}
            className={`ml-3 mt-1 space-y-1 border-l pl-2 ${
              mobile ? "border-white/25" : "border-border"
            }`}
          >
            {jobViews.map(([value, label, Icon]) => (
              <JourneyLink
                key={value}
                to={`/jobs?tab=${value}`}
                aria-current={
                  pathname === "/jobs" && tab === value ? "page" : undefined
                }
                className={style(pathname === "/jobs" && tab === value, true)}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </JourneyLink>
            ))}
          </div>
        )}
      </div>
      <div>
        <button
          aria-label="Training"
          aria-expanded={trainingExpanded}
          aria-controls={`${id}-training`}
          onClick={() => setTrainingExpanded((value) => !value)}
          className={style(trainingActive)}
        >
          <GraduationCap size={20} className="shrink-0" />
          Training
          <ChevronDown
            size={14}
            className={`ml-auto shrink-0 ${
              trainingExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
        {trainingExpanded && (
          <div
            id={`${id}-training`}
            className={`ml-3 mt-1 space-y-1 border-l pl-2 ${
              mobile ? "border-white/25" : "border-border"
            }`}
          >
            {[
              ["recommended", "Recommended for You", Target],
              ["browse", "Browse Training", GraduationCap],
              ["saved", "Saved Training", Bookmark],
            ].map(([value, label, Icon]) => (
              <JourneyLink
                key={value}
                to={`/training?tab=${value}`}
                aria-current={
                  pathname === "/training" && tab === value ? "page" : undefined
                }
                className={style(
                  pathname === "/training" && tab === value,
                  true,
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
              </JourneyLink>
            ))}
          </div>
        )}
      </div>
      {entries.map(([to, label, Icon, count], index) => (
        <JourneyLink
          key={to}
          to={to}
          aria-label={label}
          aria-current={pathname.startsWith(to) ? "page" : undefined}
          className={`${style(pathname.startsWith(to))} ${
            index === 3
              ? `!mt-3 border-t ${
                  mobile ? "border-white/20" : "border-border"
                } !pt-3`
              : ""
          }`}
        >
          <Icon size={20} className="shrink-0" />
          <span>{label}</span>
          {!!count && (
            <span
              aria-hidden="true"
              className={`ml-auto rounded px-1.5 py-0.5 text-xs ${
                mobile ? "bg-white/15" : "bg-secondary text-primary"
              }`}
            >
              {count}
            </span>
          )}
        </JourneyLink>
      ))}
    </div>
  )
}

export function WorkspaceSidebar() {
  return (
    <aside className="hidden lg:block">
      <nav
        aria-label="Workspace navigation"
        className="sticky top-[78px] h-[calc(100dvh-78px)] overflow-y-auto border-r border-border bg-card p-3 pt-5"
      >
        <WorkspaceNavigation />
      </nav>
    </aside>
  )
}
