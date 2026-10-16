import { useEffect, useRef, useState } from "react"

import { useLocation, useSearchParams } from "react-router"

import { X } from "lucide-react"

import { Button } from "./UI.jsx"

import { useAuth } from "../../context/AuthContext.jsx"

import { updateAccountPreferences } from "../../services/account.js"

import { useFeedback } from "./Feedback.jsx"

const steps = [
  [
    "welcome",
    "Your dashboard",
    "Your home feed brings employment updates and your next steps together.",
    "Dito makikita ang employment updates at ang susunod mong hakbang.",
  ],

  [
    "profile",
    "Start with your profile",
    "Keep your education, skills, experience and preferences current. They form the future basis for recommendations.",
    "I-update ang iyong edukasyon, skills, karanasan at preferences para mas akma ang mga rekomendasyon.",
  ],

  [
    "jobs-nav",
    "Explore Jobs",
    "One Jobs area contains recommended opportunities, all jobs and saved jobs.",
    "Sa Jobs makikita ang mga rekomendasyon, lahat ng trabaho at mga na-save mong oportunidad.",
  ],

  [
    "jobs",
    "Recommended Jobs",
    "Review sample matches, understand the criteria, and explore the skills you could develop.",
    "Tingnan ang sample matches, alamin kung bakit tugma, at tuklasin ang skills na puwedeng pagbutihin.",
  ],

  [
    "training",
    "Build your skills",
    "Follow a job's skill gap to relevant training. Sample training does not enroll you.",
    "Mula sa skill gap ng trabaho, makahanap ng kaugnay na training. Hindi ito aktuwal na enrollment.",
  ],

  [
    "assistance",
    "Keep track of PESO support",
    "Explore the assistance and referral journey. Employers make final hiring decisions.",
    "Subaybayan ang PESO assistance at referrals. Ang employer ang may huling desisyon sa pag-hire.",
  ],

  [
    "updates",
    "Stay up to date",
    "Review sample notifications and messages through these toolbar icons.",
    "Tingnan ang sample notifications at messages gamit ang mga icon dito.",
  ],

  [
    "account",
    "Your profile and settings",
    "Update your profile, account information and job preferences from this menu.",
    "I-update ang iyong profile, account information at job preferences sa menu na ito.",
  ],

  [
    "welcome",
    "You're Ready",
    "Your PesoMatch workspace is ready. Explore opportunities, improve your profile, and follow your employment journey.",
    "Handa na ang iyong PesoMatch workspace. Mag-explore ng mga oportunidad, pagandahin ang iyong profile, at subaybayan ang iyong employment journey.",
  ],
]

