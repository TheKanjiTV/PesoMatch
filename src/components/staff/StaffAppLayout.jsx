import { useEffect, useRef, useState } from "react"
import { Navigate, Outlet, useLocation, useNavigate } from "react-router"
import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  Users,
  Handshake,
  Send,
  GraduationCap,
  ChartNoAxesCombined,
  ShieldCheck,
  Settings,
  ListChecks,
  Building2,
  UserRound,
  Menu,
  X,
  LogOut,
  MessagesSquare,
  ClipboardCheck,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext.jsx"
import { StaffProvider, useStaff } from "../../context/StaffContext.jsx"
import { FeedbackProvider, useFeedback } from "../common/Feedback.jsx"
import { Button, panel } from "../common/UI.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { roleLabels } from "../../services/staffPermissions.js"

export const staffNavigation = [
  ["/peso/dashboard", "Dashboard", LayoutDashboard],
  ["/peso/assistance", "Employment Assistance", Handshake],
  ["/peso/jobseekers", "Jobseekers", Users],
  ["/peso/referrals", "Referrals", Send],
  ["/peso/coordination", "Employer Coordination", MessagesSquare],
  ["/peso/outcomes", "Employment Outcomes", ClipboardCheck],
  ["/peso/training", "Training", GraduationCap],
  ["/peso/reports", "Reports", ChartNoAxesCombined],
  ["/peso/notifications", "Notifications", Bell],
  ["/peso/employers", "Employers", Building2, "manage_employers"],
  ["/peso/vacancies", "Vacancies", BriefcaseBusiness, "manage_vacancies"],
  [
    "/peso/admin/reference-data",
    "Skills / Reference Data",
    ListChecks,
    "manage_reference",
  ],
  ["/peso/admin/staff", "Staff Accounts", Users, "manage_staff"],
  ["/peso/admin/audit-log", "Audit Log", ShieldCheck, "view_audit"],
  ["/peso/admin/settings", "System Settings", Settings, "manage_settings"],
  ["/peso/profile", "My Profile", UserRound],
]
function StaffPreviewEntry() {
  const { selectActor } = useStaff()
  const navigate = useNavigate()
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl items-center p-5">
      <section className={`${panel} w-full p-6 sm:p-10`}>
        <p className="flex items-center gap-2 text-xl font-semibold text-primary">
          <BriefcaseBusiness />
          PesoMatch
        </p>
        <h1 className="mt-7 text-3xl font-semibold">PESO workspace preview</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Review fictional jobseekers, prepare referrals and record sample
          employment outcomes. This preview does not grant a staff role to your
          account or contact an employer.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {[
            [
              "staff-maria",
              "PESO Staff",
              "Review requests and coordinate employment support.",
            ],
            [
              "admin-rafael",
              "PESO Admin",
              "Staff workflows plus administrative previews and audit history.",
            ],
          ].map(([id, title, description]) => (
            <div key={id} className="border-t border-border pt-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 min-h-14 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  selectActor(id)
                  navigate("/peso/dashboard", { replace: true })
                }}
              >
                Preview {title}
              </Button>
            </div>
          ))}
        </div>
        <Button to="/dashboard" variant="text" className="mt-6 !px-0">
          Return to Jobseeker Workspace
        </Button>
      </section>
    </main>
  )
}
function StaffShell() {
  const { actor, can, state, selectActor } = useStaff()
  const { logout } = useAuth()
  const { notify } = useFeedback()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const main = useRef(null),
    menuButton = useRef(null)
  const [menu, setMenu] = useState(false),
    [leaving, setLeaving] = useState(false)
  useEffect(() => {
    setMenu(false)
    window.scrollTo({ top: 0, behavior: "instant" })
    main.current?.focus({ preventScroll: true })
    document.title = "PesoMatch | PESO Workspace"
  }, [pathname])
  if (!actor) return <StaffPreviewEntry />
  const navigation = staffNavigation.filter(
    ([, , , permission]) => !permission || can(permission),
  )
  const current =
    [...staffNavigation]
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ||
    "Employment Assistance"
  const signOut = async () => {
    setLeaving(true)
    try {
      await logout()
      selectActor("")
      navigate("/login")
    } catch (error) {
      notify(error.message, { type: "error" })
      setLeaving(false)
    }
  }
  const links = (
    <>
      {navigation.map(([path, label, Icon]) => (
        <JourneyLink
          key={path}
          to={path}
          aria-current={
            pathname === path || pathname.startsWith(path + "/")
              ? "page"
              : undefined
          }
          onClick={() => setMenu(false)}
          className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm leading-5 ${
            pathname === path || pathname.startsWith(path + "/")
              ? "bg-secondary font-semibold text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-primary"
          }`}
        >
          <Icon size={18} className="shrink-0" />
          {label}
        </JourneyLink>
      ))}
      <button
        disabled={leaving}
        onClick={signOut}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary"
      >
        <LogOut size={18} />
        {leaving ? "Logging out..." : "Log Out"}
      </button>
    </>
  )
  return (
    <div className="workspace-readable min-h-dvh bg-background text-foreground">
      <a
        href="#staff-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-primary px-4 py-3 text-white focus:translate-y-0"
      >
        Skip to staff workspace
      </a>
      <header className="sticky top-0 z-40 bg-primary text-white shadow-sm">
        <div className="flex min-h-[78px] items-center justify-between gap-3 px-4 sm:px-6">
          <JourneyLink
            to="/peso/dashboard"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <BriefcaseBusiness size={23} />
            PesoMatch
          </JourneyLink>
          <span className="hidden text-sm text-white/90 lg:block">
            {current}
          </span>
          <div className="flex items-center gap-2">
            <JourneyLink
              to="/peso/notifications"
              aria-label={`Staff notifications, ${state.notifications.filter((n) => !n.read).length} unread`}
              className="flex min-h-11 items-center gap-1 rounded-lg px-2 hover:bg-white/15"
            >
              <Bell size={20} />
              <span className="text-xs">
                {state.notifications.filter((n) => !n.read).length}
              </span>
            </JourneyLink>
            <JourneyLink
              to="/peso/profile"
              className="rounded-lg p-2 text-left hover:bg-white/15"
            >
              <span className="block text-xs font-semibold sm:text-sm">
                {actor.name}
              </span>
              <span className="block text-[11px] text-white/90">
                {roleLabels[actor.role]}
              </span>
            </JourneyLink>
            <button
              ref={menuButton}
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="staff-mobile-nav"
              aria-label={
                menu ? "Close staff navigation" : "Open staff navigation"
              }
              className="flex size-11 items-center justify-center lg:hidden"
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {menu && (
        <nav
          id="staff-mobile-nav"
          aria-label="Staff navigation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenu(false)
              menuButton.current?.focus()
            }
          }}
          className="fixed inset-x-0 top-[78px] z-40 max-h-[calc(100dvh-78px)] overflow-y-auto border-b border-border bg-white p-3 shadow-lg lg:hidden"
        >
          {links}
        </nav>
      )}
      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="sticky top-[78px] hidden h-[calc(100dvh-78px)] overflow-y-auto border-r border-border bg-white p-3 lg:block">
          <nav aria-label="Staff navigation" className="space-y-1">
            {links}
          </nav>
        </aside>
        <main
          ref={main}
          id="staff-main"
          tabIndex={-1}
          style={{ viewTransitionName: "workspace" }}
          className="min-w-0 p-4 outline-none sm:p-6"
        >
          <p className="mb-4 text-xs leading-6 text-muted-foreground">
            Staff workflow prototype / Fictional records. Changes are saved in
            this browser only.
          </p>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
export default function StaffAppLayout() {
  const { user, loading, error, refresh } = useAuth()
  if (loading)
    return (
      <main className="p-8">
        <p role="status">Restoring your session...</p>
      </main>
    )
  if (!user)
    return error ? (
      <main className="p-8">
        <h1 className="text-xl font-semibold">
          Unable to restore your account
        </h1>
        <p role="alert" className="my-4">
          {error}
        </p>
        <Button onClick={() => refresh().catch(() => {})}>Try Again</Button>
      </main>
    ) : (
      <Navigate to="/login" replace />
    )
  return (
    <StaffProvider key={user.id}>
      <FeedbackProvider>
        <StaffShell />
      </FeedbackProvider>
    </StaffProvider>
  )
}
