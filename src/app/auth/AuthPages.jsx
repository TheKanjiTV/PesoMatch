import { legalNotices } from "./legal.js"
import { OfficialHelp } from "./OfficialHelp.jsx"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { Link, Outlet, useLocation, useNavigate } from "react-router"

import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import { exitPanel } from "../motion.js"

import { destinationFor, useAuth } from "../../context/AuthContext.jsx"
import { LogoLoading } from "../../platform/LoadingStates.jsx"
import { withMinimumLoading } from "../../platform/loading.js"

import {
  Alert,
  AuthButton,
  AuthLayout,
  BackToLogin,
  Field,
  FormHeading,
  PasswordStrength,
  StateIcon,
  TrustNote,
  passwordRules,
} from "./components"

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const validPhone = (value) => /^9\d{9}$/.test(value.replace(/\D/g, ""))

const strongPassword = (value) =>
  passwordRules.every((rule) => rule.test(value))

const formatPhone = (value) =>
  value

    .replace(/\D/g, "")

    .slice(0, 10)

    .replace(/(\d{3})(\d{1,3})?(\d{1,4})?/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" "),
    )

function subscribeNameLayout(callback) {
  const query = window.matchMedia("(min-width: 640px)")

  query.addEventListener("change", callback)

  return () => query.removeEventListener("change", callback)
}

export function AuthRoutesLayout() {
  const { pathname } = useLocation()

  const mainRef = useRef(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })

    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <a
        href="#auth-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-primary px-5 py-3 text-white focus:translate-y-0"
      >
        Skip to form
      </a>
      <div ref={mainRef} tabIndex={-1} className="outline-none">
        <Outlet />
      </div>
    </>
  )
}

function useTitle(title) {
  useEffect(() => {
    document.title = `${title} | PESO Employment Services`
  }, [title])
}

function usePanelNavigation() {
  const navigate = useNavigate()

  const panelRef = useRef(null)

  async function continueTo(onboarding, user) {
    await exitPanel(panelRef.current)

    navigate(destinationFor(onboarding, user), {
      replace: true,

      state: { authTransition: true },
    })
  }

  return { panelRef, continueTo }
}

