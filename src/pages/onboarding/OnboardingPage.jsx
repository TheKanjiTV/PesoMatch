import { withMinimumLoading } from "../../platform/loading.js"

import { OnboardingSkeleton } from "../../platform/LoadingStates.jsx"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  Link,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router"

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react"

import { exitPanel } from "../../app/motion.js"

import { safeAssistanceReturn } from "../../services/assistanceService.js"

import { Alert, AuthButton } from "../../app/auth/components.jsx"

import { Button, Modal, ProgressBar } from "../../components/common/UI.jsx"

import {
  FeedbackProvider,
  useFeedback,
} from "../../components/common/Feedback.jsx"

import { useAuth } from "../../context/AuthContext.jsx"

import { ResumePanel } from "../../platform/Resume.jsx"

import { CollectionNotice } from "../../platform/CollectionNotice.jsx"

import { Brand } from "../../platform/ui.jsx"

import { AppearanceControls } from "../../platform/Appearance.jsx"

import {
  completeOnboarding,
  getOnboarding,
  getSkills,
  saveEducation,
  saveJobPreferences,
  savePersonalInfo,
  saveSkillsQualifications,
  saveWorkExperience,
} from "../../services/account.js"

import {
  EducationStep,
  ExperienceStep,
  mergeSaved,
  PersonalStep,
  PreferencesStep,
  SkillsStep,
  stepDescriptions,
  stepKeys,
  stepNames,
  stepTitles,
  validateStep,
} from "./Steps.jsx"

const savers = [
  savePersonalInfo,

  saveEducation,

  saveSkillsQualifications,

  saveWorkExperience,

  saveJobPreferences,
]

const forms = [
  PersonalStep,

  EducationStep,

  SkillsStep,

  ExperienceStep,

  PreferencesStep,
]

// UI-only row keys never reach the API's explicit field allowlists.

const cleanPayload = (value) =>
  Array.isArray(value)
    ? value.map(cleanPayload)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)

            .filter(([key]) => key !== "_key")

            .map(([key, item]) => [key, cleanPayload(item)]),
        )
      : value

