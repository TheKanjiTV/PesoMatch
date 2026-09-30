import {
  useId,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type ButtonHTMLAttributes,
} from "react"
import { Link } from "react-router"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CircleCheck,
  Eye,
  EyeOff,
  FileCheck2,
  GraduationCap,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`relative flex size-10 shrink-0 items-center justify-center rounded-[10px] ${
          light ? "bg-white/10 text-white" : "bg-primary text-white"
        }`}
      >
        <GraduationCap size={25} strokeWidth={1.7} />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-accent text-[#0A2F6F]">
          <Check size={10} strokeWidth={3} />
        </span>
      </span>
      <span
        className={`text-[21px] font-bold tracking-[-0.6px] ${
          light ? "text-white" : "text-[#0A2F6F]"
        }`}
      >
        Scholar
        <span className={light ? "text-white" : "text-primary"}>Match</span>
        <span
          className={`mt-0.5 block text-[9px] font-medium tracking-[1.15px] ${
            light ? "text-blue-200" : "text-muted-foreground"
          }`}
        >
          SCHOLARSHIP ASSISTANCE PLATFORM
        </span>
      </span>
    </span>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: "primary" | "secondary"
}
export function AuthButton({
  children,
  loading,
  loadingText,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg border px-5 py-3 text-sm font-semibold transition duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:border-[#B8C5DB] disabled:bg-[#B8C5DB] disabled:text-white ${
        variant === "primary"
          ? "border-primary bg-primary text-white hover:border-[#0A2F6F] hover:bg-[#0A2F6F]"
          : "border-[#ced9ed] bg-white text-primary hover:border-primary hover:bg-secondary"
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

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  helper?: string
  error?: string
  icon?: LucideIcon
  prefix?: string
  success?: string
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
}: FieldProps) {
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
          <span aria-hidden="true" className="ml-1 text-[#8A94A6]">
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
              error ? "text-[#C92A2A]" : "text-[#8A94A6]"
            }`}
          />
        )}
        {prefix && (
          <span className="absolute left-0 top-0 flex h-12 items-center border-r border-[#D0D5DD] px-3 text-sm font-medium text-[#475467]">
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
          className={`h-12 w-full rounded-lg border bg-white text-base text-foreground outline-none transition placeholder:text-[#8A94A6] hover:border-[#98a6bb] focus:border-primary focus:ring-[3px] focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${
            Icon ? "pl-11" : prefix ? "pl-[66px]" : "pl-3.5"
          } ${password ? "pr-12" : "pr-3.5"} ${
            error
              ? "border-[#C92A2A] focus:border-[#C92A2A] focus:ring-[#C92A2A]/10"
              : "border-[#D0D5DD]"
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
              ? "text-[#C92A2A]"
              : success
                ? "text-[#278447]"
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

export function Alert({
  children,
  tone = "info",
}: {
  children: ReactNode
  tone?: "info" | "success" | "warning" | "error"
}) {
  const colors = {
    info: "border-[#dbe6f7] bg-secondary text-[#0A2F6F]",
    success: "border-[#d4eadb] bg-[#EAF7EE] text-[#216d3c]",
    warning: "border-[#eee1b1] bg-[#fff9e6] text-[#80600b]",
    error: "border-[#f3d0d0] bg-[#fff0f0] text-[#C92A2A]",
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
    test: (value: string) => value.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  { label: "One number", test: (value: string) => /[0-9]/.test(value) },
]
export function PasswordStrength({ password }: { password: string }) {
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
            score === 4 ? "text-[#278447]" : "text-[#475467]"
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
              rule.test(password) ? "text-[#278447]" : "text-muted-foreground"
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
    <aside className="relative hidden flex-col overflow-hidden bg-[#0A2F6F] px-10 py-9 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:min-h-[960px] xl:px-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-72 -left-56 size-[800px] rounded-full border border-white/[0.06]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 -left-48 size-[700px] rounded-full border border-white/[0.06]"
      />
      <Link
        to="/home"
        className="relative self-start"
        aria-label="ScholarMatch home"
      >
        <Logo light />
      </Link>
      <div className="relative my-auto py-14">
        <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold tracking-[1.8px] text-[#bdcff0]">
          <span className="size-1.5 rounded-full bg-accent" />
          YOUR NEXT CHAPTER STARTS HERE
        </div>
        <h2 className="max-w-[450px] text-[40px] font-bold leading-[1.2] tracking-[-0.6px] xl:text-[44px]">
          Your Scholarship
          <br />
          Journey Starts Here<span className="text-[#F4C430]">.</span>
        </h2>
        <p className="mt-5 max-w-[415px] text-base leading-7 text-[#c8d6ed]">
          Discover opportunities, check your possible eligibility, manage
          requirements, and follow your applications in one place.
        </p>
        <BrandPreview />
        <div className="mt-8 space-y-3.5">
          {[
            "Discover scholarship opportunities",
            "Receive personalized scholarship recommendations",
            "Check eligibility requirements before applying",
            "Track your application progress",
          ].map((text) => (
            <div
              key={text}
              className="flex items-start gap-2.5 text-[13px] leading-5 text-[#d9e4f5]"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Check size={11} className="text-[#b8dbce]" />
              </span>
              {text}
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex items-start gap-2.5 border-t border-white/10 pt-5 text-[11px] leading-5 text-[#b6c8e4]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#F4C430]" />
        <p>
          Technology to guide you. People to decide.
          <br />
          Final scholarship decisions remain with authorized personnel.
        </p>
      </div>
    </aside>
  )
}

function BrandPreview() {
  return (
    <div className="relative mt-8 pb-5">
      <div className="relative mr-7 rounded-xl border border-white/15 bg-white p-5 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[11px] font-semibold text-primary">
            <Sparkles size={14} />
            Recommended Scholarship
          </span>
          <span className="text-[8px] tracking-wider text-muted-foreground">
            SAMPLE
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="max-w-[200px] text-base font-semibold leading-6 text-[#0A2F6F]">
            Educational Assistance Program
          </h3>
          <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-bold text-primary">
            85% Match
          </span>
        </div>
        <div className="my-4 space-y-2">
          {[
            "Residency Matched",
            "Academic Requirement Matched",
            "Income Requirement Matched",
          ].map((text) => (
            <div
              key={text}
              className="flex items-center gap-2 text-[11px] text-[#475467]"
            >
              <Check size={12} className="text-[#278447]" />
              {text}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#278447]">
            <ShieldCheck size={13} />
            Potentially Eligible
          </span>
          <Link
            to="/home#why-match"
            className="inline-flex min-h-9 items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            View Match
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <div className="absolute -bottom-2 -right-1 flex items-center gap-3 rounded-lg border border-[#E4E7EC] bg-white px-3.5 py-3 text-foreground shadow-sm">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#EAF7EE] text-[#278447]">
          <FileCheck2 size={17} />
        </span>
        <div>
          <p className="text-[9px] font-medium text-muted-foreground">
            Requirements · Sample
          </p>
          <p className="mt-0.5 text-[11px] font-semibold">4 of 5 Complete</p>
        </div>
        <div className="ml-1 flex size-7 items-center justify-center rounded-full border-[3px] border-[#cbe7d4] text-[8px] font-semibold text-[#278447]">
          80%
        </div>
      </div>
    </div>
  )
}

export function AuthLayout({
  children,
  centered = false,
  wide = false,
}: {
  children: ReactNode
  centered?: boolean
  wide?: boolean
}) {
  return (
    <div
      className={
        centered
          ? "min-h-dvh bg-[#F7F9FC]"
          : "min-h-dvh bg-white lg:grid lg:grid-cols-[44%_56%]"
      }
    >
      {!centered && <BrandPanel />}
      <div
        className={`flex min-h-dvh flex-col ${
          centered ? "mx-auto max-w-[1440px]" : "min-w-0"
        }`}
      >
        <header
          className={`flex items-center justify-between gap-4 px-5 py-6 sm:px-10 ${
            centered ? "lg:px-14" : "lg:px-12"
          }`}
        >
          <Link
            to="/home"
            className={`min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary ${
              centered ? "hidden sm:inline-flex" : "hidden lg:inline-flex"
            }`}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link
            to="/home"
            aria-label="ScholarMatch home"
            className={
              centered
                ? "sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                : "lg:hidden"
            }
          >
            <Logo />
          </Link>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <LockKeyhole size={13} />
            Account access
          </span>
          <Link
            to="/home"
            aria-label="Back to Home"
            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary sm:hidden"
          >
            <ArrowLeft size={20} />
          </Link>
        </header>
        <main
          id="auth-main"
          className={`flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 ${
            centered ? "items-center lg:py-12" : "lg:px-12 lg:py-10"
          }`}
        >
          <div
            className={`mx-auto w-full ${
              wide ? "max-w-[580px]" : "max-w-[456px]"
            } ${
              centered
                ? "rounded-2xl border border-border bg-white p-6 shadow-[0_4px_18px_rgba(16,24,40,0.03)] sm:p-10"
                : ""
            }`}
          >
            {children}
          </div>
        </main>
        <footer className="px-5 pb-6 pt-5 sm:px-10">
          <div className="mx-auto flex max-w-[580px] flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground">
            <span>© 2026 ScholarMatch</span>
            <span className="flex gap-5">
              <Link className="hover:text-primary" to="/privacy">
                Privacy Policy
              </Link>
              <Link className="hover:text-primary" to="/terms">
                Terms of Use
              </Link>
              <Link className="hover:text-primary" to="/home#help">
                Help Center
              </Link>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export function FormHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow: string
  title: string
  description: string
  center?: boolean
}) {
  return (
    <div className={`mb-7 ${center ? "text-center" : ""}`}>
      <p className="mb-3 text-[10px] font-semibold tracking-[1.8px] text-primary">
        {eyebrow}
      </p>
      <h1 className="text-[32px] font-bold leading-[1.23] tracking-[-0.55px] text-[#0A2F6F] sm:text-[34px]">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
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
          Your account information is intended only for ScholarMatch services
          and scholarship application processes.
        </p>
      </div>
      <p className="mt-3 text-[10px] leading-5 text-[#667085]">
        Interactive preview only. No credentials are sent or stored, and no real
        emails are sent.
      </p>
    </div>
  )
}

export function StateIcon({
  type = "email",
}: {
  type?: "email" | "success" | "lock" | "welcome"
}) {
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
          ? "bg-[#EAF7EE] text-[#278447]"
          : "bg-secondary text-primary"
      }`}
    >
      <Icon size={32} strokeWidth={1.6} />
      {type === "email" && (
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-[3px] border-white bg-primary text-white">
          <Check size={12} />
        </span>
      )}
    </div>
  )
}

export function AccountProgress({
  verified = true,
  profile = false,
}: {
  verified?: boolean
  profile?: boolean
}) {
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
          name: "Applicant Profile",
          complete: profile,
          detail: profile ? "Completed" : "Next step · 0%",
        },
        {
          name: "Scholarship Recommendations",
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
                ? "bg-[#EAF7EE] text-[#278447]"
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
                step.complete ? "text-[#278447]" : "text-muted-foreground"
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
