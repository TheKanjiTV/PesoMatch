import { useEffect, useRef } from "react"

import { Outlet, useLocation } from "react-router"
import { ArrowLeft } from "lucide-react"
import { JourneyLink } from "../common/JourneyLink.jsx"

import { DashboardProvider } from "../../context/DashboardContext.jsx"

import { FeedbackProvider } from "../common/Feedback.jsx"

import GuidedTour from "../common/GuidedTour.jsx"

import Topbar from "./Topbar.jsx"
import { NewNotificationAlert } from "../activity/NewNotificationAlert.jsx"

function Shell() {
  const main = useRef(null),
    { pathname, state } = useLocation()
  const adminCenter = pathname === "/business/admin-center"
  const standalone = adminCenter || pathname.startsWith("/help")

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })

    main.current?.focus({ preventScroll: true })

    document.title = "PesoMatch | Jobseeker Workspace"
  }, [pathname])

  return (
    <div className="workspace-readable min-h-dvh bg-background text-foreground">
      <a
        href="#workspace-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-3 text-white focus:translate-y-0"
      >
        Skip to dashboard content
      </a>
      {!standalone && <Topbar />}
      <NewNotificationAlert />
      <div className={adminCenter ? "w-full" : "workspace-width px-3 sm:px-5"}>
        <main
          id="workspace-main"
          style={{ viewTransitionName: "workspace" }}
          tabIndex={-1}
          ref={main}
          className={`min-w-0 outline-none ${
            adminCenter ? "" : "py-5 sm:py-6"
          } ${state?.authTransition ? "auth-flow-enter" : ""}`}
        >
          {standalone && !adminCenter && (
            <JourneyLink
              back
              to="/dashboard"
              className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary"
            >
              <ArrowLeft size={18} />
              Back to the Home
            </JourneyLink>
          )}
          <Outlet />
          <GuidedTour />
        </main>
      </div>
    </div>
  )
}

export default function AppLayout() {
  return (
    <DashboardProvider>
      <FeedbackProvider>
        <Shell />
      </FeedbackProvider>
    </DashboardProvider>
  )
}
