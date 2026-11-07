import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useParams,
  useLocation,
} from "react-router"

import { RouteScreen } from "./platform/RouteScreen.jsx"
import {
  PageSkeleton,
  WorkspaceShellSkeleton,
} from "./platform/LoadingStates.jsx"
import { usesLogoLoading } from "./platform/loading.js"

import {
  AuthProvider,
  destinationFor,
  useAuth,
} from "./context/AuthContext.jsx"

import { PlatformLayout } from "./platform/Layout.jsx"

import {
  ActionLink,
  LogoLoading,
  Notice,
  secondaryStyle,
} from "./platform/ui.jsx"

import { AppearanceProvider } from "./platform/Appearance.jsx"

import { ConnectionStatus, AppUpdate } from "./platform/AppRuntime.jsx"

import { PageMotion } from "./platform/PageMotion.jsx"

import { RouteMetadata } from "./platform/RouteMetadata.jsx"

import { RouteErrorPage } from "./platform/RouteError.jsx"

function Root() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <PageMotion />
        <RouteMetadata />
        <ConnectionStatus />
        <AppUpdate />
        <RouteScreen />
      </AuthProvider>
    </AppearanceProvider>
  )
}

function Session() {
  const { user, error, refresh } = useAuth()
  const { pathname } = useLocation()
  if (!error && !usesLogoLoading(pathname))
    return <WorkspaceShellSkeleton pathname={pathname} role={user?.role} />

  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10">
      {error ? (
        <>
          <Notice error>{error}</Notice>
          <button
            className={secondaryStyle}
            onClick={() => refresh().catch(() => {})}
          >
            Retry connection
          </button>
        </>
      ) : usesLogoLoading(pathname) ? (
        <LogoLoading fullScreen />
      ) : (
        <PageSkeleton pathname={pathname} role={user?.role} />
      )}
    </main>
  )
}

function RequireAccount({ onboardingFlow = false }) {
  const { user, onboarding, loading, error } = useAuth()

  const { step } = useParams()

  const { pathname } = useLocation()

  if (loading || (!user && error)) return <Session />

  if (!user) return <Navigate to="/login" replace />

  if (onboardingFlow && user.role !== "jobseeker")
    return <Navigate to="/dashboard" replace />

  if (
    !onboardingFlow &&
    user.role === "jobseeker" &&
    !onboarding?.completed &&
    pathname !== "/settings"
  )
    return <Navigate to={destinationFor(onboarding, user)} replace />

  if (
    onboardingFlow &&
    (!/^[1-5]$|^complete$/.test(step || "") ||
      (!onboarding?.completed &&
        (step === "complete" ||
          Number(step) > Number(onboarding?.current_step || 1))))
  )
    return <Navigate to={destinationFor(onboarding, user)} replace />

  return <Outlet />
}

function Gate({ roles, children }) {
  const { user } = useAuth()

  return roles.includes(user.role) ? (
    children
  ) : (
    <div className="space-y-5">
      <Notice error>Your account does not have access to this service.</Notice>
      <ActionLink to="/dashboard">Return to overview</ActionLink>
    </div>
  )
}

function Destination() {
  const { user, onboarding, loading, error } = useAuth()

  if (loading || (!user && error)) return <Session />

  return (
    <Navigate to={user ? destinationFor(onboarding, user) : "/login"} replace />
  )
}

// Coarse feature boundaries: keep path matching/role gates synchronous while

// React Router waits for the selected feature before committing navigation.

function feature(load, name = "default", props = {}, roles) {
  return async () => {
    const Page = (await load())[name]

    return {
      Component: () =>
        roles ? (
          <Gate roles={roles}>
            <Page {...props} />
          </Gate>
        ) : (
          <Page {...props} />
        ),
    }
  }
}

function PageLoading() {
  if (!usesLogoLoading(window.location.pathname))
    return <WorkspaceShellSkeleton pathname={window.location.pathname} />
  return (
    <main className="mx-auto max-w-[1500px] px-6 py-10">
      {usesLogoLoading(window.location.pathname) ? (
        <LogoLoading fullScreen />
      ) : (
        <PageSkeleton pathname={window.location.pathname} />
      )}
    </main>
  )
}

const auth = () => import("./app/auth/AuthPages.jsx")

const catalog = () => import("./platform/Catalog.jsx")

const records = () => import("./platform/Records.jsx")

const operations = () => import("./platform/Operations.jsx")

