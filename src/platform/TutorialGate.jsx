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

  const [run, setRun] = useState(0)

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(`peso-tour:${user.id}`) === "dismissed"
    } catch {
      return false
    }
  })

  const eligible =
    (user.role !== "jobseeker" || onboarding?.completed) &&
    !user.dashboard_tour_completed_at &&
    !dismissed

  useEffect(() => {
    const replay = () => {
      setRequested(true)
      setRun((value) => value + 1)
    }

    window.addEventListener("peso:open-tour", replay)

    return () => window.removeEventListener("peso:open-tour", replay)
  }, [])

  useEffect(() => {
    if (!state?.replayTour) return

    setRequested(true)

    setRun((value) => value + 1)

    navigate(pathname, { replace: true, state: null })
  }, [pathname, state, navigate])

  return eligible || requested ? (
    <Suspense fallback={null}>
      <Tutorial
        key={run}
        requested
        onDismiss={() => {
          setRequested(false)
          setDismissed(true)
        }}
      />
    </Suspense>
  ) : null
}
