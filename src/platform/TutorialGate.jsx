import { lazy, Suspense, useEffect, useState } from "react"

import { useAuth } from "../context/AuthContext.jsx"

import { useLocation, useNavigate, useNavigation } from "react-router"
import { useWorkspaceLoading } from "./WorkspaceLoading.jsx"

const Tutorial = lazy(() =>
  import("./Tutorial.jsx").then((m) => ({ default: m.WorkspaceTutorial })),
)

export function TutorialGate() {
  const { user, onboarding } = useAuth()

  const { pathname, state } = useLocation()

  const navigate = useNavigate()
  const navigation = useNavigation()
  const workspace = useWorkspaceLoading()
  const [restore, setRestore] = useState(null)

  // This gate survives the dismissed tutorial and destination navigation.
  // Restore focus only after the destination controls have mounted.
  useEffect(() => {
    if (
      !restore ||
      restore.path !== pathname ||
      navigation.state !== "idle" ||
      workspace?.loading
    )
      return
    const frame = requestAnimationFrame(() => {
      const target = restore.opener?.isConnected
        ? restore.opener
        : document.querySelector("[data-tour-launcher]") ||
          document.querySelector("#workspace-main h1")
      if (target?.tagName === "H1") target.tabIndex = -1
      target?.focus({ preventScroll: true })
      setRestore(null)
    })
    return () => cancelAnimationFrame(frame)
  }, [restore, pathname, navigation.state, workspace?.loading])

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
        onDismiss={(focus) => {
          setRestore(focus)
          setRequested(false)
          setDismissed(true)
        }}
      />
    </Suspense>
  ) : null
}
