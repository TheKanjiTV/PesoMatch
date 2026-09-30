import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  MapPin,
  School,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react"
import {
  AccountProgress,
  Alert,
  AuthButton,
  AuthLayout,
  BackToLogin,
  Field,
  FormHeading,
  Logo,
  PasswordStrength,
  StateIcon,
  TrustNote,
  passwordRules,
} from "./components"

interface DemoState {
  email: string
  firstName: string
  accountCreated: boolean
  verified: boolean
  profileComplete: boolean
}
interface DemoContextValue {
  account: DemoState
  updateAccount: (updates: Partial<DemoState>) => void
}
const initialAccount: DemoState = {
  email: "student@example.com",
  firstName: "Student",
  accountCreated: false,
  verified: false,
  profileComplete: false,
}
const DemoContext = createContext<DemoContextValue>({
  account: initialAccount,
  updateAccount: () => {},
})
const validEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const validPhone = (value: string) =>
  /^9\d{9}$/.test(value.replace(/[\s-]/g, ""))
const strongPassword = (value: string) =>
  passwordRules.every((rule) => rule.test(value))
const pause = () =>
  new Promise<void>((resolve) => window.setTimeout(resolve, 800))

function subscribeNameLayout(callback: () => void) {
  const query = window.matchMedia("(min-width: 640px)")
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

export function DemoProvider() {
  const [account, setAccount] = useState(initialAccount)
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])
  return (
    <DemoContext.Provider
      value={{
        account,
        updateAccount: (updates) =>
          setAccount((current) => ({ ...current, ...updates })),
      }}
    >
      <a
        href="#auth-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-primary px-5 py-3 text-white focus:translate-y-0"
      >
        Skip to form
      </a>
      <div ref={mainRef} tabIndex={-1} className="outline-none">
        <Outlet />
      </div>
    </DemoContext.Provider>
  )
}

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ScholarMatch`
  }, [title])
}

export function LoginPage() {
  useTitle("Log In")
  const navigate = useNavigate()
  const { updateAccount } = useContext(DemoContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setError("")
    if (!validEmail(email) || !password) {
      event.currentTarget
        .querySelector<HTMLInputElement>(
          !validEmail(email)
            ? 'input[type="email"]'
            : 'input[type="password"], input[autocomplete="current-password"]',
        )
        ?.focus()
      return
    }
    setBusy(true)
    await pause()
    if (password.length < 8 || email.toLowerCase() === "error@example.com") {
      setError("Incorrect email address or password.")
      setBusy(false)
      return
    }
    updateAccount({ email: email.trim(), accountCreated: true, verified: true })
    navigate("/dashboard")
  }
  return (
    <AuthLayout>
      <FormHeading
        eyebrow="WELCOME BACK"
        title="Welcome Back to ScholarMatch"
        description="Log in to manage your scholarship opportunities and applications."
      />
      <form noValidate onSubmit={submit} className="space-y-5">
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
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
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
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-[#475467]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded border-[#D0D5DD] accent-[#1246A3]"
              disabled={busy}
            />
            Remember me
          </label>
          <Link
            className="flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
            to="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <AuthButton type="submit" loading={busy} loadingText="Signing In...">
          Log In
          <ArrowRight size={17} />
        </AuthButton>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          className="ml-1 inline-flex min-h-9 items-center font-semibold text-primary hover:underline"
          to="/register"
        >
          Create Account
        </Link>
      </p>
      <div className="mt-6 rounded-lg bg-[#F7F9FC] px-4 py-3.5 text-center">
        <p className="text-xs font-medium text-[#475467]">
          Scholarship Coordinator or Administrator?
        </p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Log in using your authorized account.
          <br />
          Your assigned account determines your dashboard.
        </p>
      </div>
      <TrustNote />
    </AuthLayout>
  )
}

export function RegisterPage() {
  useTitle("Create Account")
  const navigate = useNavigate()
  const { updateAccount } = useContext(DemoContext)
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
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const wideNames = useSyncExternalStore(
    subscribeNameLayout,
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  )
  const nameOrder: ("first" | "middle" | "last")[] = wideNames
    ? ["first", "last", "middle"]
    : ["first", "middle", "last"]
  const change = (name: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
    setDuplicate(false)
  }
  const blur = (name: string) =>
    setTouched((current) => ({ ...current, [name]: true }))
  const error = (name: keyof typeof values) => {
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
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    await pause()
    if (values.email.toLowerCase() === "existing@example.com") {
      setDuplicate(true)
      setBusy(false)
      return
    }
    updateAccount({
      email: values.email.trim(),
      firstName: values.first.trim(),
      accountCreated: true,
      verified: false,
      profileComplete: false,
    })
    navigate("/verify-email")
  }
  return (
    <AuthLayout>
      <FormHeading
        eyebrow="GET STARTED"
        title="Create Your ScholarMatch Account"
        description="Create an applicant account to start discovering scholarship opportunities."
      />
      <div className="mb-6">
        <Alert>
          <p className="mb-1 font-semibold">Student Applicant Registration</p>
          Public registration is for scholarship applicants. Authorized
          coordinators and administrators use accounts provided by the system
          administrator.
        </Alert>
      </div>
      <form noValidate onSubmit={submit} className="space-y-5">
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
          helper="We'll use this email for account verification and application notifications."
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
          inputMode="tel"
          placeholder="9XX XXX XXXX"
          helper="Used for account and scholarship-related notifications when applicable."
          required
          value={values.phone}
          onChange={(event) => change("phone", event.target.value)}
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
            className="mt-1 size-[18px] shrink-0 accent-[#1246A3]"
          />
          <span>
            I agree to the{" "}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {duplicate && (
          <Alert tone="error">
            This email address is already associated with an account.{" "}
            <Link to="/login" className="font-semibold underline">
              Try logging in instead.
            </Link>
            <span className="mt-1 block text-xs">
              Illustrative validation for the sample address
              existing@example.com.
            </span>
          </Alert>
        )}
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
          Your scholarship profile comes next, after email verification.
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
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

export function VerificationPage() {
  useTitle("Verify Your Email")
  const { account, updateAccount } = useContext(DemoContext)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)
  const expiresAt = useRef(0)
  const coolingDown = cooldown > 0
  useEffect(() => {
    if (!coolingDown) return
    const timer = window.setInterval(
      () =>
        setCooldown(
          Math.max(0, Math.ceil((expiresAt.current - Date.now()) / 1000)),
        ),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [coolingDown])
  function resend() {
    if (cooldown || busy) return
    expiresAt.current = Date.now() + 60000
    setCooldown(60)
    setResent(true)
  }
  async function verify() {
    setBusy(true)
    await pause()
    updateAccount({ verified: true, accountCreated: true })
    navigate("/verified")
  }
  return (
    <AuthLayout centered>
      <StateIcon />
      <FormHeading
        center
        eyebrow="ONE MORE STEP"
        title="Verify Your Email"
        description="We sent a verification link to:"
      />
      <p className="-mt-4 break-all text-center text-base font-semibold text-[#0A2F6F]">
        {account.email}
      </p>
      <p className="mb-7 mt-5 text-center text-sm leading-7 text-muted-foreground">
        Open the email and select the verification link to activate your
        ScholarMatch account.
      </p>
      <AuthButton
        onClick={verify}
        loading={busy}
        loadingText="Checking Verification..."
      >
        I Have Verified My Email
        <ArrowRight size={16} />
      </AuthButton>
      <button
        onClick={resend}
        disabled={!!cooldown || busy}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        {cooldown ? (
          <>
            <Clock3 size={15} />
            Resend available in {cooldown} seconds
          </>
        ) : (
          "Resend Verification Email"
        )}
      </button>
      {resent && (
        <p
          role="status"
          className="mt-3 text-center text-xs leading-5 text-[#278447]"
        >
          Resend demonstrated. No email was sent in this preview.
        </p>
      )}
      <p className="mt-5 text-center text-[13px] leading-6 text-muted-foreground">
        Didn't receive the email?
        <br />
        Check your spam or junk folder.
      </p>
      <div className="mt-6">
        <Alert>
          This is a simulated verification flow. No email has been sent; the
          button previews the verified state.
        </Alert>
      </div>
      <Link
        to="/register"
        className="mt-4 flex min-h-11 items-center justify-center gap-2 text-xs font-medium text-primary hover:underline"
      >
        <ArrowLeft size={13} />
        Use a different email
      </Link>
    </AuthLayout>
  )
}

export function VerifiedPage() {
  useTitle("Email Verified")
  const navigate = useNavigate()
  return (
    <AuthLayout centered wide>
      <StateIcon type="success" />
      <FormHeading
        center
        eyebrow="ACCOUNT ACTIVATED · PREVIEW"
        title="Email Verified!"
        description="Your ScholarMatch account is now active."
      />
      <AccountProgress />
      <AuthButton onClick={() => navigate("/welcome")}>
        Complete Your Profile
        <ArrowRight size={16} />
      </AuthButton>
      <AuthButton
        variant="secondary"
        className="mt-3"
        onClick={() => navigate("/dashboard")}
      >
        Go to Dashboard
      </AuthButton>
      <p className="mt-5 text-center text-xs leading-6 text-muted-foreground">
        You've completed account setup. Let's get to know your qualifications.
      </p>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Demo state only — no actual account was activated.
      </p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  useTitle("Forgot Password")
  const [email, setEmail] = useState("")
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    if (!validEmail(email)) {
      event.currentTarget.querySelector("input")?.focus()
      return
    }
    setBusy(true)
    await pause()
    setBusy(false)
    setSent(true)
  }
  return (
    <AuthLayout centered>
      <StateIcon type={sent ? "email" : "lock"} />
      {sent ? (
        <>
          <FormHeading
            center
            eyebrow="PASSWORD RECOVERY"
            title="Check Your Email"
            description="If an account is associated with the email address you entered, you'll receive password reset instructions shortly."
          />
          <Alert>
            This is a design preview. No email has been sent. Continue below to
            preview a secure reset-link destination.
          </Alert>
          <AuthButton
            className="mt-6"
            variant="secondary"
            onClick={() => navigate("/reset-password")}
          >
            Preview Reset Password Page
            <ArrowRight size={16} />
          </AuthButton>
          <BackToLogin />
        </>
      ) : (
        <>
          <FormHeading
            center
            eyebrow="LET'S GET YOU BACK IN"
            title="Forgot Your Password?"
            description="Enter the email address connected to your ScholarMatch account and we'll send instructions to reset your password."
          />
          <form noValidate onSubmit={submit} className="space-y-6">
            <Field
              label="Email Address"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              error={
                touched && !validEmail(email)
                  ? !email
                    ? "This field is required."
                    : "Enter a valid email address."
                  : ""
              }
              disabled={busy}
            />
            <AuthButton
              type="submit"
              loading={busy}
              loadingText="Sending Reset Link..."
            >
              Send Reset Link
              <ArrowRight size={16} />
            </AuthButton>
          </form>
          <BackToLogin />
          <TrustNote />
        </>
      )}
    </AuthLayout>
  )
}

export function ResetPasswordPage() {
  useTitle("Reset Password")
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const { search } = useLocation()
  const expired = new URLSearchParams(search).get("state") === "expired"
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!strongPassword(password) || confirm !== password || busy) return
    setBusy(true)
    await pause()
    navigate("/password-updated")
  }
  return (
    <AuthLayout centered>
      <StateIcon type="lock" />
      <FormHeading
        center
        eyebrow="A FRESH START"
        title="Create a New Password"
        description="Choose a new password for your ScholarMatch account."
      />
      {expired ? (
        <>
          <Alert tone="warning">
            This password reset link has expired or is no longer valid. Request
            a new link to continue.
          </Alert>
          <AuthButton
            className="mt-5"
            onClick={() => navigate("/forgot-password")}
          >
            Request a New Reset Link
          </AuthButton>
        </>
      ) : (
        <>
          <form noValidate onSubmit={submit} className="space-y-5">
            <Field
              label="New Password"
              type="password"
              icon={LockKeyhole}
              autoComplete="new-password"
              required
              placeholder="Create a new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
            />
            <PasswordStrength password={password} />
            <Field
              label="Confirm New Password"
              type="password"
              icon={LockKeyhole}
              autoComplete="new-password"
              required
              placeholder="Re-enter your new password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              onBlur={() => setTouched(true)}
              error={
                touched && confirm !== password
                  ? "Passwords do not match."
                  : touched && !confirm
                    ? "This field is required."
                    : ""
              }
              success={
                confirm && confirm === password ? "Passwords match" : undefined
              }
              disabled={busy}
            />
            <AuthButton
              type="submit"
              disabled={!strongPassword(password) || password !== confirm}
              loading={busy}
              loadingText="Updating Password..."
            >
              Update Password
              <ArrowRight size={16} />
            </AuthButton>
          </form>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Preview only. In production, password reset requires a valid,
            single-use link issued by the secure account service.
          </p>
        </>
      )}
      <BackToLogin />
    </AuthLayout>
  )
}

export function PasswordUpdatedPage() {
  useTitle("Password Updated")
  const navigate = useNavigate()
  return (
    <AuthLayout centered>
      <StateIcon type="success" />
      <FormHeading
        center
        eyebrow="YOU'RE READY TO RETURN"
        title="Password Updated"
        description="Your password has been changed successfully."
      />
      <AuthButton onClick={() => navigate("/login")}>
        Return to Login
        <ArrowRight size={16} />
      </AuthButton>
      <p className="mt-5 text-center text-[13px] leading-6 text-muted-foreground">
        Use your new password the next time you sign in.
      </p>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Demo confirmation only — no password was changed or stored.
      </p>
    </AuthLayout>
  )
}

export function WelcomePage() {
  useTitle("Welcome")
  const { account } = useContext(DemoContext)
  const navigate = useNavigate()
  return (
    <AuthLayout centered wide>
      <StateIcon type="welcome" />
      <FormHeading
        center
        eyebrow="YOUR ACCOUNT IS READY"
        title="Welcome to ScholarMatch!"
        description="Before we can recommend scholarship opportunities, complete your applicant profile."
      />
      <AccountProgress
        verified={account.accountCreated ? account.verified : true}
      />
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs font-medium">
          <span>Profile Completion</span>
          <span className="text-primary">0%</span>
        </div>
        <progress
          max={100}
          value={0}
          aria-label="Profile completion: 0%"
          className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#E4E7EC] [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-value]:bg-primary"
        />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Complete your profile to receive more relevant scholarship
          recommendations.
        </p>
      </div>
      <p className="mb-4 text-sm font-semibold text-[#0A2F6F]">
        A little information, more relevant opportunities.
      </p>
      <div className="mb-6 grid gap-x-4 gap-y-3 sm:grid-cols-2">
        {[
          { icon: BookOpen, text: "Academic Information" },
          { icon: GraduationCap, text: "Education Level" },
          { icon: FileText, text: "Course / Program" },
          { icon: School, text: "School / Institution" },
          { icon: MapPin, text: "Municipality / Residence" },
          { icon: Wallet, text: "Household Income Information" },
          { icon: ShieldCheck, text: "Other Scholarship Qualifications" },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-2.5 text-[13px] leading-5 text-muted-foreground"
          >
            <item.icon size={16} className="shrink-0 text-primary" />
            {item.text}
          </div>
        ))}
      </div>
      <AuthButton onClick={() => navigate("/profile-setup")}>
        Complete My Profile
        <ArrowRight size={16} />
      </AuthButton>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-2 min-h-12 w-full rounded-lg text-sm font-medium text-primary hover:bg-secondary"
      >
        I'll Do This Later
      </button>
      <div className="mt-4">
        <Alert>
          Scholarship recommendations may be limited until your profile is
          completed.
        </Alert>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Profile information in this preview is not sent or saved.
      </p>
    </AuthLayout>
  )
}

export function ProfileSetupPage() {
  useTitle("Applicant Profile Setup")
  const { updateAccount } = useContext(DemoContext)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [values, setValues] = useState({
    level: "",
    school: "",
    course: "",
    academic: "",
    municipality: "",
    province: "",
    income: "",
    other: "",
  })
  const [consent, setConsent] = useState(false)
  const labels = ["Education", "Qualifications", "Review"]
  const valid =
    step === 0
      ? !!values.level && !!values.school.trim() && !!values.course.trim()
      : step === 1
        ? !!values.municipality.trim() &&
          !!values.province.trim() &&
          !!values.income
        : consent
  const change = (name: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [name]: value }))
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid || busy) return
    if (step < 2) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "instant" })
      return
    }
    setBusy(true)
    await pause()
    updateAccount({ profileComplete: true })
    navigate("/dashboard")
  }
  return (
    <AuthLayout centered wide>
      <FormHeading
        eyebrow="APPLICANT PROFILE SETUP"
        title="Let's Get to Know You"
        description="Your qualifications help us find more relevant scholarship opportunities. Use sample information in this preview."
      />
      <ol className="mb-7 flex items-center">
        {labels.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                index < step
                  ? "bg-[#EAF7EE] text-[#278447]"
                  : index === step
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index < step ? <Check size={13} /> : index + 1}
            </span>
            <span
              className={`text-xs ${
                index === step
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {index < 2 && <span className="mx-1 h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>
      <form onSubmit={submit} className="space-y-5">
        {step === 0 ? (
          <>
            <label className="block text-sm font-medium">
              Education Level
              <span className="ml-1 text-muted-foreground">*</span>
              <select
                required
                value={values.level}
                onChange={(event) => change("level", event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-base"
              >
                <option value="">Select education level</option>
                <option>Senior High School</option>
                <option>College</option>
              </select>
            </label>
            <Field
              label="School / Institution"
              required
              placeholder="Enter your school"
              value={values.school}
              onChange={(event) => change("school", event.target.value)}
            />
            <Field
              label="Course / Program"
              required
              placeholder="Enter your course or strand"
              value={values.course}
              onChange={(event) => change("course", event.target.value)}
            />
            <Field
              label="Academic Information"
              placeholder="Example: year level and grading scale"
              value={values.academic}
              onChange={(event) => change("academic", event.target.value)}
              helper="Actual academic requirements depend on each scholarship program."
            />
          </>
        ) : step === 1 ? (
          <>
            <Field
              label="Municipality / Residence"
              required
              placeholder="Enter your municipality"
              value={values.municipality}
              onChange={(event) => change("municipality", event.target.value)}
            />
            <Field
              label="Province"
              required
              placeholder="Enter your province"
              value={values.province}
              onChange={(event) => change("province", event.target.value)}
            />
            <label className="block text-sm font-medium">
              Household Income Information
              <span className="ml-1 text-muted-foreground">*</span>
              <select
                required
                value={values.income}
                onChange={(event) => change("income", event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 text-base"
              >
                <option value="">Select information availability</option>
                <option>Income information available for verification</option>
                <option>Need guidance preparing income information</option>
                <option>Prefer to provide this later</option>
              </select>
            </label>
            <Field
              label="Other Scholarship Qualifications"
              placeholder="Optional additional qualifications"
              value={values.other}
              onChange={(event) => change("other", event.target.value)}
            />
            <Alert>
              Official income figures, documentation, and eligibility criteria
              are provided or verified by scholarship coordinators.
            </Alert>
          </>
        ) : (
          <>
            <div className="divide-y divide-border rounded-xl border border-border px-4">
              {[
                { label: "Education Level", value: values.level },
                { label: "School / Institution", value: values.school },
                { label: "Course / Program", value: values.course },
                {
                  label: "Academic Information",
                  value: values.academic || "Not provided",
                },
                {
                  label: "Municipality / Province",
                  value: `${values.municipality}, ${values.province}`,
                },
                { label: "Household Income Information", value: values.income },
                {
                  label: "Other Qualifications",
                  value: values.other || "Not provided",
                },
              ].map((item) => (
                <div key={item.label} className="py-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-medium">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <label className="flex min-h-11 items-start gap-3 py-2 text-[13px] leading-6 text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
                className="mt-1 size-[18px] shrink-0 accent-[#1246A3]"
              />
              <span>
                I understand that these are sample profile details and final
                scholarship decisions require official verification.
              </span>
            </label>
          </>
        )}
        <div className="flex gap-3">
          {step > 0 && (
            <AuthButton
              type="button"
              variant="secondary"
              className="w-auto"
              disabled={busy}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </AuthButton>
          )}
          <AuthButton
            type="submit"
            disabled={!valid}
            loading={busy}
            loadingText="Completing Profile..."
          >
            {step === 2 ? "Complete Profile Preview" : "Continue"}
            <ArrowRight size={16} />
          </AuthButton>
        </div>
      </form>
      <Link
        className="mt-4 flex min-h-11 items-center justify-center text-sm font-medium text-primary hover:underline"
        to="/dashboard"
      >
        I'll Complete This Later
      </Link>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Demo only. No profile information is stored.
      </p>
    </AuthLayout>
  )
}

export function DashboardPage() {
  useTitle("Applicant Dashboard Preview")
  const { account } = useContext(DemoContext)
  return (
    <div className="min-h-dvh bg-muted">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-10">
          <Link to="/home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
              Applicant · Demo
            </span>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </header>
      <main
        id="auth-main"
        className="mx-auto max-w-[1080px] px-5 py-12 sm:px-10 sm:py-16"
      >
        <div className="mb-8 flex items-center gap-2 text-xs font-semibold text-primary">
          <LayoutDashboard size={16} />
          YOUR APPLICANT WORKSPACE
        </div>
        <h1 className="text-[32px] font-bold leading-tight text-[#0A2F6F]">
          Welcome, {account.firstName}.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          A clear place to manage your next steps.
        </p>
        <div className="mt-8">
          <Alert>
            This is a student dashboard preview, not a live signed-in session.
            In production, authentication and assigned account permissions
            determine whether an applicant, coordinator, or administrator
            dashboard is accessible.
          </Alert>
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <UserRound size={22} />
              </span>
              <h2 className="text-xl font-semibold text-[#0A2F6F]">
                {account.profileComplete
                  ? "Your Profile Preview Is Complete"
                  : "Make Your First Step Count"}
              </h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {account.profileComplete
                ? "Your sample profile is ready for a more relevant scholarship discovery experience."
                : "Complete your applicant profile so ScholarMatch can help you discover opportunities that fit your qualifications."}
            </p>
            <div className="mb-5 mt-7 flex justify-between text-sm">
              <span>Profile Completion</span>
              <span className="font-semibold text-primary">
                {account.profileComplete ? "100%" : "0%"}
              </span>
            </div>
            <progress
              max={100}
              value={account.profileComplete ? 100 : 0}
              aria-label="Profile completion"
              className="mb-6 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-[#E4E7EC] [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
            />
            <Link
              to={account.profileComplete ? "/home#scholarships" : "/welcome"}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#0A2F6F]"
            >
              {account.profileComplete
                ? "Explore Sample Scholarships"
                : "Complete My Profile"}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
            <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Sparkles size={22} />
            </span>
            <h2 className="text-xl font-semibold text-[#0A2F6F]">
              Scholarship Recommendations
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {account.profileComplete
                ? "In the connected platform, matching will compare your profile with actual scholarship eligibility criteria."
                : "Recommendations are not available yet. Add your education and other qualifications to get started."}
            </p>
            <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[#278447]"
              />
              Recommendations are advisory. Authorized personnel make all final
              scholarship decisions.
            </p>
          </div>
        </div>
        <Link
          to="/home"
          className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to ScholarMatch Home
        </Link>
      </main>
    </div>
  )
}

export function LegalPage() {
  const { pathname } = useLocation()
  const privacy = pathname === "/privacy"
  useTitle(privacy ? "Privacy Policy" : "Terms of Use")
  return (
    <AuthLayout centered wide>
      <FormHeading
        eyebrow="TRANSPARENCY MATTERS"
        title={privacy ? "Privacy & Your Information" : "Terms of Use"}
        description="Information about this ScholarMatch design preview."
      />
      <div className="space-y-5 text-sm leading-7 text-muted-foreground">
        {privacy ? (
          <>
            <p>
              This interactive design preview does not send, save, or assess
              credentials, applicant information, or documents. Form values are
              temporary and are cleared when the browser reloads.
            </p>
            <p>
              Do not enter real passwords, sensitive information, or personal
              documents. The live platform must publish an approved privacy
              notice describing information collection, purpose, retention,
              access controls, and applicant rights under Philippine data
              privacy requirements before launch.
            </p>
          </>
        ) : (
          <>
            <p>
              ScholarMatch is currently an interactive design demonstration. No
              live accounts are created, verification or reset emails are not
              sent, and no real passwords are updated.
            </p>
            <p>
              Sample scholarships, match scores, and dashboard information are
              illustrative, not active offers. No government adoption, official
              partnership, or entitlement to scholarship assistance is implied.
            </p>
            <p>
              AI assistance is advisory. Authorized scholarship personnel retain
              all eligibility verification, evaluation, approval, and rejection
              responsibilities. Approved operational terms will be published
              before launch.
            </p>
          </>
        )}
      </div>
      <BackToLogin />
    </AuthLayout>
  )
}

export function NotFoundPage() {
  useTitle("Page Not Found")
  const navigate = useNavigate()
  return (
    <AuthLayout centered>
      <StateIcon type="welcome" />
      <FormHeading
        center
        eyebrow="LET'S FIND YOUR WAY"
        title="Page Not Found"
        description="This page isn't available. You can return to login or explore ScholarMatch."
      />
      <AuthButton onClick={() => navigate("/login")}>
        Return to Login
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
