import { useResource } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"
import { TableSkeleton } from "./LoadingStates.jsx"
import { authenticationAction, dateTime, Empty, secondaryStyle } from "./ui.jsx"

export function AccountHistory() {
  const history = useResource("/auth/history", "/api")

  return (
    <section className="mt-8" aria-labelledby="account-history-heading">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="account-history-heading"
            className="text-lg font-semibold text-primary"
          >
            Account history
          </h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Registration, sign-ins, lockouts, password changes, session expiry,
            and access changes for your account, newest first. Times shown in
            Philippine time (UTC+8).
          </p>
          <p className="mt-2 max-w-prose text-xs text-muted-foreground">
            Events are recorded from feature activation. Browser closure is not
            a logout; inactivity expiry is recorded separately when the server
            detects it.
          </p>
        </div>
        <button
          className={secondaryStyle}
          disabled={history.loading}
          onClick={history.reload}
        >
          Refresh history
        </button>
      </div>
      <ResourceState
        resource={history}
        skeleton={<TableSkeleton kind="account-history" columns={4} />}
      >
        {!history.data?.data.length ? (
          <Empty title="No sign-in activity recorded yet">
            Your next login or logout will appear here.
          </Empty>
        ) : (
          <div
            className="overflow-x-auto rounded-lg border border-border bg-card"
            role="region"
            aria-label="Account activity table"
            tabIndex={0}
          >
            <table className="w-full min-w-[680px] text-left text-sm">
              <caption className="sr-only">
                Your authentication activity
              </caption>
              <thead className="bg-secondary text-xs text-primary">
                <tr>
                  {[
                    "Date & time (PHT)",
                    "Activity",
                    "IP address",
                    "Browser / device",
                  ].map((label) => (
                    <th key={label} scope="col" className="p-4">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.data?.data.map((event) => (
                  <tr key={event.id} className="border-t border-border">
                    <td className="whitespace-nowrap p-4 text-xs tabular-nums">
                      <time dateTime={event.created_at}>
                        {dateTime(event.created_at)}
                      </time>
                    </td>
                    <td className="p-4">
                      {authenticationAction(event.action)}
                      {event.reason === "account_switched" && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Switched account
                        </span>
                      )}
                      {event.reason && event.reason !== "account_switched" && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {event.reason.replaceAll("_", " ")}
                        </span>
                      )}
                      {event.method === "remember_cookie" && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Remembered sign-in
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs tabular-nums">
                      {event.ip_address || "Unavailable"}
                    </td>
                    <td className="max-w-sm break-words p-4 text-xs">
                      {event.user_agent || "Unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ResourceState>
    </section>
  )
}
