import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { Check, CircleAlert, Handshake } from "lucide-react"
import { Button, Field, Modal, Skeleton, panel } from "../common/UI.jsx"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useFeedback } from "../common/Feedback.jsx"
import {
  getAssistanceForJob,
  getProfileReadiness,
  assistancePath,
} from "../../services/assistanceService.js"
import { AssistanceStatusBadge } from "./AssistanceComponents.jsx"

export function ProfileReadinessCheck({ onNavigate }) {
  const { serverProfile, profileLoading, profileError, reloadProfile } =
    useDashboard()
  if (profileLoading)
    return <Skeleton label="Checking profile readiness" kind="profile" />
  if (profileError || !serverProfile)
    return (
      <div className="rounded-lg bg-muted p-4">
        <p className="text-xs leading-6">
          We couldn't check your saved profile. Confirm your details are current
          before requesting assistance.
        </p>
        <Button variant="text" onClick={reloadProfile}>
          Check Again
        </Button>
      </div>
    )
  const readiness = getProfileReadiness(serverProfile)
  return (
    <section>
      <h3 className="text-sm font-semibold">Profile Readiness</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {readiness.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            {item.ready ? (
              <Check size={15} className="shrink-0 text-[#216638]" />
            ) : (
              <CircleAlert size={15} className="shrink-0 text-[#805b12]" />
            )}
            <span>
              {item.label}
              <span className="sr-only">
                {" "}
                / {item.ready ? "Complete" : "Update recommended"}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {readiness.some((item) => !item.ready) && (
        <div className="mt-3">
          <p className="text-xs text-[#805b12]">Profile update recommended.</p>
          <Button
            to="/jobseeker/profile"
            onClick={onNavigate}
            variant="text"
            className="!px-0 text-xs"
          >
            Update Profile
          </Button>
        </div>
      )}
    </section>
  )
}

export function AssistanceRequest({ job, className = "" }) {
  const { requests, submitAssistance, serverProfile, profileLoading } =
    useDashboard()
  const { notify } = useFeedback()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(false),
    [consent, setConsent] = useState(false),
    [notes, setNotes] = useState(""),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [submitted, setSubmitted] = useState(null)
  const busy = useRef(false),
    failedPreview = useRef(false)
  const actionRef = useRef(null),
    successRef = useRef(null)
  useEffect(() => {
    if (submitted) successRef.current?.focus()
  }, [submitted])
  const existing = getAssistanceForJob(job.id, null, requests)
  const contactMissing =
    serverProfile &&
    !getProfileReadiness(serverProfile).find(
      (item) => item.label === "Contact Information",
    ).ready
  const close = () => {
    if (!busy.current) {
      setOpen(false)
      setSubmitted(null)
      requestAnimationFrame(() =>
        actionRef.current?.focus({ preventScroll: true }),
      )
    }
  }
  const send = async (event) => {
    event.preventDefault()
    if (busy.current || !consent || contactMissing || profileLoading) return
    busy.current = true
    setPending(true)
    setError("")
    try {
      // Allow the pending state to paint; a future API replaces the synchronous demo service.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      if (params.get("preview") === "request-error" && !failedPreview.current) {
        failedPreview.current = true
        throw new Error("We couldn't submit your request. Please try again.")
      }
      const result = await submitAssistance(job.id, notes)
      setSubmitted(result.record)
      notify(
        result.created
          ? "Assistance request submitted in this prototype."
          : "An active assistance request already exists for this job.",
        { type: result.created ? "success" : "info" },
      )
    } catch (failure) {
      setError(
        failure.message || "We couldn't submit your request. Please try again.",
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <>
      {existing ? (
        <Button
          ref={actionRef}
          to={assistancePath(existing)}
          className={className}
        >
          <Handshake size={16} />
          View PESO Assistance
        </Button>
      ) : (
        <Button
          ref={actionRef}
          className={className}
          onClick={() => {
            setOpen(true)
            setError("")
            setSubmitted(null)
          }}
        >
          Request PESO Assistance
        </Button>
      )}
      <Modal
        open={open}
        onClose={close}
        title={
          submitted
            ? "Employment assistance requested"
            : "Request PESO Assistance"
        }
      >
        {submitted ? (
          <div ref={successRef} tabIndex={-1} className="outline-none">
            <p role="status" className="text-sm leading-7">
              Your PESO assistance request has been recorded in this prototype.
            </p>
            <p className="mt-4 text-base font-semibold">{submitted.jobTitle}</p>
            <p className="mt-2 break-all text-xs text-muted-foreground">
              Reference: {submitted.reference}
            </p>
            <div className="mt-3">
              <AssistanceStatusBadge status={submitted.status} />
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              You can track the progress of this assistance request from PESO
              Assistance.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button to={assistancePath(submitted)} onClick={close}>
                View Assistance Status
              </Button>
              <Button variant="secondary" onClick={close}>
                Return to Job
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-5">
            <p className="text-sm leading-7">
              Ask PESO for employment assistance related to this opportunity.
            </p>
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-base font-semibold">{job.title}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {job.company}
                <br />
                {job.location}
              </p>
              <p className="mt-2 text-sm font-medium text-primary">
                {job.matchScore}% Match / Sample
              </p>
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              Submitting this request does not guarantee employment. PESO may
              review your profile, provide guidance, and facilitate referral or
              employer coordination where appropriate.
            </p>
            <ProfileReadinessCheck onNavigate={close} />
            <Field
              label="Note for PESO assistance (optional)"
              textarea
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <p className="text-xs leading-6 text-muted-foreground">
              This prototype saves the request in your browser. Nothing is sent
              to a PESO office or employer.
            </p>
            <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              I confirm that my profile and contact information are current.
            </label>
            {contactMissing && (
              <p role="alert" className="text-sm text-[#805b12]">
                Add a valid mobile number to your profile before submitting a
                request.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm leading-6 text-[#a4262c]">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={
                  !consent || pending || profileLoading || contactMissing
                }
              >
                {pending ? "Submitting request..." : "Submit Request"}
              </Button>
              <Button variant="secondary" onClick={close} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
