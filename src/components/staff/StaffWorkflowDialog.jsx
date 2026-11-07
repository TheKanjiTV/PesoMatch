import { useRef, useState } from "react"
import { Button, Field, Modal } from "../common/UI.jsx"
import { useStaff } from "../../context/StaffContext.jsx"
import { useFeedback } from "../common/Feedback.jsx"
import { mockStaff } from "../../data/mockStaff.js"
import { mockJobs } from "../../data/mockJobs.js"
import { mockTrainings } from "../../data/mockTrainings.js"
import { mockJobseekers } from "../../data/mockJobseekers.js"
import { outcomeOptions } from "../../services/staffAssistanceService.js"
export const actionLabels = {
  startReview: "Start Review",
  requestJobseekerUpdate: "Request Information Update",
  createReferral: "Create Referral",
  recordEmployerCoordination: "Record Employer Coordination",
  addFollowUp: "Add Follow-up",
  recordEmployerUpdate: "Record Employer Update",
  recommendTraining: "Recommend Training",
  recordOutcome: "Record Employer Outcome",
  assignStaff: "Reassign Staff",
  closeRequest: "Close / Resolve Request",
}
function Select({ label, options, ...props }) {
  return (
    <Field label={label} {...props}>
      <option value="" disabled hidden>
        Choose an option
      </option>
      {options.map((option) => {
        const [value, text] = Array.isArray(option) ? option : [option, option]
        return (
          <option key={value} value={value}>
            {text}
          </option>
        )
      })}
    </Field>
  )
}
function CoordinationFields({ form, field, followUp }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={followUp ? "Follow-up date" : "Coordination date"}
          type="date"
          required
          {...field("date")}
        />
        <Select
          label={followUp ? "Follow-up type" : "Method"}
          required
          options={["Phone", "Email", "In Person", "Other"]}
          {...field("method")}
        />
      </div>
      {followUp ? (
        <Field
          label="Follow-up result"
          required
          maxLength={1000}
          {...field("result")}
        />
      ) : (
        <>
          <Field
            label="Contact person (optional, sample only)"
            maxLength={100}
            {...field("contactPerson")}
          />
          <Select
            label="Update type"
            required
            options={[
              "Referral acknowledged",
              "Interview requested",
              "Additional information requested",
              "Waiting for employer response",
              "Employer decision received",
            ]}
            {...field("updateType")}
          />
        </>
      )}
      <Field
        label="Next follow-up date (optional)"
        type="date"
        min={form.date}
        {...field("nextFollowUp")}
      />
    </>
  )
}
function OutcomeFields({ form, field, record, closeOnly }) {
  const trainings = mockTrainings.filter((item) =>
    item.jobIds.includes(record.jobId),
  )
  return (
    <>
      <p className="text-sm leading-7 text-muted-foreground">
        Record the reported outcome. Employers make hiring decisions; PESO
        records and coordinates support.
      </p>
      <Select
        label="Outcome"
        required
        options={Object.entries(outcomeOptions).filter(
          ([key]) =>
            (!closeOnly || ["withdrawn", "opportunity_closed"].includes(key)) &&
            (key !== "needs_training" || trainings.length > 0),
        )}
        {...field("outcome")}
      />
      <Field
        label="Outcome date"
        required
        type="date"
        min={record.requestedAt.slice(0, 10)}
        {...field("date")}
      />
      {form.outcome === "hired" && (
        <Field
          label="Start date (optional)"
          type="date"
          min={form.date}
          {...field("startDate")}
        />
      )}
      {form.outcome === "not_hired" && (
        <Select
          label="Broad reason (optional, staff only)"
          options={[
            "Employer selected another candidate",
            "Qualifications mismatch",
            "Position filled",
            "Other",
          ]}
          {...field("reason")}
        />
      )}
      {form.outcome === "needs_training" && (
        <Select
          label="Recommended training"
          required
          options={trainings.map((item) => [item.id, item.title])}
          {...field("trainingId")}
        />
      )}
      {form.outcome === "referred_to_another_opportunity" && (
        <>
          <Select
            label="Suggested opportunity"
            required
            options={mockJobs
              .filter((job) => job.id !== record.jobId)
              .map((job) => [
                job.id,
                `${job.title} / ${job.matchScore}% sample match`,
              ])}
            {...field("suggestedJobId")}
          />
          <p className="text-xs leading-6 text-muted-foreground">
            This suggestion does not create another assistance request.
          </p>
        </>
      )}
    </>
  )
}
export function StaffWorkflowDialog({ action, record, onClose }) {
  const { actor, act } = useStaff(),
    { notify } = useFeedback()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    publicUpdate:
      action === "requestJobseekerUpdate"
        ? "Please update your contact information before referral can continue."
        : action === "recordEmployerCoordination"
          ? "Your referral is being coordinated with the employer in this sample journey."
          : action === "addFollowUp"
            ? "PESO is following up on your referral in this sample journey."
            : "",
    confirmed: false,
  })
  const [pending, setPending] = useState(false),
    [error, setError] = useState("")
  const busy = useRef(false)
  const openedVersion = useRef(record.version)
  const field = (key) => ({
    value: form[key] || "",
    onChange: (event) =>
      setForm((current) => ({ ...current, [key]: event.target.value })),
  })
  const training = mockTrainings.find((item) => item.id === form.trainingId)
  const seeker = mockJobseekers.find((item) => item.id === record.jobseekerId)
  const submit = async (event) => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError("")
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve))
      const result = act(record.id, action, {
        ...form,
        version: openedVersion.current,
      })
      notify(result.message)
      onClose()
      requestAnimationFrame(() =>
        document.getElementById("staff-workflow-heading")?.focus(),
      )
    } catch (failure) {
      setError(failure.message)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <Modal
      open
      onClose={() => {
        if (!busy.current) onClose()
      }}
      title={actionLabels[action]}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="border-b border-border pb-4">
          <p className="font-semibold">{record.jobseekerName}</p>
          <p className="mt-1 text-sm leading-6">{record.jobTitle}</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {record.employer} / {record.reference}
          </p>
        </div>
        <fieldset disabled={pending} className="space-y-4">
          {action === "startReview" && (
            <p className="text-sm leading-7">
              {record.status === "action_required"
                ? "Confirm that you have reviewed the requested profile information before resuming PESO review."
                : "Begin reviewing this assistance request?"}
            </p>
          )}
          {action === "requestJobseekerUpdate" && (
            <Select
              label="What needs to be updated?"
              required
              options={[
                "Contact Information",
                "Resume / Profile",
                "Work Experience",
                "Skills",
                "Education",
                "Other",
              ]}
              {...field("category")}
            />
          )}
          {action === "createReferral" && (
            <div className="space-y-2 text-sm leading-7">
              <p>
                Review the referral summary before preparing this sample
                referral.
              </p>
              <p>
                <strong>Qualifications:</strong> {seeker.education.attainment};{" "}
                {seeker.skills.join(", ")}
              </p>
              <p>
                <strong>Prepared by:</strong> {actor.name}
              </p>
              <p>
                <strong>Internal reference:</strong> REF-{record.id}
              </p>
              <p>
                <strong>Date:</strong> {form.date}
              </p>
            </div>
          )}
          {["recordEmployerCoordination", "addFollowUp"].includes(action) && (
            <CoordinationFields
              form={form}
              field={field}
              followUp={action === "addFollowUp"}
            />
          )}
          {action === "recordEmployerUpdate" && (
            <>
              <Select
                label="Employer response"
                required
                options={[
                  "For Interview",
                  "For Further Evaluation",
                  "Additional Information Requested",
                  "Awaiting Employer Response",
                ]}
                {...field("employerStatus")}
              />
              {form.employerStatus === "For Interview" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Interview date (optional)"
                      type="date"
                      {...field("interviewDate")}
                    />
                    <Field
                      label="Interview time (optional)"
                      type="time"
                      {...field("interviewTime")}
                    />
                  </div>
                  <Field
                    label="Interview location / mode (optional)"
                    {...field("interviewLocation")}
                  />
                  <p className="text-xs leading-6 text-muted-foreground">
                    Record sample employer instructions only. This does not
                    schedule or send an invitation.
                  </p>
                </>
              )}
            </>
          )}
          {action === "recommendTraining" && (
            <>
              <Select
                label="Training"
                required
                options={mockTrainings
                  .filter((item) => item.jobIds.includes(record.jobId))
                  .map((item) => [item.id, item.title])}
                {...field("trainingId")}
              />
              {training && (
                <p className="text-sm leading-7">
                  Skills addressed: {training.skillsAddressed.join(", ")}
                </p>
              )}
              <Field
                label="Recommendation reason (visible to jobseeker)"
                textarea
                required
                maxLength={1000}
                {...field("reason")}
              />
            </>
          )}
          {["recordOutcome", "closeRequest"].includes(action) && (
            <OutcomeFields
              form={form}
              field={field}
              record={record}
              closeOnly={action === "closeRequest"}
            />
          )}
          {action === "assignStaff" && (
            <Select
              label="Assigned staff"
              required
              options={mockStaff
                .filter(
                  (member) =>
                    member.active && member.id !== record.assignedStaffId,
                )
                .map((member) => [member.id, member.name])}
              {...field("staffId")}
            />
          )}
          {[
            "requestJobseekerUpdate",
            "recordEmployerCoordination",
            "addFollowUp",
            "recordEmployerUpdate",
            "recordOutcome",
            "closeRequest",
          ].includes(action) && (
            <Field
              label="Jobseeker-visible update"
              textarea
              required
              maxLength={1000}
              {...field("publicUpdate")}
            />
          )}
          <Field
            label="Internal staff note (optional, staff only)"
            textarea
            maxLength={1000}
            {...field("internalNote")}
          />
          {[
            "createReferral",
            "recordOutcome",
            "closeRequest",
            "assignStaff",
          ].includes(action) && (
            <label className="flex items-start gap-3 text-sm leading-7">
              <input
                type="checkbox"
                required
                checked={form.confirmed}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmed: event.target.checked,
                  }))
                }
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              {action === "createReferral"
                ? "I confirm the profile, contact information and selected opportunity have been reviewed."
                : action === "assignStaff"
                  ? "I confirm this staff assignment change."
                  : "I confirm this recorded outcome and its jobseeker-visible message."}
            </label>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm leading-6 text-[#a4262c]">
            {error}
          </p>
        )}
        <p className="text-xs leading-6 text-muted-foreground">
          Saved in this prototype only. No referral, message or employer
          communication is sent.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : actionLabels[action]}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
