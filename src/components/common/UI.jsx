import { useEffect, useId, useRef } from "react"

import { Link } from "react-router"

import { JourneyLink, isJourneyPath } from "./JourneyLink.jsx"

import {
  ArrowRight,
  Check,
  Circle,
  CircleAlert,
  Info,
  RotateCcw,
  X,
} from "lucide-react"

export const panel =
  "rounded-xl border border-border/60 bg-card shadow-[0_5px_22px_-16px_#28359330]"

export function Button({
  to,

  children,

  variant = "primary",

  className = "",

  ...props
}) {
  const style = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "primary"
      ? "peso-primary border-primary bg-primary text-primary-foreground"
      : variant === "text"
        ? "border-transparent text-primary hover:bg-secondary"
        : "border-border bg-card text-primary hover:bg-secondary"
  } ${className}`

  const NavigationLink = isJourneyPath(to) ? JourneyLink : Link

  return to ? (
    <NavigationLink to={to} className={style} {...props}>
      {children}
    </NavigationLink>
  ) : (
    <button type="button" className={style} {...props}>
      {children}
    </button>
  )
}

export function TextLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4"
    >
      {children}
      <ArrowRight size={15} />
    </Link>
  )
}

export function Badge({ children, status = children }) {
  const good = [
    "Strong Match",

    "Matched",

    "Completed",

    "Available Training",

    "Active Referral",
  ].includes(status)

  const warning = [
    "Needs Improvement",

    "Developing",

    "Not in Profile",
  ].includes(status)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium leading-5 ${
        good
          ? "bg-success-surface text-success-ink"
          : warning
            ? "bg-pending-surface text-pending-ink"
            : "bg-secondary text-primary"
      }`}
    >
      {children}
    </span>
  )
}

export function StatusIcon({ status }) {
  const Icon =
    status === "Completed" || status === "Matched"
      ? Check
      : status === "Developing" || status === "Needs Improvement"
        ? CircleAlert
        : Circle

  return (
    <Icon
      size={16}
      aria-hidden="true"
      className={`shrink-0 ${
        status === "Completed" || status === "Matched"
          ? "text-success-ink"
          : status === "Pending" || status === "Not in Profile"
            ? "text-muted-foreground"
            : "text-pending-ink"
      }`}
    />
  )
}

export function ProgressBar({ value, label, className = "" }) {
  return (
    <progress
      max={100}
      value={value}
      aria-label={label}
      className={`h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#e7ebf5] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary ${className}`}
    />
  )
}

export function Avatar({ name, size = "normal" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-primary ${
        size === "large" ? "size-14 text-lg" : "size-9 text-sm"
      }`}
    >
      {name.trim().slice(0, 1) || "K"}
    </span>
  )
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold leading-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function PageHeading({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight text-foreground sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-[70ch] text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon: Icon = Circle,

  title,

  description,

  action,

  heading: Heading = "h3",
}) {
  return (
    <div className={`${panel} p-7 text-center`}>
      <Icon aria-hidden="true" size={27} className="mx-auto text-primary" />
      <Heading className="mt-4 text-lg font-semibold">{title}</Heading>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry }) {
  return (
    <div role="alert" className={`${panel} p-6`}>
      <h3 className="flex items-center gap-2 font-semibold">
        <CircleAlert size={18} />
        We couldn't load this section.
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      <Button onClick={onRetry} variant="secondary" className="mt-4">
        <RotateCcw size={16} />
        Try Again
      </Button>
    </div>
  )
}

export function Skeleton({ kind = "job", label = `Loading ${kind}` }) {
  const tall = ["job", "training", "referral", "profile"].includes(kind)

  return (
    <div
      role="status"
      aria-label={label}
      className={`${panel} p-6 motion-safe:animate-pulse`}
    >
      <span className="sr-only">{label}</span>
      <div className="h-3 w-2/5 rounded bg-border" />
      <div className="mt-5 h-6 w-3/5 rounded bg-border" />
      {tall && (
        <>
          <div className="mt-6 h-3 rounded bg-secondary" />
          <div className="mt-3 h-3 w-4/5 rounded bg-secondary" />
          <div className="mt-7 h-10 rounded bg-secondary" />
        </>
      )}
    </div>
  )
}

export function MatchTooltip() {
  const id = useId()

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="About match results"
        aria-describedby={id}
        className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
      >
        <Info size={16} />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 hidden w-56 rounded-lg border border-border bg-card p-3 text-left text-xs font-normal leading-5 text-foreground shadow-md group-hover:block group-focus-within:block"
      >
        Match results are based on the profile information currently available
        and do not guarantee employment.
      </span>
    </span>
  )
}

export function Modal({
  open,

  onClose,

  title,

  children,

  placement = "center",
}) {
  const ref = useRef(null)

  const id = useId()

  useEffect(() => {
    const dialog = ref.current

    if (open) {
      dialog.showModal()

      const previous = document.body.style.overflow

      document.body.style.overflow = "hidden"

      return () => {
        dialog.close()

        document.body.style.overflow = previous
      }
    }

    dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault()

        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`${
        placement === "sheet"
          ? "fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none rounded-t-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:h-dvh sm:max-h-dvh sm:w-[420px] sm:rounded-none"
          : "m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-4xl rounded-xl"
      } overflow-auto border border-border bg-card p-0 text-foreground shadow-xl backdrop:bg-[#15203d]/45`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-3">
        <h2 id={id} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}

export function Field({ label, textarea = false, children, ...props }) {
  const id = useId()

  const style =
    "mt-2 min-h-12 w-full rounded-lg border border-[#dce1ed] bg-card px-3 py-2.5 text-base text-foreground"

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children ? (
        <select id={id} className={style} {...props}>
          {children}
        </select>
      ) : textarea ? (
        <textarea id={id} rows={3} className={style} {...props} />
      ) : (
        <input id={id} className={style} {...props} />
      )}
    </div>
  )
}
