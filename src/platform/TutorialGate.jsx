import { lazy, Suspense, useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { useLocation, useNavigate } from "react-router"

const Tutorial = lazy(() =>
  import("./Tutorial.jsx").then((m) => ({ default: m.WorkspaceTutorial })),
)

export function TutorialGate() {
  const { user, onboarding } = useAuth()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const [requested, setRequested] = useState(false)
  let eligible =
    pathname === "/dashboard" &&
    (user.role !== "jobseeker" || onboarding?.completed) &&
    !user.dashboard_tour_completed_at
  try {
    eligible &&= sessionStorage.getItem(`peso-tour:${user.id}`) !== "dismissed"
  } catch {}
  useEffect(() => {
    const replay = () =>
      pathname === "/dashboard"
        ? setRequested(true)
        : navigate("/dashboard", { state: { replayTour: true } })
    window.addEventListener("peso:open-tour", replay)
    return () => window.removeEventListener("peso:open-tour", replay)
  }, [pathname, navigate])
  useEffect(() => {
    if (pathname === "/dashboard" && state?.replayTour) {
      setRequested(true)
      navigate("/dashboard", { replace: true, state: null })
    }
  }, [pathname, state, navigate])
  return pathname === "/dashboard" && (eligible || requested) ? (
    <Suspense fallback={null}>
      <Tutorial requested={requested} onDismiss={() => setRequested(false)} />
    </Suspense>
  ) : null
}
