import { useEffect, useId, useRef, useState } from "react"

import { Link } from "react-router"

import { ArrowRight, Check, CircleAlert, X } from "lucide-react"

import { PesoMark } from "./Logo.jsx"

export { LogoLoading } from "./LoadingStates.jsx"

export const title =
  "AI-Powered Employment Facilitation Platform for Public Employment Service Office (PESO)"

export const roles = {
  jobseeker: "Jobseeker",

  peso_staff: "PESO officer",

  admin: "Administrator",

  employer: "Employer",

  training_provider: "Training provider",
}

export const staffRole = (role) => ["peso_staff", "admin"].includes(role)

export const human = (value) =>
  String(value || "")

    .replaceAll("_", " ")

    .replace(/\b\w/g, (c) => c.toUpperCase())

export const date = (value) =>
  value
    ? new Date(String(value).slice(0, 10) + "T12:00:00").toLocaleDateString(
        "en-PH",

        { month: "short", day: "numeric", year: "numeric" },
      )
    : "Not scheduled"

export const money = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",

    currency: "PHP",

    maximumFractionDigits: 0,
  }).format(value || 0)

export const inputStyle =
  "min-h-12 w-full rounded-lg border border-border bg-card px-3 py-3 text-base font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:bg-muted"

export const primaryStyle =
  "peso-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition disabled:cursor-wait disabled:opacity-60"

export const secondaryStyle =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary disabled:opacity-50"

export const dangerStyle = `${secondaryStyle} action-delete`

export const addStyle = `${primaryStyle} action-add`

export function Brand({ light = false, to = "/" }) {
  return (
    <Link
      to={to}
      aria-label={
        to === "/dashboard"
          ? "PESO employment services overview"
          : "PESO employment services home"
      }
      className={`inline-flex items-center gap-3 ${
        light ? "text-white" : "text-primary"
      }`}
    >
      <PesoMark className="brand-mark size-10 shrink-0" />
      <span className="text-2xl font-extrabold tracking-tight">
        PESO
        <span
          className={`block text-[11px] font-medium tracking-normal ${
            light ? "text-[#d5e4dc]" : "text-muted-foreground"
          }`}
        >
          Employment services
        </span>
      </span>
    </Link>
  )
}

export function Contact({ value, phone = false }) {
  if (!value) return <>Not provided</>

  const destination = phone
    ? String(value).replace(/[^+\d]/g, "")
    : String(value)

  const valid = phone
    ? /^\+?\d{7,15}$/.test(destination)
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)

  return valid ? (
    <a
      href={`${phone ? "tel" : "mailto"}:${
        phone
          ? destination
          : encodeURIComponent(destination).replaceAll("%40", "@")
      }`}
      className="underline underline-offset-4"
    >
      {value}
    </a>
  ) : (
    <>{value}</>
  )
}

export function Heading({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-primary sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, sample = false }) {
  const value = String(children || "").toLowerCase()

  const tone = sample
    ? "sample"
    : /unverified|not verified|unconfirmed|confirm intake|confirm availability|draft/.test(
          value,
        )
      ? "pending"
      : /completed|verified|placed|confirmed|published|employed|active|profile complete/.test(
            value,
          )
        ? "success"
        : /declined|rejected|error|failed/.test(value)
          ? "error"
          : /cancelled|withdrawn|closed|removed/.test(value)
            ? "neutral"
            : /pending|requested|review|offered|scheduled|progress/.test(value)
              ? "pending"
              : "info"

  return <span className={`status-badge status-${tone}`}>{children}</span>
}

export function Sample({ record }) {
  return record?.is_sample ? <Badge sample>Illustrative sample</Badge> : null
}

export function Source({ record }) {
  if (!record?.source_url) return null

  const checked = record.source_checked_at
    ? new Date(record.source_checked_at).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",

        month: "short",

        day: "numeric",

        year: "numeric",
      })
    : "Not checked"

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs leading-6 text-muted-foreground">
      <a
        href={record.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline underline-offset-4"
      >
        {record.source_name || "Official source"}
      </a>
      <span>Checked {checked}</span>
    </span>
  )
}