export default function GuidedTour() {
  const { pathname } = useLocation()

  const { user, refresh } = useAuth()

  const { notify } = useFeedback()

  const dismissed = useRef(new Set())

  const [params, setParams] = useSearchParams()

  const [active, setActive] = useState(false)

  const [step, setStep] = useState(0)

  const [rect, setRect] = useState(null)

  const [actions, setActions] = useState([])

  const dialog = useRef(null)

  const card = useRef(null)

  const [cardHeight, setCardHeight] = useState(390)

  useEffect(() => {
    if (
      pathname === "/dashboard" &&
      !params.has("preview") &&
      user &&
      ((!user.dashboard_tour_completed_at && !dismissed.current.has(user.id)) ||
        params.get("tour") === "1")
    ) {
      setStep(0)

      setActive(true)
    }
  }, [pathname, params, user])

  useEffect(() => {
    if (!active) return

    const el = dialog.current

    el.showModal()

    const previous = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      el.close()

      document.body.style.overflow = previous
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    let section = document.querySelector(`[data-tour="${steps[step][0]}"]`)

    if (!section?.getBoundingClientRect().width)
      section = document.querySelector('[data-tour="jobs"]')

    // Long mobile sections cannot share the viewport with the bilingual coachmark.

    // Spotlight their primary action so the target stays visible and usable.

    const coachHeight = card.current?.getBoundingClientRect().height || 390

    const target =
      section?.getBoundingClientRect().height >
      window.innerHeight - coachHeight - 150
        ? section.querySelector("a[href],button:not(:disabled)") || section
        : section

    const header = target?.closest("header")
    const fixedHeader =
      header && ["fixed", "sticky"].includes(getComputedStyle(header).position)

    if (target && !fixedHeader) {
      const offset = target.getBoundingClientRect().top - 104

      window.scrollBy({ top: offset, behavior: "instant" })
    }

    const measure = () => {
      setRect(target?.getBoundingClientRect())

      const controls = target
        ? [...target.querySelectorAll("a[href],button:not(:disabled)")]
        : []

      if (target?.matches("a[href],button:not(:disabled)"))
        controls.unshift(target)

      setActions(
        controls

          .map((control) => ({
            control,

            bounds: control.getBoundingClientRect(),

            label:
              control.getAttribute("aria-label") || control.innerText.trim(),
          }))

          .filter(
            (action) =>
              action.bounds.width > 0 &&
              action.bounds.top >= 0 &&
              action.bounds.bottom <= window.innerHeight,
          ),
      )

      setCardHeight(card.current?.getBoundingClientRect().height || 390)
    }

    measure()

    const observer = new ResizeObserver(measure)

    if (card.current) observer.observe(card.current)

    if (target) observer.observe(target)

    window.addEventListener("resize", measure)

    return () => {
      observer.disconnect()

      window.removeEventListener("resize", measure)
    }
  }, [active, step])

  const close = () => {
    dismissed.current.add(user.id)

    updateAccountPreferences({ dashboard_tour_completed: true })

      .then(() => refresh())

      .catch(() =>
        notify(
          "The tour is closed. We could not save this preference; it may appear at your next sign-in.",

          { type: "error" },
        ),
      )

    dialog.current?.close()

    setActive(false)

    if (params.has("tour")) {
      const next = new URLSearchParams(params)

      next.delete("tour")

      setParams(next, { replace: true })
    }

    document.getElementById("workspace-main")?.focus({ preventScroll: true })
  }

  if (!active) return null

  const width = Math.min(420, window.innerWidth - 32)

  const left = rect
    ? Math.max(16, Math.min(rect.left, window.innerWidth - width - 16))
    : 16

  const top = rect
    ? Math.min(window.innerHeight - cardHeight - 16, rect.bottom + 20)
    : 16

  const preferredTop =
    top < rect?.bottom && rect?.top > cardHeight + 32
      ? rect.top - cardHeight - 20
      : Math.max(16, top)

  const placedTop = Math.max(
    16,
    Math.min(preferredTop, window.innerHeight - cardHeight - 16),
  )

  return (
    <dialog
      ref={dialog}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return

        const buttons = [
          ...dialog.current.querySelectorAll(
            'button:not(:disabled),a[href],[tabindex="0"]',
          ),
        ]

        const first = buttons[0],
          last = buttons[buttons.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()

          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()

          first?.focus()
        }
      }}
      aria-labelledby="tour-title"
      aria-describedby="tour-copy"
      onCancel={(e) => {
        e.preventDefault()

        close()
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent"
    >
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-lg border-2 border-[#ffffff] ring-2 ring-primary"
          style={{
            boxShadow: "0 0 0 100vmax #17204470",

            left: Math.max(4, rect.left - 4),

            top: Math.max(4, rect.top - 4),

            width: Math.min(rect.width + 8, innerWidth - 8),

            height: Math.min(rect.height + 8, innerHeight - 8),
          }}
        />
      )}
      {actions.map((action, index) => (
        <button
          key={index}
          type="button"
          aria-label={action.label}
          className="fixed z-10 rounded-md bg-transparent focus-visible:outline-white"
          style={{
            left: action.bounds.left,

            top: action.bounds.top,

            width: action.bounds.width,

            height: action.bounds.height,
          }}
          onClick={() => {
            close()

            action.control.click()
          }}
        />
      ))}
      <section
        ref={card}
        className="fixed z-20 max-h-[calc(100dvh-32px)] overflow-auto rounded-xl border border-border bg-[#ffffff] p-6 shadow-xl"
        style={{ left, top: placedTop, width }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Getting started · {step + 1} of {steps.length}
          </p>
          <button
            aria-label="Exit tour"
            onClick={close}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
          >
            <X size={18} />
          </button>
        </div>
        <h2
          id="tour-title"
          className="mt-2 text-xl font-semibold text-foreground"
        >
          {steps[step][1]}
        </h2>
        <div id="tour-copy" className="mt-4 space-y-3 text-sm leading-6">
          <p>{steps[step][2]}</p>
          <p
            lang="fil"
            className="border-t border-border pt-3 text-muted-foreground"
          >
            {steps[step][3]}
          </p>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Use a highlighted action to open it and finish the tour, or continue
          with Next.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <Button variant="text" onClick={close}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              onClick={() =>
                step === steps.length - 1 ? close() : setStep(step + 1)
              }
            >
              {step === steps.length - 1 ? "Finish Tour" : "Next"}
            </Button>
          </div>
        </div>
      </section>
    </dialog>
  )
}
