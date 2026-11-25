import { Modal } from "./Modal.jsx"
import { Check } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { api } from "./api.js"
import {
  date,
  inputStyle,
  Notice,
  primaryStyle,
  secondaryStyle,
} from "./ui.jsx"

const stages = ["Topic", "Dates", "Details", "Review"]
const fields = [
  [
    {
      name: "topic",
      label: "Training / skill topic",
      maxLength: 160,
      minLength: 3,
    },
    {
      name: "description",
      label: "What would you like to learn?",
      type: "textarea",
      minLength: 10,
      maxLength: 2000,
    },
  ],
  [
    { name: "preferred_start", label: "Preferred start date", type: "date" },
    { name: "preferred_end", label: "Preferred end date", type: "date" },
    {
      name: "preferred_schedule",
      label: "Preferred days and time",
      maxLength: 160,
      placeholder: "e.g. Saturdays, 9 AM–12 PM",
    },
  ],
  [
    {
      name: "mode",
      label: "Training mode",
      options: ["In person", "Online", "Blended"],
    },
    { name: "location", label: "Preferred training location", maxLength: 160 },
    {
      name: "goal",
      label: "How will this training help you?",
      type: "textarea",
      minLength: 10,
      maxLength: 2000,
    },
  ],
]

export function TrainingRequestWizard({ initial = {}, onClose, onSubmitted }) {
  const [step, setStep] = useState(0)
  const heading = useRef(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [step])
  const [values, setValues] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  })
  async function next(e) {
    e.preventDefault()
    setError("")
    if (step < 3) return setStep(step + 1)
    setBusy(true)
    try {
      await api("/training-demands", "POST", {
        ...values,
        wizard_completed: true,
      })
      await onSubmitted()
    } catch (e) {
      setError(
        Object.values(e.errors || {})
          .flat()
          .join(" ") || e.message,
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="Request a training topic"
      size="form"
      busy={busy}
      onClose={onClose}
    >
      <ol
        aria-label="Training request progress"
        className="training-stepper mb-7 flex border-b border-border pb-6"
      >
        {stages.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            data-state={
              index < step ? "complete" : index === step ? "current" : "pending"
            }
            className="training-step"
          >
            <span className="training-step-circle" aria-hidden="true">
              {index < step ? <Check size={18} /> : index + 1}
            </span>
            <span className="mt-3 block text-xs text-muted-foreground">
              Step {index + 1}
            </span>
            <span className="mt-1 block text-sm font-semibold">{label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {index < step
                ? "Completed"
                : index === step
                  ? "In progress"
                  : "Pending"}
            </span>
          </li>
        ))}
      </ol>
      <form onSubmit={next}>
        <h3 tabIndex={-1} ref={heading} className="mb-5 text-lg font-semibold">
          Step {step + 1}: {stages[step]}
        </h3>
        {error && <Notice error>{error}</Notice>}
        {step < 3 ? (
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            {fields[step].map(({ name, label, type, options, ...props }) => (
              <label
                key={name}
                className={`block text-sm font-semibold ${
                  type === "textarea" ||
                  ["topic", "preferred_schedule"].includes(name)
                    ? "sm:col-span-2"
                    : ""
                }`}
              >
                {label}
                {options ? (
                  <select
                    aria-label={label}
                    required
                    className={`${inputStyle} mt-2`}
                    value={values[name] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                  >
                    <option value="">Choose a mode</option>
                    {options.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : type === "textarea" ? (
                  <textarea
                    required
                    rows={4}
                    {...props}
                    className={`${inputStyle} mt-2`}
                    value={values[name] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    required
                    {...props}
                    type={type || "text"}
                    min={
                      type === "date"
                        ? name === "preferred_end"
                          ? values.preferred_start || today
                          : today
                        : undefined
                    }
                    className={`${inputStyle} mt-2`}
                    value={values[name] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [name]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
        ) : (
          <dl className="grid max-w-3xl gap-5 sm:grid-cols-2">
            {fields.flat().map(({ name, label, type }) => (
              <div
                key={name}
                className={
                  type === "textarea" ||
                  ["topic", "preferred_schedule"].includes(name)
                    ? "sm:col-span-2"
                    : ""
                }
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold">
                  {type === "date" ? date(values[name]) : values[name]}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <button
            type="button"
            disabled={busy}
            className={secondaryStyle}
            onClick={onClose}
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {step > 0 && (
              <button
                type="button"
                disabled={busy}
                className={secondaryStyle}
                onClick={() => {
                  setStep(step - 1)
                  setError("")
                }}
              >
                Back
              </button>
            )}
            <button disabled={busy} className={primaryStyle}>
              {busy
                ? "Submitting…"
                : step === 3
                  ? "Submit training request"
                  : "Next"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export function TrainingRequestDetails({ request }) {
  return (
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {fields
        .flat()
        .filter((f) => f.name !== "topic" && request[f.name])
        .map(({ name, label, type }) => (
          <div key={name}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">
              {type === "date" ? date(request[name]) : request[name]}
            </dd>
          </div>
        ))}
    </dl>
  )
}
