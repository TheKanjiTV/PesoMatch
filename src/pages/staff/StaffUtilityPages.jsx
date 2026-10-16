import { useState } from "react"
import { useStaff } from "../../context/StaffContext.jsx"
import { roleLabels } from "../../services/staffPermissions.js"
import {
  PageHeading,
  Button,
  Badge,
  EmptyState,
  panel,
} from "../../components/common/UI.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
export function StaffNotificationsPage() {
  const { state, markRead } = useStaff(),
    [unread, setUnread] = useState(false),
    items = state.notifications.filter((item) => !unread || !item.read)
  return (
    <>
      <PageHeading
        title="Staff Notifications"
        description="Sample operational updates from this browser workspace."
        actions={
          <Button variant="secondary" onClick={() => markRead()}>
            Mark All Read
          </Button>
        }
      />
      <div className="mb-5 flex gap-2">
        <Button
          variant={unread ? "secondary" : "primary"}
          aria-pressed={!unread}
          onClick={() => setUnread(false)}
        >
          All
        </Button>
        <Button
          variant={unread ? "primary" : "secondary"}
          aria-pressed={unread}
          onClick={() => setUnread(true)}
        >
          Unread
        </Button>
      </div>
      {items.length ? (
        <ul className={`${panel} divide-y divide-border`}>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div>
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.reference} / {item.read ? "Read" : "Unread"}
                </p>
              </div>
              <Button
                to={`/peso/assistance/${item.reference}`}
                onClick={() => markRead(item.id)}
                variant="secondary"
                className="text-xs"
              >
                View Request
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="You're all caught up"
          description="No unread staff notifications remain."
        />
      )}
    </>
  )
}
export function StaffProfilePage() {
  const { actor, selectActor } = useStaff(),
    { user } = useAuth()
  return (
    <>
      <PageHeading
        title="Staff Profile"
        description="The selected fictional staff identity is separate from your authenticated PesoMatch account."
      />
      <section className={`${panel} max-w-3xl p-6`}>
        <h2 className="text-xl font-semibold">{actor.name}</h2>
        <div className="mt-3">
          <Badge>{roleLabels[actor.role]}</Badge>
        </div>
        <dl className="mt-6 space-y-5 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              Sample staff email
            </dt>
            <dd className="mt-1">{actor.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">PESO office</dt>
            <dd className="mt-1">Sample PESO Bansud</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Authenticated account
            </dt>
            <dd className="mt-1 break-words">{user.email}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Role selection is for this prototype only. It does not create, promote
          or change an actual staff account. Laravel authorization will be
          implemented in a later phase.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => selectActor("")}>
            Change Preview Role
          </Button>
          <Button to="/dashboard" variant="text">
            Return to Jobseeker Workspace
          </Button>
        </div>
      </section>
    </>
  )
}
