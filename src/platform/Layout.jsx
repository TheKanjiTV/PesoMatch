import { useEffect, useRef, useState } from "react"

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router"

import {
  PageSkeleton,
  SidebarSkeleton,
  MobileNavigationSkeleton,
  WorkspaceHeaderSkeleton,
  WorkspaceBrandSkeleton,
} from "./LoadingStates.jsx"

import {
  WorkspaceLoadingProvider,
  useWorkspaceLoading,
} from "./WorkspaceLoading.jsx"

import { usesLogoLoading } from "./loading.js"

import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Route,
  Settings2,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"

import { useAuth } from "../context/AuthContext.jsx"

import { Brand, Notice, roles, staffRole, title } from "./ui.jsx"

import { AppearanceControls } from "./Appearance.jsx"

import { TutorialGate } from "./TutorialGate.jsx"

import { InstallButton } from "./AppRuntime.jsx"

const nav = [
  ["Overview", "/dashboard", LayoutDashboard],

  ["Jobseeker registry", "/jobseekers", UsersRound, ["peso_staff", "admin"]],

  ["Vacancy Management", "/jobs", BriefcaseBusiness],

  ["Job Matching", "/matches", Route, ["jobseeker"]],

  [
    "Referrals",

    "/referrals",

    FileCheck2,

    ["jobseeker", "peso_staff", "admin", "employer"],
  ],

  ["Training & Skills Development", "/training", GraduationCap],

  [
    "Training Enrollment",

    "/enrollments",

    BookOpen,

    ["jobseeker", "peso_staff", "admin", "training_provider"],
  ],

  [
    "Employment Placement",

    "/placements",

    ClipboardList,

    ["jobseeker", "peso_staff", "admin", "employer"],
  ],

  [
    "Employment Outcomes",

    "/outcomes",

    TrendingUp,

    ["jobseeker", "peso_staff", "admin"],
  ],

  [
    "PESO Services",

    "/services",

    LifeBuoy,

    ["jobseeker", "peso_staff", "admin"],
  ],

  ["Events & Programs", "/events", CalendarDays],

  ["Labor Market Information", "/labor-market", TrendingUp],

  ["Account Access", "/users", UsersRound, ["admin"]],

  ["Audit Records", "/audit", ShieldCheck, ["admin"]],
]

// CSS visibility transitions may still be hidden in the first animation frame.

// Keep focus synchronized with the existing motion and cancel on navigation.

function focusAfterLayout(resolveTarget) {
  let frame,
    attempts = 0

  const focus = () => {
    const target = resolveTarget()

    if (
      target?.isConnected &&
      target.getClientRects().length &&
      getComputedStyle(target).visibility === "visible" &&
      !target.closest("[inert]")
    ) {
      target.focus({ preventScroll: true })

      if (document.activeElement === target) return
    }

    if (++attempts < 30) frame = requestAnimationFrame(focus)
  }

  frame = requestAnimationFrame(focus)

  return () => cancelAnimationFrame(frame)
}

export function PlatformLayout() {
  const { user } = useAuth()
  const navigation = useNavigation()

  return (
    <WorkspaceLoadingProvider
      key={`${user.id}:${user.role}`}
      routePending={navigation.state !== "idle"}
    >
      <WorkspaceFrame />
    </WorkspaceLoadingProvider>
  )
}

