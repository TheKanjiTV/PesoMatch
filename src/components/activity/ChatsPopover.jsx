import { useState } from "react"
import { Search } from "lucide-react"
import { ActivityPanel, ActivityTabs } from "./ActivityPanel.jsx"
import { Avatar } from "../common/UI.jsx"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"

export function ChatsPopover({ onClose, onOpenConversation }) {
  const { messages } = useDashboard()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const visible = messages.filter(
    (item) =>
      (filter === "all" || !item.read) &&
      `${item.sender} ${item.subject} ${item.messages.at(-1)?.text || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  return (
    <ActivityPanel
      id="chats-popover"
      title="Chats"
      onClose={onClose}
      footer={
        <JourneyLink
          to="/jobseeker/messages"
          onClick={onClose}
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
        >
          See all messages
        </JourneyLink>
      }
    >
      <label className="relative my-3 block">
        <span className="sr-only">Search conversations</span>
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="h-11 w-full rounded-full border border-border bg-muted pl-10 pr-3 text-sm"
        />
      </label>
      <ActivityTabs value={filter} onChange={setFilter} />
      <ul className="space-y-1">
        {visible.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onOpenConversation(item.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-secondary"
              aria-label={`Open conversation with ${item.sender}`}
            >
              <Avatar name={item.sender.replace(/^Sample /, "")} />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${
                    !item.read ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.sender}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.messages.at(-1)?.outgoing ? "You: " : ""}
                  {item.messages.at(-1)?.text || item.subject}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {item.time}
                </span>
              </span>
              {!item.read && (
                <span className="size-2 shrink-0 rounded-full bg-primary">
                  <span className="sr-only">Unread</span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!visible.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {query
            ? "No conversations found."
            : filter === "unread"
              ? "No unread conversations."
              : "No conversations yet."}
        </p>
      )}
    </ActivityPanel>
  )
}
