import { useState } from "react"
import {
  BriefcaseBusiness,
  GraduationCap,
  Handshake,
  UserRound,
} from "lucide-react"
import { ActivityPanel, ActivityTabs } from "./ActivityPanel.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useFeedback } from "../common/Feedback.jsx"

const icons = {
  job: BriefcaseBusiness,
  training: GraduationCap,
  referral: Handshake,
  profile: UserRound,
}

export function NotificationPopover({ onClose }) {
  const { notifications, markRead, replaceNotifications } = useDashboard()
  const { notify } = useFeedback()
  const [filter, setFilter] = useState("all")
  const visible = notifications.filter((item) => filter === "all" || !item.read)
  return (
    <ActivityPanel
      id="notification-popover"
      title="Notifications"
      onClose={onClose}
      footer={
        <JourneyLink
          to="/jobseeker/notifications"
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
          onClick={onClose}
        >
          See all notifications
        </JourneyLink>
      }
    >
      <ActivityTabs value={filter} onChange={setFilter} />
      {notifications.some((item) => !item.read) && (
        <button
          className="mb-2 min-h-11 px-2 text-xs font-medium text-primary hover:underline"
          onClick={() => {
            const previous = notifications
            markRead()
            notify("Notifications marked as read.", {
              undo: () => replaceNotifications(previous),
            })
          }}
        >
          Mark all read
        </button>
      )}
      {!visible.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {filter === "unread"
            ? "You're all caught up."
            : "No notifications yet."}
        </p>
      )}
      {["New", "Earlier"].map((group) => {
        const entries = visible.filter(
          (item) =>
            (/hour|minute|just now/i.test(item.time) ? "New" : "Earlier") ===
            group,
        )
        return (
          entries.length > 0 && (
            <div key={group} className="mb-3">
              <h3 className="px-2 py-2 text-sm font-semibold">{group}</h3>
              <ul className="space-y-1">
                {entries.map((item) => {
                  const Icon = icons[item.type] || BriefcaseBusiness
                  return (
                    <li key={item.id}>
                      <JourneyLink
                        to={item.to || "/jobseeker/notifications"}
                        onClick={() => {
                          markRead(item.id)
                          onClose()
                        }}
                        className={`flex items-start gap-3 rounded-lg p-3 hover:bg-secondary ${
                          !item.read ? "bg-secondary/40" : ""
                        }`}
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                          <Icon size={21} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-xs text-primary">
                            {item.time}
                          </span>
                        </span>
                        {!item.read && (
                          <span className="mt-3 size-2 shrink-0 rounded-full bg-primary">
                            <span className="sr-only">Unread</span>
                          </span>
                        )}
                      </JourneyLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        )
      })}
    </ActivityPanel>
  )
}