function WorkspaceFrame() {
  const navigation = useNavigation()

  const workspaceLoading = useWorkspaceLoading()

  const shellLoading = workspaceLoading.initialLoading

  const { user, logout, sessionNotice } = useAuth()

  const [open, setOpen] = useState(false),
    [error, setError] = useState("")

  const location = useLocation(),
    navigate = useNavigate()

  const drawerRef = useRef(null)

  const [mobile, setMobile] = useState(
    () => matchMedia("(max-width: 1023px)").matches,
  )

  const triggerRef = useRef(null)

  const modalOpen = open && mobile

  function toggleNavigation(event) {
    if (!open) triggerRef.current = event.currentTarget

    setOpen(!open)
  }

  useEffect(() => {
    const query = matchMedia("(max-width: 1023px)")

    const resize = () => {
      setMobile(query.matches)

      setOpen(false)
    }

    query.addEventListener("change", resize)

    return () => query.removeEventListener("change", resize)
  }, [])

  useEffect(() => {
    const cancelFocusMain = open
      ? focusAfterLayout(() => {
          const main = document.querySelector("#workspace-main")

          if (main) {
            main.tabIndex = -1
          }

          return main
        })
      : null

    setOpen(false)

    window.scrollTo(0, 0)

    const pathname = location.pathname

    const pageTitle =
      nav.find((n) => n[1] === pathname)?.[0] ||
      (pathname.startsWith("/jobs/")
        ? "Vacancy details"
        : pathname.startsWith("/training/")
          ? "Training program details"
          : pathname === "/profile"
            ? "My Jobseeker Profile"
            : "Account Settings")

    document.title = `${pageTitle} | PESO Employment Services`

    return () => {
      cancelFocusMain?.()
    }
  }, [location.pathname])

  useEffect(() => {
    if (!modalOpen) return

    const openedPath = window.location.pathname

    const focusable = () =>
      [
        ...drawerRef.current.querySelectorAll("a[href], button:not(:disabled)"),
      ].filter((element) => element.getClientRects().length)

    // The opener becomes inert in this commit. Focus after the click's default

    // action and the drawer's visibility transition have been applied.

    const cancelFocus = focusAfterLayout(() => focusable()[0])

    const close = (e) => {
      if (e.key === "Escape") {
        setOpen(false)

        e.preventDefault()
      }

      if (e.key === "Tab") {
        const elements = focusable(),
          first = elements[0],
          last = elements.at(-1)

        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !drawerRef.current.contains(document.activeElement))
        ) {
          e.preventDefault()

          last?.focus()
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !drawerRef.current.contains(document.activeElement))
        ) {
          e.preventDefault()

          first?.focus()
        }
      }
    }

    document.addEventListener("keydown", close)

    const previousOverflow = document.body.style.overflow

    if (matchMedia("(max-width: 1023px)").matches)
      document.body.style.overflow = "hidden"

    return () => {
      cancelFocus()

      document.removeEventListener("keydown", close)

      document.body.style.overflow = previousOverflow

      if (
        window.location.pathname === openedPath &&
        triggerRef.current?.isConnected
      )
        triggerRef.current.focus({ preventScroll: true })
    }
  }, [modalOpen])

  async function signOut() {
    try {
      await logout()

      navigate("/login")
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="platform-shell min-h-dvh bg-background">
      <TutorialGate key={`${user.id}:${user.role}`} />
      <a
        href="#workspace-main"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded bg-primary px-5 py-3 text-white focus:translate-y-0"
      >
        Skip to workspace
      </a>
      <header className="mobile-app-header grid min-h-20 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-border bg-card px-4 lg:hidden">
        <span inert={modalOpen} className="col-start-2">
          {shellLoading ? (
            <WorkspaceBrandSkeleton />
          ) : (
            <Brand to="/dashboard" />
          )}
        </span>
        <button
          onClick={toggleNavigation}
          aria-expanded={open}
          aria-controls="service-drawer"
          aria-label="Toggle service navigation"
          className="min-h-11 justify-self-end px-2 sm:px-3"
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="drawer-backdrop fixed inset-0 top-20 z-20 bg-black/25 lg:hidden"
        />
      )}
      <aside
        id="service-drawer"
        ref={drawerRef}
        role={modalOpen ? "dialog" : undefined}
        aria-modal={modalOpen || undefined}
        aria-label={modalOpen ? "All employment services" : undefined}
        className={`${
          open ? "drawer-open" : "drawer-closed"
        } workspace-sidebar fixed inset-y-0 left-0 z-30 flex w-[272px] flex-col border-r border-border lg:flex max-lg:top-20`}
      >
        {shellLoading ? (
          <>
            <div className="flex justify-end px-3 pt-3 lg:hidden">
              <button
                aria-label="Close service navigation"
                onClick={() => setOpen(false)}
                className="grid min-h-11 min-w-11 place-items-center"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarSkeleton
              items={
                nav.filter((n) => !n[3] || n[3].includes(user.role)).length
              }
              role={user.role}
            />
          </>
        ) : (
          <>
            <div className="hidden px-7 py-8 lg:block">
              <Brand to="/dashboard" />
            </div>
            <div className="flex justify-end px-3 pt-3 lg:hidden">
              <button
                aria-label="Close service navigation"
                onClick={() => setOpen(false)}
                className={"min-h-11 min-w-11 grid place-items-center"}
              >
                <X size={20} />
              </button>
            </div>
            <nav
              aria-label="Employment services"
              className="flex-1 overflow-y-auto px-3 py-4"
            >
              {nav

                .filter((n) => !n[3] || n[3].includes(user.role))

                .map(([label, to, Icon]) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `sidebar-link mb-1 flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${
                        isActive ? "sidebar-active" : "sidebar-idle"
                      }`
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {label}
                  </NavLink>
                ))}
            </nav>
            <div className="border-t border-border p-4">
              {user.role === "jobseeker" && (
                <NavLink
                  to="/profile"
                  className="flex min-h-11 items-center gap-3 px-3 text-sm"
                >
                  <UserRound size={17} />
                  My profile
                </NavLink>
              )}
              <NavLink
                to="/settings"
                className="flex min-h-11 items-center gap-3 px-3 text-sm"
              >
                <Settings2 size={17} />
                Account settings
              </NavLink>
              <button
                onClick={signOut}
                className="flex min-h-11 w-full items-center gap-3 px-3 text-sm"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </>
        )}
      </aside>
      <div inert={modalOpen} className="lg:pl-[272px]">
        {shellLoading ? (
          <WorkspaceHeaderSkeleton />
        ) : (
          <div className="workspace-topbar flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 sm:px-9">
            <div className="workspace-identity flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <UserRound size={19} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {roles[user.role]}
                </p>
              </div>
            </div>
            <div className="workspace-actions flex flex-wrap items-center gap-3">
              <AppearanceControls />
              <InstallButton compact />
              <Link
                to="/?public=1"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary"
              >
                Public home
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        )}
        <main
          id="workspace-main"
          className="mx-auto max-w-[1500px] px-5 py-8 sm:px-9 lg:py-10"
        >
          {error && <Notice error>{error}</Notice>}
          {navigation.state === "loading" &&
          !usesLogoLoading(navigation.location?.pathname) ? (
            <PageSkeleton
              pathname={navigation.location?.pathname}
              role={user.role}
            />
          ) : (
            <>
              {sessionNotice && (
                <div className="mb-5">
                  <Notice>{sessionNotice}</Notice>
                </div>
              )}
              <div key={`${user.id}:${user.role}`}>
                <Outlet />
              </div>
            </>
          )}
        </main>
        <footer className="mx-5 mt-10 border-t border-border py-6 text-[11px] leading-5 text-muted-foreground sm:mx-9">
          <p className="max-w-2xl">{title}</p>
          <p className="mt-1">
            PESO supports your journey. Providers confirm enrollment. Employers
            make hiring decisions.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <span>© {new Date().getFullYear()} PesoMatch</span>
            {[
              ["Privacy", "/privacy"],

              ["Terms", "/terms"],

              ["Cookies", "/cookies"],

              ["Official help", "/help"],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="underline underline-offset-4">
                {label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
      <nav
        inert={modalOpen}
        aria-label="Mobile app navigation"
        className="app-bottom-nav lg:hidden"
      >
        {shellLoading ? (
          <MobileNavigationSkeleton />
        ) : (
          <>
            {[
              ["Home", "/dashboard", LayoutDashboard],

              [
                user.role === "training_provider" ? "Programs" : "Jobs",

                user.role === "training_provider" ? "/training" : "/jobs",

                BriefcaseBusiness,
              ],

              ...(user.role === "jobseeker"
                ? [["Job Matching", "/matches", Route]]
                : []),

              [
                user.role === "employer" ? "Referrals" : "Training",

                user.role === "employer" ? "/referrals" : "/training",

                GraduationCap,
              ],

              ...(user.role === "jobseeker"
                ? []
                : [["Account", "/settings", UserRound]]),
            ].map(([label, to, Icon]) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  ["app-tab", isActive && "app-tab-active", to === "/matches" && "app-tab-matching"]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {to === "/matches" ? (
                  <span className="app-tab-matching-icon">
                    <Icon size={25} aria-hidden="true" />
                  </span>
                ) : (
                  <Icon size={21} aria-hidden="true" />
                )}
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              className="app-tab"
              aria-label="Open all services"
              aria-expanded={open}
              aria-controls="service-drawer"
              onClick={toggleNavigation}
            >
              <Menu size={21} />
              <span>Services</span>
            </button>
          </>
        )}
      </nav>
    </div>
  )
}
