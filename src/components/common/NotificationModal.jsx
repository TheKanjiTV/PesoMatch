import { useEffect, useId, useRef, useState } from "react"

import { useNavigate } from "react-router"

import {
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Handshake,
  UserRound,
  X,
} from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

const iconMap = {
  job: BriefcaseBusiness,

  training: GraduationCap,

  profile: UserRound,

  referral: Handshake,
}

export function NotificationModal({ open, onClose }) {
  const { notifications, markRead, replaceNotifications } = useDashboard()

  const navigate = useNavigate()

  const dialogRef = useRef(null)

  const headingId = useId()

  const [previousNotifications, setPreviousNotifications] = useState(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (open) {
      const previousOverflow = document.body.style.overflow

      if (dialog && !dialog.open) dialog.showModal()

      document.body.style.overflow = "hidden"

      return () => {
        if (dialog?.open) dialog.close()

        document.body.style.overflow = previousOverflow
      }
    }

    if (dialog?.open) dialog.close()
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }

    if (open) document.addEventListener("keydown", onKey)

    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const unread = notifications.filter((n) => !n.read).length

  const handleClick = (item) => {
    markRead(item.id)

    onClose()

    if (item.to) navigate(item.to)
  }

  const markAllRead = () => {
    const previous = notifications

    markRead()

    setPreviousNotifications(previous)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-md overflow-hidden rounded-xl border border-border bg-white p-0 text-foreground shadow-xl backdrop:bg-[#111a44]/45"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-[#ffffff] px-5 py-4">
        <h2 id={headingId} className="text-base font-semibold text-foreground">
          Notifications
        </h2>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-secondary"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      {previousNotifications && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary px-5 py-2 text-xs">
          <p role="status">All notifications marked as read.</p>
          <button
            type="button"
            className="min-h-11 font-semibold text-primary underline"
            onClick={() => {
              replaceNotifications(previousNotifications)
              setPreviousNotifications(null)
            }}
          >
            Undo
          </button>
        </div>
      )}
      <div className="max-h-[60vh] overflow-y-auto p-3">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {notifications.map((item) => {
              const Icon = iconMap[item.type] || BriefcaseBusiness

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item)}
                    className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary ${
                      !item.read ? "bg-secondary/50" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-primary">
                          {item.title}
                        </span>
                        {!item.read && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {item.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {item.time}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </dialog>
  )
}
