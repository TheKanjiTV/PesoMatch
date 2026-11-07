import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { X, ArrowRight, ArrowLeft } from "lucide-react"

import { useAuth } from "../context/AuthContext.jsx"

import { updateAccountPreferences } from "../services/account.js"

import { primaryStyle, secondaryStyle, staffRole } from "./ui.jsx"

import { reducedMotion } from "./motionPreference.js"

export function WorkspaceTutorial({ requested = false, onDismiss }) {
  const { user, refresh } = useAuth()

  const dialog = useRef(null),
    restore = useRef(null),
    card = useRef(null)

  const [step, setStep] = useState(0),
    [active, setActive] = useState(false)

  const [position, setPosition] = useState(null)

  const seeker = user.role === "jobseeker",
    staff = staffRole(user.role)

  const steps = [
    [
      "overview-heading",

      seeker
        ? "Welcome to your PESO workspace"
        : staff
          ? "Your PESO service desk"
          : "Your partner workspace",

      "This is your Overview. Your account and role determine which employment services you can use.",
    ],

    [
      seeker ? "profile-entry" : "overview-task-0",

      seeker ? "Start with your résumé" : "Manage your records",

      seeker
        ? "Use this profile link to upload a PDF, review detected skills and keep your employment profile current."
        : "Open this service to review the records permitted for your role.",
    ],

    [
      "overview-primary-action",

      seeker ? "Understand your matches" : "Take the next action",

      seeker
        ? "This opens Job Matching. Compare matched skills, missing skills and training suggestions before requesting a referral."
        : "This shortcut takes you to your main service queue.",
    ],

    [
      "overview-task-1",

      seeker ? "Build your skills" : "Coordinate progress",

      seeker
        ? "This opens training. Submit training requests here. PESO verifies the provider intake, then follows enrollment confirmation and progress in this workspace."
        : "Use this service to coordinate the next stage with PESO.",
    ],

    [
      "overview-task-2",

      seeker ? "Keep PESO informed" : "Continue your follow-up",

      seeker
        ? "Report employment changes here. PESO checks evidence before an outcome is marked verified."
        : "Review continuing progress and follow-up. Your role limits which actions you can take.",
    ],
  ]

  function close() {
    dialog.current?.close()

    setActive(false)

    try {
      sessionStorage.setItem(`peso-tour:${user.id}`, "dismissed")
    } catch {}

    updateAccountPreferences({ dashboard_tour_completed: true })

      .then(refresh)

      .catch(() => {})

    onDismiss?.()

    requestAnimationFrame(() => {
      const target = restore.current?.isConnected
        ? restore.current
        : document.querySelector("[data-tour-launcher]")

      target?.focus({ preventScroll: true })
    })
  }

  useEffect(() => {
    let dismissed = false

    try {
      dismissed = sessionStorage.getItem(`peso-tour:${user.id}`) === "dismissed"
    } catch {}

    if (requested || (!user.dashboard_tour_completed_at && !dismissed)) {
      restore.current =
        document.activeElement === document.body
          ? document.querySelector("[data-tour-launcher]")
          : document.activeElement

      setStep(0)

      setActive(true)

      if (!dialog.current.open) dialog.current.showModal()
    }

    return () => dialog.current?.close()
  }, [user.id, requested])

  useLayoutEffect(() => {
    if (!active) return

    const target = document.querySelector(
      `[data-tour="${steps[step][0]}"]${step === 0 ? " h1" : ""}`,
    )

    if (!target) return

    const update = () => {
      const rect = target.getBoundingClientRect()

      const width = Math.min(360, innerWidth - 32)

      const height = card.current?.getBoundingClientRect().height || 300

      let left = Math.min(Math.max(16, rect.left), innerWidth - width - 16)

      let top = rect.bottom + 20

      if (innerWidth < 640) {
        left = 16

        top = innerHeight - height - 88
      } else if (rect.right + width + 28 < innerWidth) {
        left = rect.right + 20

        top = Math.max(16, rect.top)
      } else if (top + height > innerHeight - 16)
        top = Math.max(16, rect.top - height - 20)

      top = Math.max(16, Math.min(top, innerHeight - height - 16))

      setPosition({
        x: Math.max(4, rect.left - 6),

        y: Math.max(4, rect.top - 6),

        width: Math.min(rect.width + 12, innerWidth - 8),

        height: rect.height + 12,

        left,

        top,

        cardWidth: width,

        viewportWidth: innerWidth,

        viewportHeight: innerHeight,
      })
    }

    window.scrollTo({
      top: Math.max(
        0,

        window.scrollY +
          target.getBoundingClientRect().top -
          (innerWidth < 640 ? 100 : 140),
      ),

      behavior: reducedMotion() ? "instant" : "smooth",
    })

    update()

    const observer = new ResizeObserver(update)

    observer.observe(target)

    if (card.current) observer.observe(card.current)

    window.addEventListener("resize", update)

    window.addEventListener("scroll", update, true)

    return () => {
      observer.disconnect()

      window.removeEventListener("resize", update)

      window.removeEventListener("scroll", update, true)
    }
  }, [active, step, user.role])

  const p = position

  return (
    <dialog
      ref={dialog}
      className="workspace-walkthrough"
      aria-labelledby="tour-heading"
      aria-describedby="tour-description"
      onCancel={(event) => {
        event.preventDefault()

        close()
      }}
    >
      {p && (
        <svg
          className="tour-spotlight"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <path
            fill="rgba(0,0,0,.72)"
            fillRule="evenodd"
            d={`M0 0H${p.viewportWidth}V${p.viewportHeight}H0Z M${p.x} ${p.y}h${p.width}v${p.height}h-${p.width}Z`}
          />
          <rect
            x={p.x}
            y={p.y}
            width={p.width}
            height={p.height}
            rx="6"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
          />
        </svg>
      )}
      <section
        ref={card}
        className="tour-coach"
        style={
          p
            ? { left: p.left, top: p.top, width: p.cardWidth }
            : { left: 16, top: 100, width: "min(360px, calc(100% - 32px))" }
        }
      >
        <button
          className="tour-close"
          aria-label="Close tutorial"
          onClick={close}
        >
          <X size={21} />
        </button>
        <p className="pr-10 text-sm text-muted-foreground">
          Workspace guide · {step + 1} of {steps.length}
        </p>
        <h2
          id="tour-heading"
          aria-live="polite"
          className="mt-3 font-display text-2xl text-primary"
        >
          {steps[step][1]}
        </h2>
        <p
          id="tour-description"
          className="mt-3 text-sm leading-7 text-muted-foreground"
        >
          {steps[step][2]}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            className="min-h-11 text-sm font-semibold underline"
            onClick={close}
          >
            Skip tutorial
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                className={secondaryStyle}
                aria-label="Previous tutorial step"
                onClick={() => setStep((value) => value - 1)}
              >
                <ArrowLeft size={17} />
              </button>
            )}
            <button
              className={primaryStyle}
              onClick={() =>
                step === steps.length - 1
                  ? close()
                  : setStep((value) => value + 1)
              }
            >
              {step === steps.length - 1 ? "Finish" : "Next"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </dialog>
  )
}
