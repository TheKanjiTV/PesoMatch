import { useEffect, useRef, useState } from "react"

import { useLocation, useNavigate } from "react-router"

import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Grid2X2,
  GraduationCap,
  Handshake,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  X,
} from "lucide-react"

import { JourneyLink } from "../common/JourneyLink.jsx"

import { Avatar } from "../common/UI.jsx"

import { ProfileIdentity } from "../common/ProfileIdentity.jsx"

import { NotificationPopover } from "../activity/NotificationPopover.jsx"

import { ChatsPopover } from "../activity/ChatsPopover.jsx"

import { ConversationDock } from "../activity/ConversationDock.jsx"

import { MotionPresence } from "../common/MotionPresence.jsx"

import { GlobalSearch } from "./GlobalSearch.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useAuth } from "../../context/AuthContext.jsx"

import { useFeedback } from "../common/Feedback.jsx"

import { canCreateCompany } from "../../services/businessPermissions.js"

const businessApps = [
  [
    BriefcaseBusiness,

    "Hire on PesoMatch",

    "Explore employer services and vacancy previews.",

    "/business/hire",
  ],

  [
    GraduationCap,

    "Learn with PesoMatch",

    "Find training and skills development opportunities.",

    "/training",
  ],

  [
    Grid2X2,

    "Admin Center",

    "Open the PESO Staff and Admin workspace preview.",

    "/business/admin-center",
  ],
]

