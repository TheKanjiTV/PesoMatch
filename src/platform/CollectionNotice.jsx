import { Link } from "react-router"

export const trainingNoticeVersion = "enrollment-review-2026-10-13-v1"
export const trainingConsentStatement =
  "I have reviewed the requirements and agree to PESO and this training provider reviewing my name and enrollment details for this request."

const notices = {
  profile:
    "Your profile supports employment guidance, matching and PESO review. Share only relevant contact, education, skill and work information. Avoid unrelated identification numbers, bank details or medical records.",
  resume:
    "Uploading a résumé is optional. The PDF, a limited text excerpt and detected information are stored on this server. Review the suggestions before applying them; no résumé is sent to an external AI service. You can remove the document without removing skills you already chose to add.",
  records:
    "Record only information needed for this service. Authorized PESO staff review service details; relevant employers and training providers can review their own referral or enrollment records. Avoid unrelated IDs, medical information, passwords or details about other people.",
  enrollment:
    "PESO and the named provider review your name and enrollment details for eligibility and coordination. Requesting enrollment does not confirm a place. You can withdraw an eligible request.",
  referral:
    "PESO reviews your request and profile for employment facilitation. A relevant employer can review your name and referral details after PESO refers you. Submitting a request does not guarantee a job offer.",
}

export function CollectionNotice({ kind = "profile" }) {
  return (
    <aside
      aria-label="Privacy before you submit"
      className="mb-5 text-sm leading-6 text-muted-foreground"
    >
      <p>
        {notices[kind]}{" "}
        <Link
          className="font-semibold text-primary underline underline-offset-4"
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the privacy notice
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
        .
      </p>
      {kind === "profile" && (
        <>
          <p className="mt-2">
            If you are under 18, ask a parent, guardian or PESO officer to help
            you understand what to share. Program eligibility and guardian
            requirements need operator review.
          </p>
          <p className="mt-2">
            You can manage or delete your account in{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              to="/settings"
            >
              Account Settings
            </Link>
            , even before completing your profile.
          </p>
        </>
      )}
    </aside>
  )
}
