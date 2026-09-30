import { RouterProvider, createBrowserRouter } from "react-router"
import {
  DemoProvider,
  LoginPage,
  RegisterPage,
  VerificationPage,
  VerifiedPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  PasswordUpdatedPage,
  WelcomePage,
  ProfileSetupPage,
  DashboardPage,
  LegalPage,
  NotFoundPage,
} from "./auth/AuthPages"

function PageLoading() {
  return <div role="status" className="flex min-h-dvh items-center justify-center bg-background text-sm font-medium text-primary">Loading ScholarMatch...</div>
}

const router = createBrowserRouter([
  {
    path: "/home",
    HydrateFallback: PageLoading,
    lazy: async () => ({ Component: (await import("./LandingPage")).default }),
  },
  {
    Component: DemoProvider,
    children: [
      { path: "/", Component: LoginPage },
      { path: "/login", Component: LoginPage },
      { path: "/register", Component: RegisterPage },
      { path: "/verify-email", Component: VerificationPage },
      { path: "/verified", Component: VerifiedPage },
      { path: "/forgot-password", Component: ForgotPasswordPage },
      { path: "/reset-password", Component: ResetPasswordPage },
      { path: "/password-updated", Component: PasswordUpdatedPage },
      { path: "/welcome", Component: WelcomePage },
      { path: "/profile-setup", Component: ProfileSetupPage },
      { path: "/dashboard", Component: DashboardPage },
      { path: "/privacy", Component: LegalPage },
      { path: "/terms", Component: LegalPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