export function Notice({ children, error = false }) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-md border p-4 text-sm leading-6 ${
        error
          ? "border-[#e9c8c2] bg-error-surface text-error-ink"
          : "border-border bg-secondary text-primary"
      }`}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  )
}

export function Empty({ title = "No records yet", children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-[#b9c6bc] bg-card px-6 py-14 text-center">
      <h2 className="font-display text-2xl text-primary">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {children || "New records will appear here when they are submitted."}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ActionLink({ to, children, secondary = false }) {
  return (
    <Link to={to} className={secondary ? secondaryStyle : primaryStyle}>
      {children}
      <ArrowRight size={16} />
    </Link>
  )
}

export function Field({
  label,

  error,

  type = "text",

  options,

  value,

  onChange,

  required = true,

  ...rest
}) {
  const id = useId()

  const errorId = `${id}-error`

  const [localError, setLocalError] = useState("")

  const displayedError = error || localError

  function validate(input) {
    if (required && !String(input.value).trim()) return `${label} is required.`

    return input.validationMessage
  }

  const shared = {
    id,

    required,

    className: inputStyle,

    value: value ?? "",

    onChange: (e) => {
      onChange(e.target.value)

      if (localError) setLocalError(validate(e.target))
    },

    onBlur: (event) => setLocalError(validate(event.target)),

    onInvalid: (event) => setLocalError(validate(event.target)),

    ...rest,

    "aria-invalid": displayedError ? true : undefined,

    "aria-describedby":
      [rest["aria-describedby"], displayedError ? errorId : null]

        .filter(Boolean)

        .join(" ") || undefined,
  }

  return (
    <label htmlFor={id} className="block text-sm font-medium">
      <span className="mb-2 block">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-accent">
            *
          </span>
        )}
      </span>
      {options ? (
        <select {...shared}>
          <option value="" disabled hidden>
            Choose {label.toLowerCase()}
          </option>
          {options.map((o) => (
            <option
              key={typeof o === "string" ? o : o.value}
              value={typeof o === "string" ? o : o.value}
            >
              {typeof o === "string" ? human(o) : o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea {...shared} rows={4} />
      ) : (
        <input {...shared} type={type} />
      )}
      {displayedError && (
        <span id={errorId} className="mt-2 block text-xs text-error-ink">
          {[].concat(displayedError).join(" ")}
        </span>
      )}
    </label>
  )
}

export function Editor({
  title,

  fields,

  initial = {},

  onSave,

  onClose,

  help,

  submitLabel = "Save record",

  pendingLabel = "Saving…",
}) {
  const [values, setValues] = useState(initial)

  const [busy, setBusy] = useState(false)

  const submitting = useRef(false)

  const focusErrors = useRef(false)

  const [error, setError] = useState("")

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (focusErrors.current) {
      focusErrors.current = false

      document.querySelector('#record-editor [aria-invalid="true"]')?.focus()
    }
  }, [errors])

  useEffect(() => {
    const previous = document.activeElement

    const editor = document.getElementById("record-editor")

    editor

      ?.querySelector("input, select, textarea")

      ?.focus({ preventScroll: true })

    editor?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",

      block: "start",
    })

    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  async function submit(e) {
    e.preventDefault()

    if (submitting.current) return

    const form = e.currentTarget

    const blank = [
      ...form.querySelectorAll("input[required], textarea[required]"),
    ].find((input) => !input.value.trim())

    if (blank) {
      blank.focus()

      blank.dispatchEvent(new Event("invalid", { bubbles: false }))

      return
    }

    submitting.current = true

    setBusy(true)

    setError("")

    setErrors({})

    try {
      await onSave(values)

      onClose()
    } catch (e) {
      setError(e.message)

      focusErrors.current = true

      setErrors(e.errors || {})
    } finally {
      submitting.current = false

      setBusy(false)
    }
  }

  return (
    <section
      id="record-editor"
      aria-label={title}
      className="mb-8 scroll-mt-6 rounded-lg border border-[#bacbbe] bg-card p-5 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-primary">{title}</h2>
        <button
          aria-label="Close form"
          disabled={busy}
          onClick={onClose}
          className={secondaryStyle}
        >
          <X size={17} />
        </button>
      </div>
      {help && (
        <p className="mb-6 max-w-2xl text-sm leading-6 text-muted-foreground">
          {help}
        </p>
      )}
      <form
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) {
            event.preventDefault()

            onClose()
          }

          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()

            event.currentTarget.requestSubmit()
          }
        }}
        className="grid gap-5 sm:grid-cols-2"
      >
        {fields.map((f) => (
          <div
            key={f.name}
            className={f.type === "textarea" ? "sm:col-span-2" : ""}
          >
            <Field
              {...f}
              error={errors[f.name]}
              value={values[f.name]}
              disabled={busy}
              onChange={(v) => {
                setValues((s) => ({ ...s, [f.name]: v }))

                setErrors((current) => ({ ...current, [f.name]: undefined }))
              }}
            />
          </div>
        ))}
        {error && (
          <div className="sm:col-span-2">
            <Notice error>{error}</Notice>
          </div>
        )}
        <div className="flex flex-wrap gap-3 border-t border-border pt-5 sm:col-span-2">
          <button disabled={busy} className={addStyle}>
            {busy ? pendingLabel : submitLabel}
            <Check size={16} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className={`${secondaryStyle} action-cancel`}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