export function LoginPage({ staffPortal = false }) {
  useTitle(staffPortal ? "PESO Staff & Partner Sign In" : "Log In")

  const { login } = useAuth()

  const { panelRef, continueTo } = usePanelNavigation()

  const location = useLocation()

  const [email, setEmail] = useState(location.state?.registeredEmail || "")

  const [password, setPassword] = useState("")

  const [touched, setTouched] = useState({})

  const [error, setError] = useState("")

  const [busy, setBusy] = useState(false)

  const emailError = touched.email
    ? !email.trim()
      ? "This field is required."
      : !validEmail(email)
        ? "Enter a valid email address."
        : ""
    : ""

  const passwordError =
    touched.password && !password ? "This field is required." : ""

  async function submit(event) {
    event.preventDefault()

    if (busy) return

    setTouched({ email: true, password: true })

    setError("")

    if (!validEmail(email) || !password) {
      event.currentTarget

        .querySelector(
          !validEmail(email)
            ? 'input[type="email"]'
            : 'input[type="password"], input[autocomplete="current-password"]',
        )

        ?.focus()

      return
    }

    setBusy(true)

    try {
      const session = await withMinimumLoading(() =>
        login({
          email: email.trim(),
          password,
          website: new FormData(event.currentTarget).get("website") || "",
        }),
      )

      await continueTo(session.onboarding, session.user)
    } catch (failure) {
      setError(failure.message || "We couldn't sign you in. Please try again.")

      setBusy(false)
    }
  }

  return (
    <>
      {busy && <LogoLoading fullScreen label="Signing in…" />}
      <div inert={busy} aria-hidden={busy || undefined}>
        <AuthLayout
          panelRef={panelRef}
          enter={location.state?.registrationComplete}
        >
          <FormHeading
            eyebrow="WELCOME BACK"
            title={staffPortal ? "Your service desk awaits." : "Welcome back."}
            description={
              staffPortal
                ? "Sign in to coordinate PESO services, employer referrals or training enrollment. Your assigned role opens the appropriate workspace."
                : "Log in to manage your job opportunities, training recommendations, and PESO referrals."
            }
          />
          {location.state?.registrationComplete && (
            <div className="mb-5">
              <Alert tone="success">
                Account created. Log in to build your jobseeker profile. Email
                verification is not enabled in this development version.
              </Alert>
            </div>
          )}
          <form noValidate onSubmit={submit} className="space-y-5">
            <div hidden aria-hidden="true">
              <label>
                Leave this field empty
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <Field
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)

                setError("")
              }}
              onBlur={() =>
                setTouched((current) => ({ ...current, email: true }))
              }
              error={emailError}
              disabled={busy}
            />
            <Field
              label="Password"
              type="password"
              icon={LockKeyhole}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)

                setError("")
              }}
              onBlur={() =>
                setTouched((current) => ({ ...current, password: true }))
              }
              error={passwordError}
              disabled={busy}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Jobseeker, PESO & partner account access
              </span>
              <Link
                className="flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
                to="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <AuthButton
              type="submit"
              loading={busy}
              loadingText="Signing in..."
            >
              Log In
              <ArrowRight size={17} />
            </AuthButton>
          </form>
          {staffPortal ? (
            <div className="mt-7 space-y-3 border-t border-border pt-5 text-sm leading-7 text-muted-foreground">
              <p>
                Administrators and PESO employees use the same secure sign-in.
                Access is assigned by an administrator; roles cannot be selected
                at sign-in.
              </p>
              <Link
                className="font-semibold text-primary underline"
                to="/login"
              >
                Jobseeker sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-7 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  className="ml-1 inline-flex min-h-9 items-center font-semibold text-primary hover:underline"
                  viewTransition
                  onClick={() => {
                    document.documentElement.dataset.pageTransition = "forward"
                  }}
                  to="/register"
                >
                  Create Account
                </Link>
              </p>
              <p className="mt-3 text-center text-sm">
                <Link
                  to="/staff/login"
                  className="inline-flex min-h-11 items-center font-semibold text-primary underline"
                >
                  PESO staff & partner sign in
                </Link>
              </p>
            </>
          )}
          <TrustNote />
        </AuthLayout>
      </div>
    </>
  )
}