export default function Topbar() {
  const {
    profile,
    notifications,
    messages,
    workspacePreferences,
    refreshHome,
  } = useDashboard()

  const labels =
    workspacePreferences.language === "fil"
      ? {
          home: "Home",

          jobs: "Trabaho",

          training: "Pagsasanay",

          assistance: "PESO Assistance",

          profile: "Profile",

          businesses: "Mga Negosyo",
        }
      : {
          home: "Home",

          jobs: "Jobs",

          training: "Training",

          assistance: "PESO Assistance",

          profile: "Profile",

          businesses: "Businesses",
        }

  const { user, logout } = useAuth(),
    { notify } = useFeedback(),
    navigate = useNavigate()

  const { pathname, search } = useLocation()

  const [open, setOpen] = useState(null),
    [mobile, setMobile] = useState(false),
    [leaving, setLeaving] = useState(false)

  const [conversations, setConversations] = useState([]),
    [chatFocusVersion, setChatFocusVersion] = useState(0)

  const root = useRef(null),
    trigger = useRef(null),
    messagesButton = useRef(null)

  useEffect(() => {
    setOpen(null)

    setMobile(false)
  }, [pathname, search])

  useEffect(() => {
    const outside = (e) => {
      if (!root.current?.contains(e.target)) {
        setOpen(null)

        setMobile(false)
      }
    }

    const escape = (e) => {
      if (e.key === "Escape") {
        setOpen(null)

        setMobile(false)

        trigger.current?.focus()
      }
    }

    document.addEventListener("pointerdown", outside)

    document.addEventListener("keydown", escape)

    return () => {
      document.removeEventListener("pointerdown", outside)

      document.removeEventListener("keydown", escape)
    }
  }, [])

  const toggle = (name, event) => {
    trigger.current = event.currentTarget

    setOpen((value) => (value === name ? null : name))
  }
  const homeClick = (event) => {
    if (
      pathname !== "/dashboard" ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    setOpen(null)
    setMobile(false)
    window.scrollTo({ top: 0, behavior: "instant" })
    refreshHome()
  }

  const unread = notifications.filter((n) => !n.read).length

  const unreadMessages = messages.reduce(
    (sum, message) => sum + (message.unread || 0),

    0,
  )

  async function signOut() {
    if (leaving) return

    setLeaving(true)

    try {
      await logout()

      navigate("/login", { replace: true })
    } catch (failure) {
      notify(failure.message, { type: "error" })

      setLeaving(false)
    }
  }

  const navClass =
    "flex min-h-14 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium hover:bg-white/15"

  const popupClass =
    "absolute right-0 top-full z-40 mt-2 rounded-xl border border-border bg-white text-foreground shadow-xl"

  const dropdown = (name, label, Icon, items) => (
    <div
      className="relative"
      key={name}
      data-tour={name === "jobs" ? "jobs-nav" : undefined}
    >
      <button
        className={navClass}
        aria-expanded={open === name}
        aria-controls={`${name}-links`}
        onClick={(e) => toggle(name, e)}
      >
        <Icon size={17} />
        <span>{label}</span>
        <ChevronDown size={12} />
      </button>
      <MotionPresence open={open === name}>
        <nav
          id={`${name}-links`}
          aria-label={`${label} options`}
          className="fixed inset-x-3 top-[116px] z-40 rounded-xl border border-border bg-white p-2 text-foreground shadow-xl lg:absolute lg:inset-x-auto lg:right-0 lg:top-full lg:mt-2 lg:w-56"
        >
          {items.map(([text, to]) => (
            <JourneyLink
              key={to}
              to={to}
              className="flex min-h-11 items-center rounded-md px-3 text-xs hover:bg-muted"
            >
              {text}
            </JourneyLink>
          ))}
        </nav>
      </MotionPresence>
    </div>
  )

  return (
    <header
      ref={root}
      className="sticky top-0 z-30 border-b border-primary/20 bg-primary text-white"
    >
      <div className="workspace-width flex flex-wrap items-center gap-2 px-3 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:max-w-[265px]">
          <JourneyLink
            to="/dashboard"
            aria-label="PesoMatch Home"
            onClick={homeClick}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15"
          >
            <BriefcaseBusiness size={24} />
          </JourneyLink>
          <GlobalSearch onOpen={() => setOpen(null)} />
        </div>
        <button
          className="flex size-11 items-center justify-center rounded-md hover:bg-white/15 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobile}
          onClick={() => {
            setMobile(!mobile)

            setOpen(null)
          }}
        >
          {mobile ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          aria-label="Workspace navigation"
          className={`${
            mobile ? "flex" : "hidden"
          } order-last w-full flex-wrap items-center border-t border-white/20 lg:order-none lg:ml-auto lg:flex lg:w-auto lg:border-0`}
        >
          <JourneyLink
            to="/dashboard"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            onClick={homeClick}
            className={navClass}
          >
            <Home size={17} />
            {labels.home}
          </JourneyLink>
          {dropdown("jobs", labels.jobs, BriefcaseBusiness, [
            ["Recommended Jobs", "/jobs?tab=recommended"],

            ["Browse Jobs", "/jobs?tab=browse"],

            ["Saved Jobs", "/jobs?tab=saved"],

            ["My Skill Analysis", "/jobseeker/skill-analysis"],
          ])}
          {dropdown("training", labels.training, GraduationCap, [
            ["Browse Training", "/training"],

            ["Recommended Training", "/training?tab=recommended"],

            ["Saved Training", "/training?tab=saved"],
          ])}
          <JourneyLink to="/jobseeker/assistance" className={navClass}>
            <Handshake size={17} />
            {labels.assistance}
          </JourneyLink>
        </nav>
        <div data-tour="updates" className="flex items-center gap-1">
          {[
            [MessageSquare, "messages", "Messages", unreadMessages],

            [Bell, "notifications", "Notifications", unread],
          ].map(([Icon, name, label, count]) => (
            <div className="relative" key={name}>
              <button
                ref={name === "messages" ? messagesButton : undefined}
                aria-label={`${label}, ${count} unread`}
                aria-expanded={open === name}
                aria-controls={
                  name === "messages" ? "chats-popover" : "notification-popover"
                }
                onClick={(e) => toggle(name, e)}
                className="relative flex size-10 items-center justify-center rounded-md hover:bg-white/15"
              >
                <Icon size={19} />
                {count > 0 && (
                  <span className="absolute right-0.5 top-0.5 rounded-full bg-white px-1 text-[8px] font-semibold text-primary">
                    {count}
                  </span>
                )}
              </button>
              <MotionPresence open={open === name}>
                {name === "notifications" ? (
                  <NotificationPopover onClose={() => setOpen(null)} />
                ) : (
                  <ChatsPopover
                    onClose={() => setOpen(null)}
                    onOpenConversation={(id) => {
                      setChatFocusVersion((v) => v + 1)
                      setConversations((previous) => [
                        ...previous.filter((item) => item !== id),
                        id,
                      ])
                      setOpen(null)
                    }}
                  />
                )}
              </MotionPresence>
            </div>
          ))}
        </div>
        <div className="relative" data-tour="account">
          <button
            aria-label="Profile options"
            aria-expanded={open === "profile"}
            aria-controls="account-links"
            onClick={(e) => toggle("profile", e)}
            className="flex min-h-14 items-center gap-1 rounded-md px-1 hover:bg-white/15"
          >
            <Avatar name={profile.firstName} />
            <span className="hidden text-[11px] xl:block">
              {labels.profile}
            </span>
            <ChevronDown size={12} />
          </button>
          <MotionPresence open={open === "profile"}>
            <div
              id="account-links"
              className={`${popupClass} w-[290px] max-w-[calc(100vw-24px)] p-3`}
            >
              <ProfileIdentity />
              <h2 className="mt-4 border-t border-border pt-3 text-xs font-semibold">
                Account
              </h2>
              {[
                ["Settings & Privacy", "/jobseeker/settings"],

                ["Help", "/help"],

                [
                  "Language",

                  "/jobseeker/settings?section=account&detail=language",
                ],
              ].map(([label, to]) => (
                <JourneyLink
                  key={label}
                  to={to}
                  className="flex min-h-10 items-center text-xs text-muted-foreground hover:text-primary"
                >
                  {label}
                </JourneyLink>
              ))}
              <button
                disabled={leaving}
                onClick={signOut}
                className="flex min-h-11 w-full items-center gap-2 border-t border-border text-xs"
              >
                <LogOut size={15} />
                {leaving ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </MotionPresence>
        </div>
        <span
          aria-hidden="true"
          className="hidden h-8 border-l border-white/30 sm:block"
        />
        <div className="relative">
          <button
            aria-label="Businesses"
            aria-expanded={open === "business"}
            aria-controls="business-links"
            onClick={(e) => toggle("business", e)}
            className={navClass}
          >
            <Grid2X2 size={19} />
            <span className="hidden sm:inline">{labels.businesses}</span>
            <ChevronDown size={12} />
          </button>
          <MotionPresence open={open === "business"}>
            <div
              id="business-links"
              className={`${popupClass} w-[530px] max-w-[calc(100vw-24px)] p-5`}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <section>
                  <h2 className="mb-4 text-sm font-semibold">My Apps</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {businessApps.map(([Icon, label, , to]) => (
                      <JourneyLink
                        to={to}
                        key={label}
                        className="flex min-h-24 flex-col items-center gap-2 rounded-lg border border-border p-3 text-center text-[11px] hover:bg-muted"
                      >
                        <Icon size={25} className="text-primary" />
                        {label}
                      </JourneyLink>
                    ))}
                  </div>
                </section>
                <section>
                  <h2 className="mb-3 text-sm font-semibold">
                    Explore More for Business
                  </h2>
                  {businessApps.map(([, label, description, to]) => (
                    <JourneyLink
                      to={to}
                      key={label}
                      className="block rounded-lg py-3 hover:bg-muted"
                    >
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        {description}
                      </p>
                    </JourneyLink>
                  ))}
                </section>
              </div>
              {canCreateCompany(user) && (
                <JourneyLink
                  to="/business/company/new"
                  className="mt-4 flex min-h-11 items-center border-t border-border text-sm font-semibold text-primary"
                >
                  Create a Company Page +
                </JourneyLink>
              )}
            </div>
          </MotionPresence>
        </div>
      </div>
      <ConversationDock
        conversations={conversations}
        focusVersion={chatFocusVersion}
        onClose={(id) => {
          setConversations((previous) => previous.filter((item) => item !== id))

          messagesButton.current?.focus({ preventScroll: true })
        }}
      />
    </header>
  )
}
