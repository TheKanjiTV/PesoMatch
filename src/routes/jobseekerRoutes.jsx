import { Navigate } from "react-router"

import MessagesPage from "../pages/jobseeker/MessagesPage.jsx"

import { useLocation, useParams } from "react-router"

import {
  SkillAnalysisPage,
  MySkillsPage,
} from "../pages/jobseeker/SkillAnalysisPage.jsx"

import AppLayout from "../components/layout/AppLayout.jsx"

import DashboardPage from "../pages/jobseeker/DashboardPage.jsx"

import { AssistanceDetailsPage } from "../pages/jobseeker/AssistanceDetailsPage.jsx"

import { JobsPage, JobDetailsPage } from "../pages/jobseeker/JobsPages.jsx"

import {
  TrainingPage,
  TrainingDetailsPage,
} from "../pages/jobseeker/TrainingPages.jsx"

import {
  AssistancePage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
  SkillsPage,
} from "../pages/jobseeker/WorkspacePages.jsx"

import { EmptyState, Button } from "../components/common/UI.jsx"

function LegacyTrainingRoute() {
  const { id } = useParams()

  const { search } = useLocation()

  return <Navigate replace to={`/training${id ? `/${id}` : ""}${search}`} />
}

export const jobseekerRoutes = {
  Component: AppLayout,

  children: [
    { path: "/dashboard", Component: DashboardPage },

    {
      path: "/search",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/DiscoveryPages.jsx"))
          .SearchPage,
      }),
    },

    {
      path: "/help",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/DiscoveryPages.jsx"))
          .HelpPage,
      }),
    },

    {
      path: "/help/:id",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/DiscoveryPages.jsx"))
          .HelpPage,
      }),
    },

    {
      path: "/feed/:id",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/DiscoveryPages.jsx"))
          .FeedDetailsPage,
      }),
    },

    {
      path: "/business/admin-center",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/BusinessPages.jsx"))
          .AdminCenterPage,
      }),
    },

    {
      path: "/business/hire",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/BusinessPages.jsx"))
          .HirePage,
      }),
    },

    {
      path: "/business/company/new",
      lazy: async () => ({
        Component: (await import("../pages/jobseeker/BusinessPages.jsx"))
          .CompanyPageDraft,
      }),
    },

    { path: "/jobseeker", element: <Navigate to="/dashboard" replace /> },

    {
      path: "/jobseeker/dashboard",

      element: <Navigate to="/dashboard" replace />,
    },

    { path: "/jobs", Component: JobsPage },

    {
      path: "/jobseeker/matches",

      element: <Navigate to="/jobs?tab=recommended" replace />,
    },

    {
      path: "/jobseeker/jobs",

      element: <Navigate to="/jobs?tab=browse" replace />,
    },

    {
      path: "/jobseeker/saved",

      element: <Navigate to="/jobs?tab=saved" replace />,
    },

    { path: "/jobseeker/jobs/:id", Component: JobDetailsPage },

    { path: "/training", Component: TrainingPage },

    { path: "/training/:id", Component: TrainingDetailsPage },

    {
      path: "/jobseeker/jobs/:id/skill-analysis",

      Component: SkillAnalysisPage,
    },

    { path: "/jobseeker/skill-analysis", Component: MySkillsPage },

    { path: "/jobseeker/training", Component: LegacyTrainingRoute },

    { path: "/jobseeker/training/:id", Component: LegacyTrainingRoute },

    {
      path: "/jobseeker/skills",

      element: <Navigate replace to="/jobseeker/skill-analysis" />,
    },

    { path: "/jobseeker/assistance", Component: AssistancePage },

    { path: "/jobseeker/assistance/:id", Component: AssistanceDetailsPage },

    { path: "/jobseeker/notifications", Component: NotificationsPage },

    { path: "/jobseeker/messages", Component: MessagesPage },

    { path: "/jobseeker/profile", Component: ProfilePage },

    { path: "/jobseeker/settings", Component: SettingsPage },

    {
      path: "/jobseeker/*",

      element: (
        <EmptyState
          title="Page not found"
          description="This workspace page isn't available."
          action={<Button to="/dashboard">Back to Dashboard</Button>}
        />
      ),
    },
  ],
}
