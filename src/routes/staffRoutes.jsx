import { Navigate } from "react-router"
const layout = () =>
  import("../components/staff/StaffAppLayout.jsx").then((module) => ({
    Component: module.default,
  }))
export const staffRoutes = {
  path: "/peso",
  lazy: layout,
  children: [
    { index: true, element: <Navigate to="/peso/dashboard" replace /> },
    {
      path: "dashboard",
      lazy: () =>
        import("../pages/staff/StaffDashboard.jsx").then((m) => ({
          Component: m.default,
        })),
    },
    ...["assistance", "referrals", "coordination", "outcomes"].map((path) => ({
      path,
      lazy: () =>
        import("../pages/staff/AssistanceQueuePage.jsx").then((m) => ({
          Component: m.default,
        })),
    })),
    {
      path: "assistance/:id",
      lazy: () =>
        import("../pages/staff/AssistanceStaffDetailPage.jsx").then((m) => ({
          Component: m.default,
        })),
    },
    {
      path: "assistance/:id/public",
      lazy: () =>
        import("../pages/staff/AssistanceStaffDetailPage.jsx").then((m) => ({
          Component: m.PublicAssistancePreview,
        })),
    },
    {
      path: "jobseekers",
      lazy: () =>
        import("../pages/staff/StaffJobseekersPage.jsx").then((m) => ({
          Component: m.default,
        })),
    },
    {
      path: "jobseekers/:id",
      lazy: () =>
        import("../pages/staff/StaffJobseekersPage.jsx").then((m) => ({
          Component: m.StaffJobseekerDetails,
        })),
    },
    ...[
      "training",
      "training/:id",
      "employers",
      "vacancies",
      "vacancies/:id",
    ].map((path) => ({
      path,
      lazy: () =>
        import("../pages/staff/StaffCatalogPage.jsx").then((m) => ({
          Component: m.default,
        })),
    })),
    {
      path: "reports",
      lazy: () =>
        import("../pages/staff/StaffReportsPage.jsx").then((m) => ({
          Component: m.default,
        })),
    },
    {
      path: "notifications",
      lazy: () =>
        import("../pages/staff/StaffUtilityPages.jsx").then((m) => ({
          Component: m.StaffNotificationsPage,
        })),
    },
    {
      path: "profile",
      lazy: () =>
        import("../pages/staff/StaffUtilityPages.jsx").then((m) => ({
          Component: m.StaffProfilePage,
        })),
    },
    {
      path: "admin/audit-log",
      lazy: () =>
        import("../pages/staff/StaffAuditPage.jsx").then((m) => ({
          Component: m.default,
        })),
    },
    ...["admin/staff", "admin/settings", "admin/reference-data"].map(
      (path) => ({
        path,
        lazy: () =>
          import("../pages/staff/StaffAdminPages.jsx").then((m) => ({
            Component: m.default,
          })),
      }),
    ),
    { path: "*", element: <Navigate to="/peso/dashboard" replace /> },
  ],
}