export function RegisterPage() {
  useTitle("Create Account")

  const { register } = useAuth()

  const panelRef = useRef(null)

  const navigate = useNavigate()

  const [values, setValues] = useState({
    first: "",

    middle: "",

    last: "",

    email: "",

    phone: "",

    password: "",

    confirm: "",
  })

  const [terms, setTerms] = useState(false)

  const [touched, setTouched] = useState({})

  const [busy, setBusy] = useState(false)

  const [serverError, setServerError] = useState("")

  const [serverErrors, setServerErrors] = useState({})

  const wideNames = useSyncExternalStore(
    subscribeNameLayout,

    () => window.matchMedia("(min-width: 640px)").matches,

    () => true,
  )

  const nameOrder = wideNames
    ? ["first", "last", "middle"]
    : ["first", "middle", "last"]

  const change = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))

    setServerError("")

    setServerErrors((current) => ({ ...current, [name]: undefined }))
  }

  const blur = (name) => setTouched((current) => ({ ...current, [name]: true }))

  const error = (name) => {
    if (serverErrors[name]) return serverErrors[name]

    if (!touched[name] || name === "middle") return ""

    if (!values[name].trim()) return "This field is required."

    if (name === "email" && !validEmail(values.email))
      return "Enter a valid email address."

    if (name === "phone" && !validPhone(values.phone))
      return "Enter a valid Philippine mobile number."

    if (name === "confirm" && values.confirm !== values.password)
      return "Passwords do not match."

    if (name === "password" && !strongPassword(values.password))
      return "Meet all four password requirements."

    return ""
  }

  const valid =
    !!values.first.trim() &&
    !!values.last.trim() &&
    validEmail(values.email) &&
    validPhone(values.phone) &&
    strongPassword(values.password) &&
    values.password === values.confirm &&
    terms

  async function submit(event) {
    event.preventDefault()

    if (!valid || busy) return

    setBusy(true)

    setServerError("")

    setServerErrors({})

    try {
      await register({
        first_name: values.first.trim(),

        middle_name: values.middle.trim() || null,

        last_name: values.last.trim(),

        email: values.email.trim(),

        mobile_number: `+63${values.phone.replace(/\D/g, "")}`,

        password: values.password,

        password_confirmation: values.confirm,
        terms_accepted: terms,
        website: new FormData(event.currentTarget).get("website") || "",
      })

      await exitPanel(panelRef.current)

      document.documentElement.dataset.pageTransition = "forward"

      navigate("/login", {
        replace: true,

        viewTransition: true,

        state: {
          registrationComplete: true,

          registeredEmail: values.email.trim(),
        },
      })
    } catch (failure) {
      const fields = {
        first_name: "first",

        middle_name: "middle",

        last_name: "last",

        email: "email",

        mobile_number: "phone",

        password: "password",

        password_confirmation: "confirm",
      }

      setServerErrors(
        Object.fromEntries(
          Object.entries(failure.errors || {}).map(([key, messages]) => [
            fields[key] || key,

            Array.isArray(messages) ? messages[0] : messages,
          ]),
        ),
      )

      setServerError(
        failure.message ||
          "We couldn't create your account. Your entries are still here; please try again.",
      )

      setBusy(false)
    }
  }

  return (
    <AuthLayout panelRef={panelRef}>
      <FormHeading
        eyebrow="GET STARTED"
        title="Create your account."
        description="Create a jobseeker account to start discovering job opportunities."
      />

      <form noValidate onSubmit={submit} className="space-y-5">
        <div hidden aria-hidden="true">
          <label>
            Leave this field empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {nameOrder.map((name) => (
            <Field
              key={name}
              label={
                name === "middle" ? (
                  <span>
                    Middle Name{" "}
                    <span className="font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </span>
                ) : name === "first" ? (
                  "First Name"
                ) : (
                  "Last Name"
                )
              }
              placeholder={
                name === "middle"
                  ? "Enter middle name"
                  : `Enter your ${name} name`
              }
              autoComplete={
                name === "first"
                  ? "given-name"
                  : name === "last"
                    ? "family-name"
                    : "additional-name"
              }
              required={name !== "middle"}
              value={values[name]}
              onChange={(event) => change(name, event.target.value)}
              onBlur={() => blur(name)}
              error={error(name)}
              disabled={busy}
              className={name === "middle" ? "sm:col-span-2" : undefined}
            />
          ))}
        </div>
        <Field
          label="Email Address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          helper="Use this email to sign in to your PesoMatch account."
          required
          value={values.email}
          onChange={(event) => change("email", event.target.value)}
          onBlur={() => blur("email")}
          error={error("email")}
          disabled={busy}
        />
        <Field
          label="Mobile Number"
          type="tel"
          prefix="+63"
          autoComplete="tel-national"
          inputMode="numeric"
          placeholder="9XX XXX XXXX"
          helper="Enter 10 digits starting with 9. The +63 country code is already included."
          required
          value={values.phone}
          onChange={(event) => change("phone", formatPhone(event.target.value))}
          onBlur={() => blur("phone")}
          error={error("phone")}
          disabled={busy}
        />
        <Field
          label="Create Password"
          type="password"
          icon={LockKeyhole}
          autoComplete="new-password"
          placeholder="Create a password"
          required
          value={values.password}
          onChange={(event) => change("password", event.target.value)}
          onBlur={() => blur("password")}
          error={error("password")}
          disabled={busy}
        />
        <PasswordStrength password={values.password} />
        <Field
          label="Confirm Password"
          type="password"
          icon={LockKeyhole}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          value={values.confirm}
          onChange={(event) => change("confirm", event.target.value)}
          onBlur={() => blur("confirm")}
          error={error("confirm")}
          success={
            values.confirm && values.confirm === values.password
              ? "Passwords match"
              : undefined
          }
          disabled={busy}
        />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-[13px] leading-6 text-muted-foreground">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            required
            disabled={busy}
            className="mt-1 size-[18px] shrink-0 accent-primary"
          />
          <span>
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline underline-offset-4"
            >
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <AuthButton
          type="submit"
          disabled={!valid}
          loading={busy}
          loadingText="Creating Account..."
        >
          Create Account
          <ArrowRight size={17} />
        </AuthButton>
        <p className="text-xs leading-5 text-muted-foreground">
          Your five-step jobseeker profile comes next. You can save each step
          and return later.
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          viewTransition
          onClick={() => {
            document.documentElement.dataset.pageTransition = "forward"
          }}
          to="/login"
          className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
        >
          Log In
        </Link>
      </p>
      <TrustNote />
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  useTitle("Password Recovery")

  return (
    <AuthLayout centered>
      <StateIcon type="lock" />
      <FormHeading
        center
        title="Password recovery"
        description="Password recovery isn't available in this development version yet."
      />
      <Alert>
        No reset email has been sent. If you remember your password, return to
        login. Otherwise, contact the person managing your PesoMatch
        installation.
      </Alert>
      <BackToLogin />
    </AuthLayout>
  )
}

