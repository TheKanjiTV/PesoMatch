import { useDashboard } from "../../context/DashboardContext.jsx"
import { useAuth } from "../../context/AuthContext.jsx"
import { useFeedback } from "./Feedback.jsx"
import { Button } from "./UI.jsx"

export function ProfileIdentity({ actions = true }) {
  const { profile } = useDashboard()
  const { user } = useAuth()
  const { notify } = useFeedback()
  return (
    <div className="min-w-0">
      <p className="break-words text-sm font-semibold">
        {profile.firstName} {profile.lastName}
      </p>
      <p className="mt-1 break-words text-xs leading-5">
        {profile.headline || "Add a headline to introduce yourself"}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{profile.role}</p>
      {actions && (
        <div className="mt-3 flex gap-2">
          <Button
            to="/jobseeker/profile"
            variant="secondary"
            className="flex-1 !px-2 !text-[11px]"
          >
            View Profile
          </Button>
          {!user?.email_verified_at && (
            <Button
              className="flex-1 !px-2 !text-[11px]"
              onClick={() =>
                notify(
                  "Email delivery is not configured yet. No verification email was sent.",
                  { type: "info" },
                )
              }
            >
              Verify Now
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