function OnboardingFlow() {
  const { step: routeStep } = useParams()

  const step = Number(routeStep) || 5

  const complete = routeStep === "complete"

  const { user, onboarding, refresh, logout } = useAuth()

  const navigate = useNavigate()

  const location = useLocation()

  const assistanceReturn = safeAssistanceReturn(
    new URLSearchParams(location.search).get("returnTo"),
  )

  const reviewReturn = assistanceReturn || "/jobseeker/profile"

  const reviewQuery = `?review=1${
    assistanceReturn ? `&returnTo=${encodeURIComponent(assistanceReturn)}` : ""
  }`

  const enteringFromAccount =
    location.state?.authTransition && !location.state?.profileDirection

  const review =
    new URLSearchParams(location.search).get("review") === "1" &&
    onboarding?.completed

  const { notify } = useFeedback()

  const [data, setData] = useState(null)

  const [saved, setSaved] = useState(null)

  const [options, setOptions] = useState([])

  const [loading, setLoading] = useState(true)

  const [loadError, setLoadError] = useState("")

  const [error, setError] = useState("")

  const [errors, setErrors] = useState({})

  const [saving, setSaving] = useState(false)

  const [leaving, setLeaving] = useState(false)

  const formRef = useRef(null)

  const titleRef = useRef(null)

  const allowNavigation = useRef(false)

  const loadVersion = useRef(0)

  const dirty =
    !!data && !!saved && JSON.stringify(data) !== JSON.stringify(saved)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || saving) &&
      !allowNavigation.current &&
      currentLocation.pathname + currentLocation.search !==
        nextLocation.pathname + nextLocation.search,
  )

  const load = useCallback(async () => {
    const version = ++loadVersion.current

    setLoading(true)

    setLoadError("")

    try {
      const [profile, skillResult] = await withMinimumLoading(() =>
        Promise.all([
          getOnboarding(),

          step === 3 ? getSkills() : Promise.resolve({ data: [] }),
        ]),
      )

      if (version !== loadVersion.current) return

      const next = mergeSaved(profile.data)

      setData(next)

      setSaved(structuredClone(next))

      setOptions(skillResult.data)
    } catch (failure) {
      if (version !== loadVersion.current) return

      setLoadError(
        failure.message ||
          "Your profile could not be loaded. Please try again.",
      )
    } finally {
      if (version === loadVersion.current) setLoading(false)
    }
  }, [step === 3])

  useEffect(() => {
    load()

    return () => {
      ++loadVersion.current
    }
  }, [load])

  useEffect(() => {
    document.title = `${
      complete
        ? "Profile complete"
        : `${review ? "Edit" : "Set up"} profile: ${stepNames[step - 1]}`
    } | PesoMatch`

    setErrors({})

    setError("")

    allowNavigation.current = false

    window.scrollTo({ top: 0, behavior: "instant" })

    titleRef.current?.focus({ preventScroll: true })
  }, [step, complete, review])

  useEffect(() => {
    if (!dirty && !saving) return

    const prevent = (event) => {
      event.preventDefault()

      event.returnValue = ""
    }

    window.addEventListener("beforeunload", prevent)

    return () => window.removeEventListener("beforeunload", prevent)
  }, [dirty, saving])

  const focusError = () => {
    const invalid = formRef.current?.querySelector('[aria-invalid="true"]')

    const control = invalid?.matches("fieldset")
      ? invalid.querySelector("input, select, button")
      : invalid

    control?.focus()
  }

  const update = (field, value) => {
    const section = stepKeys[step - 1]

    setData((current) => ({
      ...current,

      [section]: {
        ...current[section],

        [field]:
          typeof value === "function" ? value(current[section][field]) : value,
      },
    }))

    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([key]) => key !== field && !key.startsWith(`${field}.`),
        ),
      ),
    )

    setError("")
  }

  async function moveTo(path, direction = "forward") {
    if (path === location.pathname + location.search) return

    await exitPanel(formRef.current, direction)

    allowNavigation.current = true

    navigate(path, {
      state: { authTransition: true, profileDirection: direction },
    })
  }

  async function discardAndLeave() {
    if (saving || blocker.state !== "blocked") return

    const destination = blocker.location

    const previousStep = Number(destination.pathname.split("/").at(-1))

    const direction =
      destination.state?.profileDirection ||
      (previousStep > 0 && previousStep < step ? "back" : "forward")

    setSaving(true)

    await exitPanel(formRef.current, direction)

    setData(structuredClone(saved))

    allowNavigation.current = true

    blocker.proceed()

    setSaving(false)
  }

  function requestMove(path, direction = "forward") {
    if (path === location.pathname + location.search) return

    if (saving) return

    if (dirty)
      navigate(path, {
        state: { authTransition: true, profileDirection: direction },
      })
    else moveTo(path, direction)
  }

  async function submit(event) {
    event.preventDefault()

    if (saving || !data) return

    const section = stepKeys[step - 1]

    const sectionErrors = validateStep(step, data[section])

    setErrors(sectionErrors)

    if (Object.keys(sectionErrors).length) {
      setError("Check the highlighted fields before continuing.")

      requestAnimationFrame(focusError)

      return
    }

    setSaving(true)

    setError("")

    try {
      const payload = cleanPayload(data[section])

      if (section === "work_experience" && !payload.has_experience)
        payload.experiences = []

      const result = await savers[step - 1](payload)

      const next = mergeSaved(result.data)

      setData(next)

      setSaved(structuredClone(next))

      window.dispatchEvent(
        new CustomEvent("pesomatch:profile-updated", { detail: result }),
      )

      notify(result.message || `${stepNames[step - 1]} saved.`)

      if (review) {
        await refresh()

        await moveTo(reviewReturn, assistanceReturn ? "back" : "forward")
      } else if (step === 5) {
        const finished = await completeOnboarding()

        window.dispatchEvent(
          new CustomEvent("pesomatch:profile-updated", { detail: finished }),
        )

        await refresh()

        notify(finished.message || "Your jobseeker profile is complete.")

        await moveTo("/jobseeker/onboarding/complete")
      } else {
        await refresh()

        await moveTo(`/jobseeker/onboarding/${step + 1}`)
      }
    } catch (failure) {
      setErrors(
        Object.fromEntries(
          Object.entries(failure.errors || {}).map(([key, messages]) => [
            key,

            Array.isArray(messages) ? messages[0] : messages,
          ]),
        ),
      )

      setError(
        failure.message ||
          "Your changes could not be saved. Your entries are still here; please try again.",
      )

      requestAnimationFrame(focusError)
    } finally {
      setSaving(false)
    }
  }

  async function signOut() {
    setSaving(true)

    try {
      await logout()

      allowNavigation.current = true

      navigate("/login", { replace: true })
    } catch (failure) {
      setError(failure.message || "We couldn't sign you out. Please try again.")
    } finally {
      setSaving(false)

      setLeaving(false)
    }
  }

  const StepForm = forms[step - 1]

  const percent = onboarding?.completion_percentage || 0

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#onboarding-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-card px-5 py-3 text-primary focus:translate-y-0"
      >
        Skip to profile form
      </a>
      <header className="bg-[#123d35] text-white">
        <div className="mx-auto flex min-h-20 max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Brand light />
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <AppearanceControls compact />
            <span className="hidden text-white/90 sm:block">
              {user?.first_name}'s jobseeker profile
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => (dirty ? setLeaving(true) : signOut())}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 px-3 font-medium hover:bg-card/10 disabled:opacity-50"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main
        id="onboarding-main"
        className={`mx-auto max-w-[1240px] px-5 py-7 sm:px-8 lg:py-9 ${
          enteringFromAccount ? "auth-flow-enter" : ""
        }`}
      >
        {complete ? (
          <section
            ref={formRef}
            className="auth-flow-enter mx-auto max-w-2xl rounded-2xl bg-card p-7 text-center shadow-[0_8px_40px_#2454410a] sm:p-12"
          >
            <span className="profile-ready-check mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-primary">
              <CheckCheck size={38} />
            </span>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="mt-3 text-3xl font-semibold tracking-tight outline-none sm:text-4xl"
            >
              Your Jobseeker Profile is Ready
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
              You can update your profile anytime. Keeping your information
              current helps PesoMatch provide more relevant job and training
              recommendations.
            </p>
            <div className="my-7 rounded-xl bg-background p-5 text-left">
              <div className="mb-3 flex justify-between text-sm font-semibold">
                <span>Jobseeker profile</span>
                <span className="text-primary">100% complete</span>
              </div>
              <ProgressBar value={100} label="Profile completion" />
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {[
                  "Personal Information",

                  "Education",

                  "Skills & Qualifications",

                  "Work Experience",

                  "Job Preferences",
                ].map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <Check size={14} className="text-primary" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                disabled={saving}
                onClick={() => moveTo("/dashboard")}
                className="w-full sm:w-auto"
              >
                Go to Dashboard <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" to="/jobseeker/profile">
                Review Profile
              </Button>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              You can update your information anytime from My Profile.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/home" className="hover:text-primary">
                Home
              </Link>
              <ChevronRight size={13} />
              <span>{review ? "Edit profile" : "Create your profile"}</span>
            </div>
            <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="space-y-5 lg:sticky lg:top-7">
                <div>
                  <h2 className="mt-2 text-2xl font-semibold leading-snug">
                    Start with a<br className="hidden lg:block" /> profile that
                    fits you.
                  </h2>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    A few details help you discover work and training that match
                    your goals.
                  </p>
                </div>
                <nav
                  aria-label="Profile setup steps"
                  className="rounded-xl bg-card p-3 shadow-[0_4px_20px_#3048b005]"
                >
                  <ol className="grid grid-cols-5 gap-1 lg:block lg:space-y-1">
                    {stepNames.map((name, index) => {
                      const done = onboarding?.completed_steps?.includes(
                        stepKeys[index],
                      )

                      const enabled =
                        !!onboarding?.completed ||
                        index + 1 <= Number(onboarding?.current_step || 1)

                      return (
                        <li key={name}>
                          <button
                            type="button"
                            disabled={!enabled || saving}
                            onClick={() =>
                              requestMove(
                                `/jobseeker/onboarding/${index + 1}${
                                  review ? reviewQuery : ""
                                }`,

                                index + 1 < step ? "back" : "forward",
                              )
                            }
                            aria-current={
                              step === index + 1 ? "step" : undefined
                            }
                            className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-medium transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm ${
                              step === index + 1
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground enabled:hover:bg-background disabled:opacity-45"
                            }`}
                          >
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${
                                step === index + 1
                                  ? "bg-primary text-primary-foreground"
                                  : done
                                    ? "bg-secondary text-primary"
                                    : "bg-background text-muted-foreground"
                              }`}
                            >
                              {done && step !== index + 1 ? (
                                <Check size={14} />
                              ) : (
                                index + 1
                              )}
                            </span>
                            {name}
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </nav>
                <div className="hidden overflow-hidden rounded-xl lg:block">
                  <img
                    src="/images/career-portrait.webp"
                    width="704"
                    height="469"
                    loading="lazy"
                    decoding="async"
                    alt="Professional at work"
                    className="h-44 w-full object-cover"
                  />
                  <div className="bg-[#123d35] p-5 text-white">
                    <p className="text-base font-semibold leading-6">
                      Big possibilities.
                      <br />
                      One step at a time.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/75">
                      Your skills have a place. Let's help you find it.
                    </p>
                  </div>
                </div>
              </aside>
              <section className="min-w-0 rounded-xl bg-card shadow-[0_8px_40px_#2454410a]">
                <div className="border-b border-border p-5 sm:px-8 sm:py-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary">
                      {review
                        ? "Update Jobseeker Profile"
                        : `Jobseeker Profile · Step ${step} of 5`}
                    </span>
                    <span className="text-muted-foreground">
                      {percent}% saved
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    label="Saved profile completion"
                  />
                  <h1
                    ref={titleRef}
                    tabIndex={-1}
                    className="mt-6 text-2xl font-semibold tracking-tight outline-none sm:text-[28px]"
                  >
                    {stepTitles[step - 1]}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {stepDescriptions[step - 1]}
                  </p>
                </div>
                {loading ? (
                  <div className="p-5 sm:p-8">
                    <OnboardingSkeleton step={step} />
                  </div>
                ) : loadError ? (
                  <div className="space-y-5 p-5 sm:p-8">
                    <Alert tone="error">{loadError}</Alert>
                    <Button onClick={load}>Try again</Button>
                  </div>
                ) : (
                  <form
                    ref={formRef}
                    onSubmit={submit}
                    noValidate
                    key={step}
                    className={
                      location.state?.profileDirection === "back"
                        ? "onboarding-flow-back"
                        : enteringFromAccount
                          ? ""
                          : "auth-flow-enter"
                    }
                  >
                    <fieldset disabled={saving} className="min-w-0 p-5 sm:p-8">
                      <legend className="sr-only">
                        {stepTitles[step - 1]}
                      </legend>
                      <CollectionNotice />
                      {step === 3 && (
                        <ResumePanel
                          onApplied={(ids) =>
                            update("skills", [
                              ...new Set([...data.skills.skills, ...ids]),
                            ])
                          }
                        />
                      )}
                      <StepForm
                        data={data[stepKeys[step - 1]]}
                        update={update}
                        errors={errors}
                        options={options}
                        notify={notify}
                      />
                      {error && (
                        <div className="mt-6">
                          <Alert tone="error">{error}</Alert>
                        </div>
                      )}
                    </fieldset>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 sm:px-8">
                      <Button
                        variant="secondary"
                        disabled={saving || (!review && step === 1)}
                        onClick={() =>
                          requestMove(
                            review
                              ? reviewReturn
                              : `/jobseeker/onboarding/${step - 1}`,

                            "back",
                          )
                        }
                      >
                        <ArrowLeft size={16} />
                        {review ? "Cancel" : "Back"}
                      </Button>
                      <AuthButton
                        type="submit"
                        className="!w-auto"
                        loading={saving}
                        loadingText="Saving..."
                      >
                        {review
                          ? "Save changes"
                          : step === 5
                            ? "Complete profile"
                            : "Save & continue"}
                        <ArrowRight size={16} />
                      </AuthButton>
                    </div>
                    <p className="border-t border-border px-5 py-4 text-xs leading-6 text-muted-foreground sm:px-8">
                      <ShieldCheck
                        size={14}
                        className="mr-1.5 inline-block text-primary"
                      />
                      Each completed step is saved securely. Fields marked * are
                      required.
                    </p>
                  </form>
                )}
              </section>
            </div>
          </>
        )}
      </main>
      <Modal
        open={blocker.state === "blocked" || leaving}
        title="You have unsaved changes. Leave this page?"
        onClose={() => {
          if (saving) return

          if (blocker.state === "blocked") blocker.reset()

          setLeaving(false)
        }}
      >
        <p className="text-sm leading-7 text-muted-foreground">
          Your changes on this step have not been saved. Previously saved steps
          will still be here when you return.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => {
              if (blocker.state === "blocked") blocker.reset()

              setLeaving(false)
            }}
          >
            Stay
          </Button>
          <Button
            onClick={() => {
              if (leaving) signOut()
              else discardAndLeave()
            }}
            disabled={saving}
          >
            {leaving ? "Leave & sign out" : "Leave"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function OnboardingPage() {
  return (
    <FeedbackProvider>
      <OnboardingFlow />
    </FeedbackProvider>
  )
}