export function VerificationPage() {
  useTitle("Email Verification")

  const { user, onboarding } = useAuth()

  return (
    <AuthLayout centered>
      <StateIcon type="email" />
      <FormHeading
        center
        title="Account next steps"
        description="Email verification is not enabled in this development version. No verification email has been sent."
      />
      {user ? (
        <Link
          to={destinationFor(onboarding)}
          className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white"
        >
          Continue to your profile <ArrowRight size={16} className="ml-2" />
        </Link>
      ) : (
        <BackToLogin />
      )}
    </AuthLayout>
  )
}

export function LegalPage() {
  const { pathname } = useLocation()
  const notice = legalNotices[pathname] || legalNotices["/privacy"]
  useTitle(notice.title)
  return (
    <AuthLayout centered wide>
      <FormHeading
        eyebrow="TRANSPARENCY MATTERS"
        title={notice.title}
        description="Implementation-based draft. Operator approval and legal review required before public launch."
      />
      <nav
        aria-label="Legal notices"
        className="mb-6 flex flex-wrap gap-4 text-sm font-semibold text-primary"
      >
        <Link className="min-h-11 content-center underline" to="/privacy">
          Privacy Policy
        </Link>
        <Link className="min-h-11 content-center underline" to="/terms">
          Terms of Use
        </Link>
        <Link className="min-h-11 content-center underline" to="/cookies">
          Cookie Policy
        </Link>
        <Link className="min-h-11 content-center underline" to="/help">
          Help & official contacts
        </Link>
      </nav>
      <div className="space-y-6 text-sm leading-7 text-muted-foreground">
        {notice.sections.map(([heading, text]) => (
          <section key={heading}>
            <h2 className="mb-2 text-base font-semibold text-primary">
              {heading}
            </h2>
            <p>{text}</p>
          </section>
        ))}
        {pathname === "/privacy" && (
          <p>
            <a
              className="font-semibold text-primary underline"
              href="https://privacy.gov.ph/data-subject-rights/"
              target="_blank"
              rel="noopener noreferrer"
            >
              National Privacy Commission: data subject rights
            </a>
          </p>
        )}
      </div>
      <BackToLogin />
    </AuthLayout>
  )
}

export function HelpPage() {
  useTitle("Help & official contacts")
  return (
    <AuthLayout centered wide>
      <FormHeading
        title="Help & official contacts"
        description="Find nationwide employment, training and privacy guidance through official sources."
      />
      <OfficialHelp />
      <BackToLogin />
    </AuthLayout>
  )
}

export function NotFoundPage() {
  useTitle("Page Not Found")

  const navigate = useNavigate()
  const { user, onboarding } = useAuth()

  return (
    <AuthLayout centered>
      <StateIcon type="welcome" />
      <FormHeading
        center
        eyebrow="LET'S FIND YOUR WAY"
        title="Page Not Found"
        description="This page isn't available. Return to your employment services or explore PesoMatch."
      />
      <AuthButton
        onClick={() =>
          navigate(user ? destinationFor(onboarding, user) : "/login")
        }
      >
        {user ? "Return to your services" : "Return to Login"}
        <ArrowRight size={16} />
      </AuthButton>
      <Link
        to="/home"
        className="mt-4 flex min-h-11 items-center justify-center text-sm font-medium text-primary"
      >
        Back to Home
      </Link>
    </AuthLayout>
  )
}
