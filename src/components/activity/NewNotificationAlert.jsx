import { useEffect, useRef, useState } from "react"
import { Bell, X } from "lucide-react"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { MotionPresence } from "../common/MotionPresence.jsx"
export function NewNotificationAlert() {
  const { notifications, workspacePreferences } = useDashboard()
  const seen = useRef(null),
    [notice, setNotice] = useState(null),
    [open, setOpen] = useState(false)
  useEffect(() => {
    const ids = new Set(notifications.map((item) => item.id))
    if (seen.current) {
      const added = notifications.find((item) => !seen.current.has(item.id))
      const key =
        added?.type === "job"
          ? "jobUpdates"
          : added?.type === "training"
            ? "trainingUpdates"
            : "referralUpdates"
      if (added && workspacePreferences[key] !== false) {
        setNotice(added)
        setOpen(true)
      }
    }
    seen.current = ids
  }, [notifications, workspacePreferences])
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setOpen(false), 8000)
    return () => clearTimeout(timer)
  }, [open, notice])
  return (
    <MotionPresence open={open} motion="notice">
      {notice && (
        <aside
          aria-label="New notification"
          className="fixed bottom-5 left-4 z-40 flex w-[320px] max-w-[calc(100vw-32px)] items-start gap-3 rounded-xl border border-border bg-white p-4 text-foreground shadow-xl"
        >
          <Bell size={21} className="mt-1 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground">
              New notification
            </p>
            <JourneyLink
              to={notice.to || "/jobseeker/notifications"}
              onClick={() => setOpen(false)}
              className="mt-1 block text-xs font-semibold leading-6"
            >
              {notice.title}
            </JourneyLink>
            <p
              role="status"
              className="mt-1 text-[11px] leading-5 text-muted-foreground"
            >
              {notice.message || notice.description}
            </p>
          </div>
          <button
            aria-label="Dismiss new notification"
            onClick={() => setOpen(false)}
            className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-muted"
          >
            <X size={16} />
          </button>
        </aside>
      )}
    </MotionPresence>
  )
}