const account = () => import("./platform/Account.jsx")

const staff = ["peso_staff", "admin"],
  jobstaff = ["jobseeker", ...staff]

const router = createBrowserRouter([
  {
    Component: Root,

    ErrorBoundary: RouteErrorPage,

    HydrateFallback: PageLoading,

    children: [
      ...["/", "/home"].map((path) => ({
        path,

        lazy: feature(() => import("./platform/Landing.jsx")),
      })),

      {
        path: "/app",

        lazy: feature(() => import("./platform/Install.jsx"), "InstallPage"),
      },

      {
        element: <RequireAccount />,

        children: [
          {
            Component: PlatformLayout,

            handle: { workspace: true },

            children: [
              {
                path: "/dashboard",

                lazy: feature(
                  () => import("./platform/Overview.jsx"),

                  "OverviewPage",
                ),
              },

              ...["/jobs", "/jobs/:id"].map((path) => ({
                path,

                lazy: feature(catalog, "CatalogPage"),
              })),

              ...["/training", "/training/:id"].map((path) => ({
                path,

                lazy: feature(catalog, "CatalogPage", { kind: "training" }),
              })),

              {
                path: "/matches",

                lazy: feature(catalog, "MatchesPage", {}, ["jobseeker"]),
              },

              ...[
                "referrals",

                "enrollments",

                "placements",

                "outcomes",

                "services",
              ].map((kind) => ({
                path: "/" + kind,

                lazy: feature(
                  records,

                  "RecordsPage",

                  { kind },

                  kind === "enrollments"
                    ? [...jobstaff, "training_provider"]
                    : ["referrals", "placements"].includes(kind)
                      ? [...jobstaff, "employer"]
                      : jobstaff,
                ),
              })),

              { path: "/events", lazy: feature(operations, "EventsPage") },

              {
                path: "/labor-market",

                lazy: feature(operations, "LaborMarketPage"),
              },

              {
                path: "/jobseekers",

                lazy: feature(operations, "RegistryPage", {}, staff),
              },

              {
                path: "/users",

                lazy: feature(operations, "AccessPage", {}, ["admin"]),
              },

              {
                path: "/audit",

                lazy: feature(operations, "AuditPage", {}, ["admin"]),
              },

              {
                path: "/profile",

                lazy: feature(account, "ProfilePage", {}, ["jobseeker"]),
              },

              { path: "/settings", lazy: feature(account, "AccountPage") },
            ],
          },
        ],
      },

      {
        path: "/jobseeker/onboarding/:step",

        element: <RequireAccount onboardingFlow />,

        children: [
          {
            index: true,

            lazy: feature(
              () => import("./pages/onboarding/OnboardingPage.jsx"),

              "OnboardingPage",
            ),
          },
        ],
      },

      ...[
        "/jobseeker/onboarding",

        "/profile-setup",

        "/welcome",

        "/verified",

        "/staff",

        "/staff/*",

        "/businesses",

        "/businesses/*",
      ].map((path) => ({ path, Component: Destination })),

      {
        path: "/jobseeker/profile",

        element: <Navigate to="/profile" replace />,
      },

      { path: "/jobseeker/*", element: <Navigate to="/dashboard" replace /> },

      ...[
        ["/assistance", "/services"],

        ["/peso-assistance", "/services"],

        ["/skill-analysis", "/matches"],

        ["/settings/*", "/settings"],

        ["/messages", "/services"],

        ["/notifications", "/dashboard"],

        ["/search", "/jobs"],
      ].map(([path, to]) => ({ path, element: <Navigate to={to} replace /> })),

      {
        lazy: feature(auth, "AuthRoutesLayout"),

        children: [
          { path: "/login", lazy: feature(auth, "LoginPage") },

          {
            path: "/staff/login",

            lazy: feature(auth, "LoginPage", { staffPortal: true }),
          },

          { path: "/register", lazy: feature(auth, "RegisterPage") },

          { path: "/help", lazy: feature(auth, "HelpPage") },

          { path: "/verify-email", lazy: feature(auth, "VerificationPage") },

          ...["/forgot-password", "/reset-password", "/password-updated"].map(
            (path) => ({ path, lazy: feature(auth, "ForgotPasswordPage") }),
          ),

          ...["/privacy", "/terms", "/cookies"].map((path) => ({
            path,

            lazy: feature(auth, "LegalPage"),
          })),

          { path: "*", lazy: feature(auth, "NotFoundPage") },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
