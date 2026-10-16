import { useId, useState } from "react"

import { Link } from "react-router"
import { Brand } from "../../platform/ui.jsx"
import { AppearanceControls } from "../../platform/Appearance.jsx"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CircleCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"

export function Logo() {
  return <Brand />
}

export function AuthButton({
  children,

  loading,

  loadingText,

  variant = "primary",

  className = "",

  disabled,

  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg border px-5 py-3 text-sm font-semibold transition duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:border-border disabled:bg-[#e8ecf4] disabled:text-[#697386] ${
        variant === "primary"
          ? "peso-primary border-primary bg-primary text-primary-foreground"
          : "border-[#ced9ed] bg-card text-primary hover:border-primary hover:bg-secondary"
      } ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            size={17}
            className="animate-spin motion-reduce:animate-none"
          />
          {loadingText || "Please wait..."}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function Field({
  label,

  helper,

  error,

  icon: Icon,

  prefix,

  success,

  type = "text",

  id: providedId,

  className = "",

  ...props
}) {
  const generatedId = useId()

  const id = providedId || generatedId

  const [visible, setVisible] = useState(false)

  const password = type === "password"

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
        {props.required && (
          <span aria-hidden="true" className="ml-1 text-muted-foreground">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
            className={`pointer-events-none absolute left-3.5 top-3.5 ${
              error ? "text-error-ink" : "text-muted-foreground"
            }`}
          />
        )}
        {prefix && (
          <span className="absolute left-0 top-0 flex h-12 items-center border-r border-[#dfe4ee] px-3 text-sm font-medium text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          {...props}
          id={id}
          type={password && visible ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={
            error || success || helper ? `${id}-message` : undefined
          }
          className={`h-12 w-full rounded-lg border bg-card text-base text-foreground outline-none transition placeholder:text-[#8a94a6] hover:border-[#98a6bb] focus:border-primary focus:ring-[3px] focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${
            Icon ? "pl-11" : prefix ? "pl-[66px]" : "pl-3.5"
          } ${password ? "pr-12" : "pr-3.5"} ${
            error
              ? "border-[#C92A2A] focus:border-[#C92A2A] focus:ring-[#C92A2A]/10"
              : "border-[#dfe4ee]"
          }`}
        />
        {password && (
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => setVisible(!visible)}
            aria-label={`${visible ? "Hide" : "Show"} ${
              typeof label === "string" ? label.toLowerCase() : "password"
            }`}
            aria-pressed={visible}
            className="absolute right-0.5 top-0.5 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {(error || helper || success) && (
        <p
          id={`${id}-message`}
          className={`mt-2 flex items-start gap-1.5 text-[13px] leading-5 ${
            error
              ? "text-error-ink"
              : success
                ? "text-success-ink"
                : "text-muted-foreground"
          }`}
        >
          {error ? (
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          ) : success ? (
            <Check size={14} className="mt-0.5 shrink-0" />
          ) : null}
          {error || success || helper}
        </p>
      )}
    </div>
  )
}

export function Alert({ children, tone = "info" }) {
  const colors = {
    info: "border-[#dce2ff] bg-secondary text-info-ink",

    success: "border-[#d4eadb] bg-success-surface text-success-ink",

    warning: "border-[#eee1b1] bg-pending-surface text-pending-ink",

    error: "border-[#f3d0d0] bg-error-surface text-error-ink",
  }

  const Icon =
    tone === "error" || tone === "warning"
      ? TriangleAlert
      : tone === "success"
        ? CircleCheck
        : Info

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-2.5 rounded-lg border p-3.5 text-[13px] leading-5 ${colors[tone]}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export const passwordRules = [
  {
    label: "At least 8 characters",

    test: (value) => value.length >= 8,
  },

  {
    label: "One uppercase letter",

    test: (value) => /[A-Z]/.test(value),
  },

  {
    label: "One lowercase letter",

    test: (value) => /[a-z]/.test(value),
  },

  { label: "One number", test: (value) => /[0-9]/.test(value) },
]

export function PasswordStrength({ password }) {
  const score = passwordRules.filter((rule) => rule.test(password)).length

  const name =
    score === 4
      ? "Strong"
      : score === 3
        ? "Good"
        : score === 2
          ? "Fair"
          : "Weak"

  const color =
    score === 4
      ? "bg-[#278447]"
      : score === 3
        ? "bg-primary"
        : score === 2
          ? "bg-[#c79c23]"
          : "bg-[#C92A2A]"

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={`font-medium ${
            score === 4 ? "text-success-ink" : "text-muted-foreground"
          }`}
        >
          {password ? name : "Not entered"}
        </span>
      </div>
      <div
        className="flex gap-1.5"
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={password ? score : 0}
        aria-valuetext={password ? name : "Not entered"}
      >
        {[1, 2, 3, 4].map((value) => (
          <div
            key={value}
            className={`h-1 flex-1 rounded-full ${
              password && value <= score ? color : "bg-[#E4E7EC]"
            }`}
          />
        ))}
      </div>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {passwordRules.map((rule) => (
          <div
            key={rule.label}
            className={`flex items-center gap-2 text-[13px] ${
              rule.test(password) ? "text-success-ink" : "text-muted-foreground"
            }`}
          >
            {rule.test(password) ? (
              <CircleCheck size={14} className="shrink-0" />
            ) : (
              <span className="size-3.5 shrink-0 rounded-full border border-[#B5BDCA]" />
            )}
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <aside className="auth-brand-panel hidden bg-[#123d35] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-[680px] lg:flex-col lg:px-12 lg:py-10">
      <Brand light />
      <div className="my-auto py-20">
        <h2 className="max-w-md font-display text-5xl leading-[1.15]">
          A clear path.
          <br />A supported journey.
        </h2>
        <p className="mt-7 max-w-sm text-sm leading-8 text-[#d5e4dc]">
          Register your profile, explore work and training, and stay connected
          with PESO before and after placement.
        </p>
        <ol className="mt-10 space-y-5 border-t border-white/25 pt-7">
          {[
            "Build your jobseeker profile",
            "Explore vacancies & upskilling",
            "Get guidance & referrals",
            "Stay connected after placement",
          ].map((s, i) => (
            <li key={s} className="flex items-center gap-4 text-sm">
              <span className="grid size-7 place-items-center rounded-full border border-white/30 text-xs">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <p className="max-w-md text-xs leading-6 text-[#d5e4dc]">
        AI-Powered Employment Facilitation Platform for Public Employment
        Service Office (PESO)
      </p>
    </aside>
  )
}

export function AuthLayout({
  children,

  centered = false,

  wide = false,

  panelRef,

  enter = false,
}) {
  return (
    <div
      className={
        centered
          ? "min-h-dvh bg-background"
          : "min-h-dvh bg-card lg:grid lg:grid-cols-[43%_57%]"
      }
    >
      {!centered && <BrandPanel />}
      <div
        className={`flex min-h-dvh flex-col ${
          centered ? "mx-auto max-w-[1440px]" : "min-w-0"
        }`}
      >
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10 lg:px-12">
          <Link
            to="/"
            viewTransition
            onClick={() => {
              document.documentElement.dataset.pageTransition = "back"
            }}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <AppearanceControls compact />
        </header>
        <main
          id="auth-main"
          className={`flex flex-1 flex-col justify-center px-5 py-6 sm:px-10 ${
            centered ? "items-center lg:py-12" : "lg:px-12 lg:py-8"
          }`}
        >
          <div
            ref={panelRef}
            className={`mx-auto w-full ${
              wide ? "max-w-[640px]" : "max-w-[480px]"
            } ${enter ? "auth-flow-enter" : ""} ${
              centered
                ? "rounded-xl bg-card p-6 shadow-[0_8px_40px_#2454410a] sm:p-10"
                : ""
            }`}
          >
            {children}
          </div>
        </main>
        <footer className="px-5 pb-6 pt-5 sm:px-10">
          <div className="mx-auto flex max-w-[640px] flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} PesoMatch</span>
            <span className="flex flex-wrap gap-4">
              <Link className="hover:text-primary" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-primary" to="/terms">
                Terms of Use
              </Link>
              <Link className="hover:text-primary" to="/cookies">
                Cookies
              </Link>
              <Link className="hover:text-primary" to="/help">
                Help Center
              </Link>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function FormHeading({ title, description, center = false, eyebrow }) {
  return (
    <div className={`mb-7 ${center ? "text-center" : ""}`}>
      <h1 className="font-display text-[30px] leading-[1.25] tracking-tight text-primary sm:text-[36px]">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function TrustNote() {
  return (
    <div className="mt-7 border-t border-border pt-5">
      <div className="flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>
          Your account information is intended only for PesoMatch services and
          employment assistance processes.
        </p>
      </div>
    </div>
  )
}

export function StateIcon({ type = "email" }) {
  const Icon =
    type === "email"
      ? Mail
      : type === "success"
        ? CheckCheck
        : type === "lock"
          ? LockKeyhole
          : GraduationCap

  return (
    <div
      className={`relative mx-auto mb-6 flex size-[72px] items-center justify-center rounded-2xl ${
        type === "success"
          ? "bg-success-surface text-success-ink"
          : "bg-secondary text-primary"
      }`}
    >
      <Icon size={32} strokeWidth={1.6} />
      {type === "email" && (
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-[3px] border-white bg-primary text-primary-foreground">
          <Check size={12} />
        </span>
      )}
    </div>
  )
}

export function AccountProgress({ verified = true, profile = false }) {
  return (
    <ol className="my-6 divide-y divide-border rounded-xl border border-border px-4">
      {[
        { name: "Account Created", complete: true, detail: "Completed" },

        {
          name: "Email Verification",

          complete: verified,

          detail: verified ? "Completed" : "Awaiting verification",
        },

        {
          name: "Jobseeker Profile",

          complete: profile,

          detail: profile ? "Completed" : "Next step · 0%",
        },

        {
          name: "Job & Training Recommendations",

          complete: false,

          detail: profile
            ? "Available in the live platform"
            : "Available after profile setup",
        },
      ].map((step, index) => (
        <li key={step.name} className="flex items-center gap-3 py-3.5">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
              step.complete
                ? "bg-success-surface text-success-ink"
                : index === 2 && verified
                  ? "bg-secondary text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step.complete ? (
              <Check size={14} />
            ) : index === 3 ? (
              <LockKeyhole size={12} />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </span>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-1">
            <span className="text-[13px] font-medium">{step.name}</span>
            <span
              className={`text-[11px] ${
                step.complete ? "text-success-ink" : "text-muted-foreground"
              }`}
            >
              {step.detail}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function BackToLogin() {
  return (
    <Link
      to="/login"
      className="mt-5 flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
    >
      <ArrowLeft size={15} />
      Back to Login
    </Link>
  )
}
