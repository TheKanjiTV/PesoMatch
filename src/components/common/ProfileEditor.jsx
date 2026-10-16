import { useRef, useState } from "react"
import { useDashboard } from "../../context/DashboardContext.jsx"
import { useFeedback } from "./Feedback.jsx"
import { Button, Field, Modal } from "./UI.jsx"
import {
  PersonalStep,
  EducationStep,
  SkillsStep,
  ExperienceStep,
  PreferencesStep,
  defaults,
  stepKeys,
  validateStep,
} from "../../pages/onboarding/Steps.jsx"
import { updateProfile } from "../../services/account.js"

const forms = [
  PersonalStep,
  EducationStep,
  SkillsStep,
  ExperienceStep,
  PreferencesStep,
]
const titles = [
  "Edit Profile",
  "Edit Education",
  "Edit Skills & Qualifications",
  "Edit Work Experience",
  "Edit Job Preferences",
]
export function ProfileEditor({ step = 1, onClose }) {
  const {
    serverProfile,
    skillLookup,
    workspacePreferences,
    setWorkspacePreferences,
    reloadProfile,
  } = useDashboard()
  const { notify } = useFeedback()
  const section = stepKeys[step - 1]
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      Object.keys(defaults[section]).map((key) => [
        key,
        structuredClone(
          serverProfile?.[section]?.[key] ?? defaults[section][key],
        ),
      ]),
    ),
  )
  const [headline, setHeadline] = useState(workspacePreferences.headline || ""),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false)
  const guard = useRef(false),
    Form = forms[step - 1]
  const update = (key, value) => {
    setValues((before) => ({ ...before, [key]: value }))
    setErrors((before) => ({ ...before, [key]: undefined }))
  }
  async function save(event) {
    event.preventDefault()
    if (guard.current) return
    const validation = validateStep(step, values)
    setErrors(validation)
    if (Object.keys(validation).length) {
      setError("Review the highlighted fields.")
      return
    }
    guard.current = true
    setBusy(true)
    setError("")
    try {
      const result = await updateProfile({ section, ...values })
      if (step === 1)
        setWorkspacePreferences((before) => ({
          ...before,
          headline: headline.trim(),
        }))
      window.dispatchEvent(
        new CustomEvent("pesomatch:profile-updated", {
          detail: { onboarding: result.onboarding },
        }),
      )
      await reloadProfile()
      notify("Profile changes saved.")
      onClose()
    } catch (failure) {
      setError(failure.message)
      setErrors(
        Object.fromEntries(
          Object.entries(failure.errors || {}).map(([key, messages]) => [
            key,
            messages[0],
          ]),
        ),
      )
    } finally {
      guard.current = false
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={() => !busy && onClose()} title={titles[step - 1]}>
      <form onSubmit={save} noValidate>
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          {step === 1 && (
            <Field
              label="Headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={220}
              placeholder="e.g. Frontend Developer | React | UI/UX"
            />
          )}
          <Form
            data={values}
            update={update}
            errors={errors}
            options={skillLookup}
            notify={notify}
          />
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-[#fff1ee] p-3 text-xs leading-6 text-[#9d3023]"
            >
              {error}
            </p>
          )}
          {step === 1 && (
            <p className="text-[10px] leading-5 text-muted-foreground">
              Personal information is saved to your account. Your headline is
              currently saved on this browser.
            </p>
          )}
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-white pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{busy ? "Saving..." : "Save"}</Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
