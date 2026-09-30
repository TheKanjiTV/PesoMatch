import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react"
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Files,
  GraduationCap,
  Info,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Upload,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"

type Modal = {
  kind: "signup" | "login" | "coordinator" | "scholarship" | "requirements" | "application" | "help" | "privacy" | "terms" | "contact"
  title?: string
} | null
type Tone = "green" | "blue" | "gold" | "red" | "gray"
const container = "mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10"
const panel =
  "rounded-xl border border-border bg-white shadow-[0_4px_18px_rgba(16,24,40,0.04)]"
const tones: Record<Tone, string> = {
  green: "bg-[#EAF7EE] text-[#216d3c]",
  blue: "bg-secondary text-primary",
  gold: "bg-[#fff8e3] text-[#8a650b]",
  red: "bg-[#fff0f0] text-[#C92A2A]",
  gray: "bg-[#f2f4f7] text-[#667085]",
}
const requirements = [
  {
    name: "Certificate of Registration",
    status: "Verified",
    tone: "green" as Tone,
    icon: CircleCheck,
  },
  {
    name: "Grades / Transcript",
    status: "Submitted",
    tone: "blue" as Tone,
    icon: FileCheck2,
  },
  {
    name: "Certificate of Indigency",
    status: "Pending Verification",
    tone: "gold" as Tone,
    icon: Clock3,
  },
  {
    name: "Valid ID",
    status: "Missing",
    tone: "red" as Tone,
    icon: TriangleAlert,
  },
  {
    name: "Proof of Residence",
    status: "Verified",
    tone: "green" as Tone,
    icon: CircleCheck,
  },
]
const programs = [
  {
    name: "Educational Assistance Program",
    type: "Needs-based assistance",
    level: "Senior High & College",
    criteria: "Residency and household income",
    icon: GraduationCap,
  },
  {
    name: "Academic Merit Scholarship",
    type: "Academic achievement",
    level: "College",
    criteria: "Academic record and education level",
    icon: BookOpen,
  },
  {
    name: "Student Financial Assistance Program",
    type: "Student financial support",
    level: "Senior High & College",
    criteria: "Household income and education level",
    icon: UsersRound,
  },
]
const timeline = [
  "Application Submitted",
  "Documents Verified",
  "Eligibility Evaluation",
  "Final Evaluation",
  "Application Result",
]

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text" | "white"
}) {
  const variants = {
    primary:
      "border-primary bg-primary text-white hover:border-[#0A2F6F] hover:bg-[#0A2F6F]",
    secondary:
      "border-[#ced9ed] bg-white text-primary hover:border-primary hover:bg-secondary",
    text: "border-transparent text-primary hover:bg-secondary",
    white: "border-white bg-white text-primary hover:bg-secondary",
  }
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`relative flex size-10 items-center justify-center rounded-[10px] ${
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
function Badge({
  children,
  tone = "blue",
  icon: Icon,
}: {
  children: ReactNode
  tone?: Tone
  icon?: LucideIcon
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold leading-5 ${tones[tone]}`}
    >
      {Icon && <Icon size={13} />}
      {children}
    </span>
  )
}
function IconBox({
  icon: Icon,
  className = "",
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <span
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-primary ${className}`}
    >
      <Icon size={22} strokeWidth={1.7} />
    </span>
  )
}
function Eyebrow({
  children,
  icon: Icon,
}: {
  children: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[1.6px] text-primary">
      {Icon && <Icon size={15} />}
      {children}
    </div>
  )
}
function Heading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow?: string
  title: string
  description?: string
  center?: boolean
}) {
  return (
    <div
      className={`${
        center ? "mx-auto max-w-[730px] text-center" : "max-w-[540px]"
      }`}
    >
      {eyebrow && (
        <div className="mb-3 text-[11px] font-bold tracking-[1.8px] text-primary">
          {eyebrow}
        </div>
      )}
      <h2 className="text-[30px] font-bold leading-[1.25] tracking-[-0.6px] text-[#0A2F6F] sm:text-[36px]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
function CheckLine({
  children,
  small = false,
}: {
  children: ReactNode
  small?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-2.5 ${
        small ? "text-xs" : "text-base"
      } leading-6`}
    >
      <Check
        className="mt-1 shrink-0 text-[#278447]"
        size={small ? 13 : 16}
        strokeWidth={2.5}
      />
      <span>{children}</span>
    </div>
  )
}
function ProgressBar({
  value,
  green = false,
}: {
  value: number
  green?: boolean
}) {
  return (
    <progress
      aria-label={`${value}% complete`}
      max={100}
      value={value}
      className={`h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#edf0f5] [&::-webkit-progress-value]:rounded-full ${
        green
          ? "[&::-webkit-progress-value]:bg-[#278447] [&::-moz-progress-bar]:bg-[#278447]"
          : "[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
      }`}
    />
  )
}
function MatchCircle({
  value = 85,
  large = false,
}: {
  value?: number
  large?: boolean
}) {
  return (
    <div className={`relative shrink-0 ${large ? "size-32" : "size-[75px]"}`}>
      <svg
        viewBox="0 0 100 100"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#eaf2ff"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="#1246a3"
          strokeWidth="6"
          strokeDasharray={`${value * 2.7} 270`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold text-primary ${
            large ? "text-3xl" : "text-[22px]"
          }`}
        >
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground">Match</span>
      </div>
    </div>
  )
}

function HeroPreview({ open }: { open: (modal: Modal) => void }) {
  return (
    <div className="relative mx-auto w-full max-w-[550px] pb-9 pt-6 sm:pb-14 sm:pt-20">
      <div className="absolute -inset-x-3 inset-y-8 rounded-[40%] bg-[#F3F7FD] sm:-inset-x-6" />
      <div className="absolute right-4 top-0 h-8 w-8 rounded-full border-[5px] border-[#F4C430]/40" />
      <div
        className={`relative ml-2 mr-5 p-5 sm:ml-4 sm:mr-12 sm:p-6 ${panel} shadow-[0_12px_40px_rgba(18,70,163,0.07)]`}
      >
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0A2F6F]">
            <Sparkles size={17} className="text-primary" />
            Recommended for You
          </div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Sample preview
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              LGU Scholarship Program · Sample
            </div>
            <h3 className="max-w-[260px] text-[19px] font-bold leading-7 text-[#0A2F6F]">
              Educational Assistance Scholarship
            </h3>
          </div>
          <MatchCircle />
        </div>
        <div className="my-4">
          <Badge tone="green" icon={ShieldCheck}>
            Potentially Eligible
          </Badge>
        </div>
        <div className="rounded-lg border border-[#edf0f5] bg-[#F7F9FC] p-4">
          <p className="mb-2 text-xs font-semibold">Why You Match</p>
          {[
            "Residency requirement matched",
            "Academic requirement matched",
            "Household income requirement matched",
            "Education level matched",
          ].map((text) => (
            <CheckLine key={text} small>
              {text}
            </CheckLine>
          ))}
        </div>
        <div className="my-4 flex items-center gap-2 text-[11px] text-[#8a650b]">
          <TriangleAlert size={14} />1 requirement needs attention
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() =>
              open({ kind: "scholarship", title: programs[0].name })
            }
            className="min-h-10 flex-1 px-3 py-2 text-xs"
          >
            View Scholarship
            <ArrowRight size={13} />
          </Button>
          <Button
            onClick={() =>
              document.getElementById("why-match")?.scrollIntoView()
            }
            variant="secondary"
            className="min-h-10 px-3 py-2 text-xs"
          >
            Why You Match
          </Button>
        </div>
      </div>
      <div
        className={`relative -mt-2 ml-auto mr-0 w-[230px] p-4 sm:absolute sm:-right-2 sm:top-0 sm:mt-0 ${panel} shadow-[0_8px_24px_rgba(16,24,40,0.08)]`}
      >
        <div className="mb-2 text-[9px] font-semibold tracking-[1.4px] text-muted-foreground">
          ELIGIBILITY CHECK
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#216d3c]">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#EAF7EE]">
            <ShieldCheck size={17} />
          </span>
          Potentially Eligible
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Basic qualifications currently matched.
        </p>
      </div>
      <div
        className={`relative -mt-3 ml-0 w-[240px] p-4 sm:absolute sm:-left-3 sm:bottom-[-132px] sm:mt-0 ${panel} shadow-[0_8px_24px_rgba(16,24,40,0.07)]`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold tracking-[1.4px] text-muted-foreground">
            REQUIREMENTS
          </span>
          <Files size={13} className="text-primary" />
        </div>
        <div className="mb-2 mt-2 text-xs font-semibold">
          4 of 5 Complete <span className="float-right text-primary">80%</span>
        </div>
        <ProgressBar value={80} green />
        <div className="mt-2 grid gap-1">
          {[
            "Certificate of Registration",
            "Grades",
            "Certificate of Indigency",
            "Valid ID",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-[10px] text-muted-foreground"
            >
              <Check size={11} className="text-[#278447]" />
              {item}
            </div>
          ))}
          <div className="flex items-center gap-2 text-[10px] text-[#8a650b]">
            <span className="size-2 rounded-full border border-[#c79c23]" />
            Additional Requirement
          </div>
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  second = false,
  open,
}: {
  second?: boolean
  open: (modal: Modal) => void
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex justify-between gap-3">
        <div className="flex gap-3">
          <IconBox
            icon={second ? BookOpen : GraduationCap}
            className="size-9"
          />
          <h3 className="max-w-[230px] text-sm font-semibold leading-5">
            {second ? programs[2].name : programs[0].name}
          </h3>
        </div>
        <span className="shrink-0 text-xs font-bold text-primary">
          {second ? 72 : 85}% Match
        </span>
      </div>
      <div className="mb-3 mt-3">
        <Badge
          tone={second ? "gold" : "green"}
          icon={second ? CircleHelp : ShieldCheck}
        >
          {second ? "Missing Information" : "Potentially Eligible"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        {[
          "Residency",
          "Educational Level",
          "Household Income",
          "Academic Record",
        ].map((item, index) => (
          <span
            key={item}
            className={`flex items-center gap-1.5 ${
              second && index > 1 ? "text-[#8a650b]" : "text-muted-foreground"
            }`}
          >
            {second && index > 1 ? (
              <CircleHelp size={12} />
            ) : (
              <Check size={12} className="text-[#278447]" />
            )}
            {item}
          </span>
        ))}
      </div>
      <button
        onClick={() =>
          open(
            second
              ? { kind: "signup" }
              : { kind: "scholarship", title: programs[0].name },
          )
        }
        className="mt-3 flex min-h-9 items-center gap-2 text-xs font-semibold text-primary hover:underline"
      >
        {second ? "Complete Profile" : "View Details"}
        <ArrowRight size={13} />
      </button>
    </div>
  )
}

function RequirementList({ interactive = false }: { interactive?: boolean }) {
  const [fileName, setFileName] = useState("")
  return (
    <>
      <div className="divide-y divide-border">
        {requirements.map((item) => {
          const uploaded = item.status === "Missing" && !!fileName
          return (
            <div
              key={item.name}
              className="flex min-h-[66px] flex-wrap items-center justify-between gap-2 py-3"
            >
              <span className="flex items-center gap-2.5 text-xs font-medium sm:text-sm">
                <FileText size={17} className="shrink-0 text-[#8A94A6]" />
                {item.name}
              </span>
              <Badge
                tone={uploaded ? "blue" : item.tone}
                icon={uploaded ? FileCheck2 : item.icon}
              >
                {uploaded ? "Submitted" : item.status}
              </Badge>
            </div>
          )
        })}
      </div>
      <div className="mt-4 border-t border-border pt-5">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-muted-foreground">
            {fileName ? 5 : 4} of 5 requirements submitted
          </span>
          <span className="font-bold text-primary">{fileName ? 100 : 80}%</span>
        </div>
        <ProgressBar value={fileName ? 100 : 80} />
      </div>
      {interactive && (
        <div className="mt-5 rounded-lg border border-dashed border-[#b9c9e4] bg-[#F3F7FD] p-4">
          <label
            htmlFor="document"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Upload size={16} />
            Try uploading a sample Valid ID
          </label>
          <input
            id="document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? "")
            }
          />
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {fileName
              ? `${fileName} selected. Demo only; your file is not uploaded or stored.`
              : "PDF, JPG or PNG. Demo only — do not select sensitive personal documents."}
          </p>
        </div>
      )}
    </>
  )
}

function ApplicationTimeline({ compact = false }: { compact?: boolean }) {
  return (
    <ol
      className={compact ? "space-y-0" : "grid gap-5 md:grid-cols-5 md:gap-0"}
    >
      {timeline.map((step, index) => (
        <li
          key={step}
          className={`relative ${
            compact
              ? "flex gap-3 pb-5"
              : "flex items-start gap-3 md:block md:text-center"
          }`}
        >
          {index < 4 && (
            <div
              className={`${
                compact
                  ? "absolute bottom-0 left-[15px] top-8 w-px"
                  : "absolute bottom-[-20px] left-[15px] top-8 w-px md:bottom-auto md:left-1/2 md:top-4 md:h-px md:w-full"
              } ${index < 2 ? "bg-[#bddbc6]" : "bg-border"}`}
            />
          )}
          <span
            className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${
              compact ? "" : "md:mx-auto md:mb-3"
            } ${
              index < 2
                ? "bg-[#EAF7EE] text-[#278447]"
                : index === 2
                  ? "bg-primary text-white ring-4 ring-secondary"
                  : "border border-border bg-white text-[#8A94A6]"
            }`}
          >
            {index < 2 ? (
              <Check size={16} />
            ) : index === 2 ? (
              <span className="size-2 rounded-full bg-white" />
            ) : (
              <span className="text-xs">{index + 1}</span>
            )}
          </span>
          <div>
            <p className="text-xs font-semibold leading-5">{step}</p>
            <p
              className={`mt-1 text-[11px] ${
                index < 2
                  ? "text-[#278447]"
                  : index === 2
                    ? "font-medium text-primary"
                    : "text-muted-foreground"
              }`}
            >
              {index < 2 ? "Completed" : index === 2 ? "Current" : "Pending"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function AdminPreview() {
  const chartData = [
    { name: "Submitted", count: 64 },
    { name: "Review", count: 84 },
    { name: "Requirements", count: 31 },
    { name: "Evaluated", count: 133 },
  ]
  return (
    <div className={`${panel} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-border bg-[#fcfdff] px-5 py-4">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#0A2F6F]">
          <LayoutDashboard size={16} />
          ScholarMatch Administration
        </span>
        <Badge tone="gray">Sample data</Badge>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Total Applications", value: 248 },
            { label: "Under Review", value: 84 },
            { label: "Additional Requirements", value: 31 },
            { label: "Completed Evaluations", value: 133 },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border p-3"
            >
              <p className="min-h-7 text-[9px] leading-3.5 text-muted-foreground">
                {stat.label}
              </p>
              <p
                className={`mt-1 text-[23px] font-bold ${
                  index === 3 ? "text-[#278447]" : "text-[#0A2F6F]"
                }`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <p className="mb-2 mt-5 text-[9px] font-semibold tracking-wider text-muted-foreground">
          APPLICATION OVERVIEW · ILLUSTRATIVE COUNTS
        </p>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#edf0f5" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#667085" }}
              />
              <Tooltip cursor={{ fill: "#f3f7fd" }} />
              <Bar
                dataKey="count"
                name="Sample applications"
                fill="#1246a3"
                radius={[3, 3, 0, 0]}
                barSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold">Recent Applications</p>
          {["Under Review", "Requirements Needed", "Evaluation"].map(
            (status, index) => (
              <div
                key={status}
                className="flex items-center justify-between border-t border-[#f0f2f5] py-2 text-[10px]"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UserRound size={12} />
                  </span>
                  Applicant 00{index + 1}
                </span>
                <Badge tone={index === 1 ? "gold" : "blue"}>{status}</Badge>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

interface DemoDialogProps {
  modal: Modal
  close: () => void
}

function DemoDialog({ modal, close }: DemoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [complete, setComplete] = useState(false)
  const [detailsTab, setDetailsTab] = useState("Overview")
  useEffect(() => {
    if (modal) {
      setComplete(false)
      setDetailsTab("Overview")
      dialogRef.current?.showModal()
      document.body.classList.add("overflow-hidden")
    } else {
      dialogRef.current?.close()
    }
    return () => {
      document.body.classList.remove("overflow-hidden")
    }
  }, [modal])
  const title =
    modal?.kind === "signup"
      ? "Start your scholarship journey"
      : modal?.kind === "login"
        ? "Welcome back to ScholarMatch"
        : modal?.kind === "coordinator"
          ? "Coordinator Login"
          : modal?.kind === "requirements"
            ? "Manage Requirements"
            : modal?.kind === "application"
              ? "Your Application Progress"
              : modal?.kind === "help"
                ? "ScholarMatch Help Center"
                : modal?.kind === "privacy"
                  ? "Privacy & Your Information"
                  : modal?.kind === "terms"
                    ? "Terms of Use · Demo"
                    : modal?.kind === "contact"
                      ? "Contact & Support"
                      : modal?.title
  const auth = modal && ["signup", "login", "coordinator"].includes(modal.kind)
  return (
    <dialog
      ref={dialogRef}
      onCancel={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) close()
      }}
      aria-labelledby="dialog-title"
      className="m-auto max-h-[90dvh] w-[calc(100%_-_32px)] max-w-[570px] overflow-y-auto rounded-2xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-[#071f4a]/55"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <span className="text-[11px] font-semibold tracking-wider text-primary">
          SCHOLARMATCH {auth ? "" : "· SAMPLE PREVIEW"}
        </span>
        <button
          aria-label="Close dialog"
          onClick={close}
          className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        <h2
          id="dialog-title"
          className="text-2xl font-bold leading-8 text-[#0A2F6F]"
        >
          {title}
        </h2>
        {auth && (
          <>
            {complete ? (
              <div role="status" className="mt-5 rounded-xl bg-[#EAF7EE] p-5">
                <CircleCheck className="mb-3 text-[#278447]" />
                <h3 className="font-semibold">
                  You're ready for the next step.
                </h3>
                <p className="mt-2 text-sm leading-6">
                  This is an interactive design preview. No account was created,
                  and no credentials were sent or saved. A secure account
                  service will be connected in production.
                </p>
                <Button className="mt-4" onClick={close}>
                  Continue Exploring
                  <ArrowRight size={16} />
                </Button>
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {modal?.kind === "coordinator"
                    ? "For authorized scholarship personnel only."
                    : modal?.kind === "signup"
                      ? "Create an applicant profile to find opportunities that may fit your qualifications."
                      : "Access your profile, documents, and application updates."}
                </p>
                <div className="my-4 rounded-lg bg-secondary p-3 text-xs leading-5 text-primary">
                  Design preview only. Use sample information, not real
                  credentials.
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    setComplete(true)
                  }}
                  className="space-y-4"
                >
                  {modal?.kind === "signup" && (
                    <label className="block text-sm font-medium">
                      Full name
                      <input
                        required
                        autoComplete="off"
                        placeholder="Your name"
                        className="mt-2 min-h-12 w-full rounded-lg border border-[#D0D5DD] px-3 text-base"
                      />
                    </label>
                  )}
                  <label className="block text-sm font-medium">
                    Email address
                    <input
                      required
                      type="email"
                      autoComplete="off"
                      placeholder="student@example.com"
                      className="mt-2 min-h-12 w-full rounded-lg border border-[#D0D5DD] px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Password
                    <input
                      required
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="mt-2 min-h-12 w-full rounded-lg border border-[#D0D5DD] px-3 text-base"
                    />
                  </label>
                  {modal?.kind === "signup" && (
                    <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                      <input
                        required
                        type="checkbox"
                        className="mt-1 size-4 accent-[#1246a3]"
                      />
                      I understand this is a demo and scholarship decisions are
                      made by authorized personnel.
                    </label>
                  )}
                  <Button type="submit" className="w-full">
                    {modal?.kind === "signup"
                      ? "Preview Account Creation"
                      : "Preview Login"}
                    <ArrowRight size={16} />
                  </Button>
                </form>
              </>
            )}
          </>
        )}
        {modal?.kind === "scholarship" && (
          <>
            <div className="mb-5 mt-4 flex flex-wrap gap-2">
              <Badge tone="gray">Sample Program</Badge>
              <Badge tone="green" icon={ShieldCheck}>
                Potentially Eligible · Example
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              An illustrative scholarship program to show how you can review
              criteria, understand a match, and prepare an application. This is
              not an active government scholarship.
            </p>
            <div
              className="my-5 flex border-b border-border"
              role="tablist"
              aria-label="Scholarship details"
            >
              {["Overview", "Why You Match", "Requirements"].map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  id={`tab-${tab.split(" ").join("-")}`}
                  aria-controls="scholarship-panel"
                  aria-selected={tab === detailsTab}
                  onClick={() => setDetailsTab(tab)}
                  className={`min-h-11 flex-1 border-b-2 text-xs font-semibold ${
                    tab === detailsTab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="scholarship-panel"
              aria-labelledby={`tab-${detailsTab.split(" ").join("-")}`}
              className="min-h-44"
            >
              {detailsTab === "Overview" ? (
                <dl className="grid gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Education level
                    </dt>
                    <dd className="mt-1 font-medium">
                      Senior High School / College · Example
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Application deadline
                    </dt>
                    <dd className="mt-1">
                      Not published — sample program only
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Final evaluation
                    </dt>
                    <dd className="mt-1 leading-6">
                      Eligibility, documents, and decisions are verified by
                      authorized scholarship personnel.
                    </dd>
                  </div>
                </dl>
              ) : detailsTab === "Why You Match" ? (
                <div className="flex items-center gap-5">
                  <MatchCircle />
                  <div>
                    {[
                      "Residency",
                      "Academic Requirement",
                      "Household Income",
                      "Education Level",
                    ].map((text) => (
                      <CheckLine key={text}>{text} matched</CheckLine>
                    ))}
                    <p className="mt-2 text-xs text-[#8a650b]">
                      1 document needs attention
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {requirements.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 py-2 text-sm"
                    >
                      <FileText size={16} className="text-primary" />
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 rounded-lg bg-secondary p-3 text-xs leading-5 text-primary">
              Illustrative matching only. No real profile was assessed. Final
              decisions remain with authorized personnel.
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => {
                close()
                document.getElementById("scholarships")?.scrollIntoView()
              }}
            >
              Back to Sample Scholarships
            </Button>
          </>
        )}
        {modal?.kind === "requirements" && (
          <>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Educational Assistance Program · Sample application
            </p>
            <RequirementList interactive />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="red" icon={CircleX}>
                Rejected · Example
              </Badge>
              <span className="text-xs leading-6 text-muted-foreground">
                Rejected documents can be resubmitted when requested.
              </span>
            </div>
          </>
        )}
        {modal?.kind === "application" && (
          <>
            <p className="mb-6 mt-3 text-sm text-muted-foreground">
              Sample application SCH-2026-00125
            </p>
            <ApplicationTimeline compact />
            <div className="rounded-lg bg-secondary p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Bell size={16} />
                Latest update · September 29, 2026
              </p>
              <p className="mt-2 text-sm leading-6">
                Your application is currently under eligibility evaluation. No
                additional action is required in this example.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="green" icon={Check}>
                Approved · Example
              </Badge>
              <Badge tone="red" icon={CircleX}>
                Rejected · Example
              </Badge>
              <Badge tone="gold" icon={TriangleAlert}>
                Additional Requirements Needed · Example
              </Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Possible future statuses shown for illustration, not actual
              decisions.
            </p>
          </>
        )}
        {modal?.kind === "help" && (
          <div className="mt-5 space-y-3">
            {[
              {
                q: "Does AI approve or reject applications?",
                a: "No. AI only assists with recommendations and preliminary eligibility checks. Authorized scholarship personnel verify documents, evaluate applications, and make final decisions.",
              },
              {
                q: "Can I browse without creating an account?",
                a: "Yes. You can explore scholarship information before registering. The programs on this landing page are examples, not active scholarship offers.",
              },
              {
                q: "What does Potentially Eligible mean?",
                a: "Your profile appears to match basic conditions. It is not a guarantee of eligibility or a scholarship award; official verification is still required.",
              },
              {
                q: "What if a document is missing or rejected?",
                a: "Review your checklist and the coordinator’s instructions. In the connected platform, you can upload missing documents and resubmit rejected documents when requested.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-border p-4"
              >
                <summary className="flex list-none items-center justify-between gap-3 text-sm font-semibold">
                  {item.q}
                  <ChevronDown
                    size={16}
                    className="shrink-0 transition group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        )}
        {modal?.kind === "privacy" && (
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              This design preview does not transmit, save, or assess applicant
              information. Any file you select stays in your browser and is not
              uploaded.
            </p>
            <p>
              Before launch, the platform must publish an approved privacy
              notice describing collected information, its purpose, retention,
              access controls, and applicant rights under applicable Philippine
              data privacy requirements.
            </p>
            <p>Do not enter real personal information into this preview.</p>
          </div>
        )}
        {modal?.kind === "terms" && (
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              This page is an interactive platform demonstration. Scholarship
              programs, match scores, requirements, and application records are
              illustrative only.
            </p>
            <p>
              No active scholarship offers, account services, or government
              partnerships are represented. AI assistance is advisory;
              authorized scholarship personnel retain decision-making
              responsibility.
            </p>
            <p>
              Approved operational terms will be provided before the platform
              launches.
            </p>
          </div>
        )}
        {modal?.kind === "contact" && (
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Support contact details will be published once ScholarMatch is
              operational. No official office, email address, or government
              partnership is claimed by this preview.
            </p>
            <p>
              For now, use the Help Center to understand matching, eligibility,
              and application requirements.
            </p>
            <Button
              onClick={() => {
                close()
                document.getElementById("help")?.scrollIntoView()
              }}
              variant="secondary"
            >
              Explore Help Topics
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </dialog>
  )
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [filter, setFilter] = useState("All levels")
  const [active, setActive] = useState("home")
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    )
    ;["home", "how-it-works", "about", "scholarships", "help"].forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])
  const browse = () => document.getElementById("scholarships")?.scrollIntoView()
  const nav = [
    { label: "Home", id: "home" },
    { label: "Scholarships", id: "scholarships" },
    { label: "How It Works", id: "how-it-works" },
    { label: "About", id: "about" },
    { label: "Help", id: "help" },
  ]
  const benefits = [
    {
      icon: Search,
      title: "Discover Scholarships",
      text: "Explore available scholarship opportunities in one place.",
    },
    {
      icon: Target,
      title: "Smart Matching",
      text: "Receive recommendations based on your applicant profile.",
    },
    {
      icon: ClipboardCheck,
      title: "Check Eligibility",
      text: "Understand basic qualifications before submitting an application.",
    },
    {
      icon: Activity,
      title: "Track Applications",
      text: "Monitor requirements, verification, evaluation, and results.",
    },
  ]
  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-primary px-5 py-3 text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
        <div
          className={`${container} flex h-[78px] items-center justify-between gap-6`}
        >
          <a href="#home" aria-label="ScholarMatch home">
            <Logo />
          </a>
          <nav
            aria-label="Main navigation"
            className="hidden h-full items-center gap-7 lg:flex"
          >
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? "page" : undefined}
                className={`relative flex h-full items-center text-[13px] font-medium transition hover:text-primary ${
                  active === item.id
                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-full after:rounded-t after:bg-primary"
                    : "text-[#475467]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              variant="text"
              onClick={() => setModal({ kind: "login" })}
              className="px-3"
            >
              Log In
            </Button>
            <Button
              onClick={() => setModal({ kind: "signup" })}
              className="min-h-10 px-4 py-2 text-xs"
            >
              Create Account
              <ArrowRight size={14} />
            </Button>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex size-11 items-center justify-center rounded-lg text-[#0A2F6F] hover:bg-secondary lg:hidden"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-border px-5 pb-5 lg:hidden"
          >
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-border py-4 text-sm font-medium text-[#0A2F6F]"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setMobileOpen(false)
                  setModal({ kind: "login" })
                }}
              >
                Log In
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setMobileOpen(false)
                  setModal({ kind: "signup" })
                }}
              >
                Create Account
              </Button>
            </div>
          </nav>
        )}
      </header>
      <main id="main">
        <section id="home" className="overflow-hidden bg-white">
          <div
            className={`${container} grid items-center gap-10 pb-16 pt-14 sm:pb-40 sm:pt-20 lg:grid-cols-[1.04fr_1fr] lg:gap-12 lg:pt-[76px]`}
          >
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#e2eafa] bg-[#F3F7FD] px-3 py-2 text-[10px] font-semibold tracking-[1.3px] text-primary">
                <GraduationCap size={15} />
                SMARTER SCHOLARSHIP DISCOVERY
              </div>
              <h1 className="max-w-[590px] text-[40px] font-bold leading-[1.16] tracking-[-1.3px] text-[#0A2F6F] sm:text-[54px] lg:text-[57px]">
                Find Scholarships That{" "}
                <span className="text-primary">Match Your Qualifications.</span>
              </h1>
              <p className="mt-6 max-w-[500px] text-base leading-[1.8] text-muted-foreground">
                Discover scholarship opportunities, check your possible
                eligibility, understand requirements, and manage your
                applications—all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={browse} className="px-6">
                  <Search size={17} />
                  Find Scholarships
                  <ArrowRight size={15} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setModal({ kind: "signup" })}
                  className="px-6"
                >
                  Create an Account
                </Button>
              </div>
              <div className="mt-6 flex max-w-[460px] items-start gap-2.5">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-[#278447]"
                />
                <p className="text-[11px] leading-[1.7] text-muted-foreground">
                  Scholarship recommendations and eligibility results are
                  subject to official verification.
                </p>
              </div>
              <a
                href="#how-it-works"
                className="mt-8 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-primary"
              >
                See how ScholarMatch works
                <ArrowDown size={13} />
              </a>
            </div>
            <HeroPreview open={setModal} />
          </div>
        </section>
        <section className="border-t border-border pb-16 pt-10">
          <div className={container}>
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-8 bg-primary" />
              <h2 className="text-[15px] font-semibold text-[#0A2F6F]">
                Everything you need to start your scholarship journey.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((item) => (
                <div key={item.title} className={`${panel} p-5`}>
                  <IconBox icon={item.icon} />
                  <h3 className="mb-2 mt-4 text-[15px] font-semibold text-[#0A2F6F]">
                    {item.title}
                  </h3>
                  <p className="text-base leading-7 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="bg-muted py-20 lg:py-24">
          <div className={container}>
            <Heading
              eyebrow="A CLEAR PATH FORWARD"
              title="How ScholarMatch Works"
              description="From scholarship discovery to application results, ScholarMatch guides you through every step."
              center
            />
            <div className="mt-14 grid gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {[
                {
                  icon: UserRound,
                  title: "Create Your Profile",
                  text: "Provide information relevant to scholarship eligibility such as education, academic information, residency, and other qualifications.",
                },
                {
                  icon: Sparkles,
                  title: "Discover Your Matches",
                  text: "ScholarMatch compares your information with available scholarship eligibility criteria.",
                },
                {
                  icon: ClipboardCheck,
                  title: "Review & Apply",
                  text: "Check qualifications and required documents before submitting your scholarship application.",
                },
                {
                  icon: Activity,
                  title: "Track Your Application",
                  text: "Follow document verification, evaluation, requirements, and application results.",
                },
              ].map((step, index) => (
                <div key={step.title} className="relative flex gap-4 sm:block">
                  <div className="relative shrink-0">
                    <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-[#dbe5f5] bg-white text-primary">
                      <step.icon size={24} strokeWidth={1.7} />
                    </div>
                    {index < 3 && (
                      <div
                        aria-hidden="true"
                        className="absolute bottom-[-36px] left-[27px] top-14 w-px bg-[#dbe5f5] sm:hidden"
                      />
                    )}
                    {index < 3 && (
                      <div className="absolute left-[72px] right-[-8px] top-7 hidden items-center lg:flex">
                        <div className="h-px flex-1 border-t border-dashed border-[#bdcce2]" />
                        <ChevronRight size={14} className="text-[#bdcce2]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-primary">
                      STEP 0{index + 1}
                    </span>
                    <h3 className="mb-3 mt-2 text-base font-semibold text-[#0A2F6F]">
                      {step.title}
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="py-20 lg:py-24">
          <div
            className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}
          >
            <div
              className={`${panel} order-2 bg-[#fcfdff] p-5 sm:p-6 lg:order-1`}
            >
              <div className="mb-5 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0A2F6F]">
                  <Sparkles size={17} className="text-primary" />
                  Scholarships Recommended for You
                </h3>
                <span className="text-[9px] text-muted-foreground">SAMPLE</span>
              </div>
              <div className="space-y-3">
                <RecommendationCard open={setModal} />
                <RecommendationCard open={setModal} second />
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Info size={13} />
                Based on your applicant profile · Illustrative matches
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Heading
                eyebrow="AI-ASSISTED MATCHING"
                title="Find Opportunities That Fit Your Profile"
                description="Instead of checking every scholarship manually, ScholarMatch analyzes information in your applicant profile and compares it with scholarship eligibility criteria."
              />
              <div className="my-6 space-y-2">
                {[
                  "Personalized scholarship recommendations",
                  "Preliminary eligibility screening",
                  "Clear explanation of matching criteria",
                  "Human-verified final decisions",
                ].map((text) => (
                  <CheckLine key={text}>{text}</CheckLine>
                ))}
              </div>
              <div className="flex gap-3 rounded-lg border border-[#dce7fa] bg-[#F3F7FD] p-4">
                <Info size={19} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs leading-6 text-[#475467]">
                  AI recommendations serve only as decision support. Authorized
                  scholarship personnel remain responsible for final eligibility
                  and scholarship decisions.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="why-match" className="bg-[#F3F7FD] py-20 lg:py-24">
          <div className={container}>
            <Heading
              eyebrow="UNDERSTAND YOUR MATCH"
              title="Know Why a Scholarship Was Recommended"
              description="ScholarMatch doesn't only show a percentage. It helps explain which qualifications appear to match."
              center
            />
            <div
              className={`${panel} mx-auto mt-10 max-w-[850px] overflow-hidden`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5 sm:px-8">
                <h3 className="text-base font-semibold text-[#0A2F6F]">
                  Provincial Educational Assistance Program
                </h3>
                <Badge tone="gray">Sample Program</Badge>
              </div>
              <div className="grid items-center gap-8 p-6 sm:grid-cols-[190px_1fr] sm:p-8">
                <div className="flex flex-col items-center">
                  <MatchCircle large />
                  <p className="mt-4 text-xs font-semibold text-[#0A2F6F]">
                    A promising profile match
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Subject to official verification
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-semibold tracking-[1px] text-muted-foreground">
                    WHY YOU MATCH
                  </p>
                  {[
                    "Residence",
                    "Academic Requirement",
                    "Household Income",
                    "Course / Year Level",
                    "Required Documents",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-3 border-b border-[#edf0f5] py-2.5 text-xs"
                    >
                      <span>{item}</span>
                      <span
                        className={`flex items-center gap-1.5 font-medium ${
                          index === 4 ? "text-[#8a650b]" : "text-[#278447]"
                        }`}
                      >
                        {index === 4 ? (
                          <TriangleAlert size={13} />
                        ) : (
                          <CircleCheck size={13} />
                        )}
                        {index === 4 ? "1 Missing" : "Matched"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-[#fcfdff] px-6 py-4 sm:px-8">
                <div className="flex flex-wrap gap-3 text-[9px] text-muted-foreground">
                  {[
                    { text: "Matched", color: "bg-[#278447]" },
                    { text: "Needs Attention", color: "bg-[#c79c23]" },
                    { text: "Not Met", color: "bg-[#C92A2A]" },
                    { text: "Not Available", color: "bg-[#8A94A6]" },
                  ].map((item) => (
                    <span key={item.text} className="flex items-center gap-1">
                      <span className={`size-1.5 rounded-full ${item.color}`} />
                      {item.text}
                    </span>
                  ))}
                </div>
                <Button
                  variant="text"
                  className="min-h-10 px-0 py-2 text-xs"
                  onClick={() =>
                    setModal({
                      kind: "scholarship",
                      title: "Provincial Educational Assistance Program",
                    })
                  }
                >
                  View Full Eligibility Details
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 lg:py-24">
          <div className={container}>
            <Heading
              eyebrow="ELIGIBILITY PRE-ASSESSMENT"
              title="Check Before You Apply"
              description="Review basic eligibility conditions before spending time completing an application."
              center
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Potentially Eligible",
                  text: "Your current profile appears to satisfy the basic eligibility conditions.",
                  tone: "green" as Tone,
                },
                {
                  icon: CircleHelp,
                  title: "Missing Information",
                  text: "We need additional profile information before checking your possible eligibility.",
                  tone: "gold" as Tone,
                },
                {
                  icon: CircleX,
                  title: "Requirement Not Met",
                  text: "One or more basic eligibility conditions currently do not match your profile.",
                  tone: "red" as Tone,
                },
              ].map((item) => (
                <div key={item.title} className={`${panel} p-6`}>
                  <span
                    className={`inline-flex size-11 items-center justify-center rounded-lg ${tones[item.tone]}`}
                  >
                    <item.icon size={23} strokeWidth={1.7} />
                  </span>
                  <h3 className="mb-3 mt-5 text-lg font-semibold text-[#0A2F6F]">
                    {item.title}
                  </h3>
                  <p className="text-base leading-7 text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
              <Info size={14} className="shrink-0" />
              These results are preliminary and subject to official
              verification.
            </p>
          </div>
        </section>
        <section className="border-t border-border py-20 lg:py-24">
          <div
            className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-24`}
          >
            <div>
              <Heading
                eyebrow="DOCUMENT MANAGEMENT"
                title="Know Exactly What You're Missing"
                description="ScholarMatch organizes scholarship requirements and shows the status of every submitted document."
              />
              <div className="mt-6 space-y-3">
                {[
                  "Reduce incomplete applications",
                  "Track verification status",
                  "Identify missing requirements",
                  "Resubmit rejected documents when necessary",
                ].map((text) => (
                  <CheckLine key={text}>{text}</CheckLine>
                ))}
              </div>
              <Button
                variant="text"
                onClick={() => setModal({ kind: "requirements" })}
                className="mt-5 px-0"
              >
                Explore the checklist
                <ArrowRight size={16} />
              </Button>
            </div>
            <div className={`${panel} p-5 sm:p-7`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-[#0A2F6F]">
                  <ClipboardCheck size={17} className="text-primary" />
                  APPLICATION REQUIREMENTS
                </p>
                <span className="text-[9px] text-muted-foreground">SAMPLE</span>
              </div>
              <RequirementList />
              <Button
                onClick={() => setModal({ kind: "requirements" })}
                className="mt-5 w-full"
              >
                Manage Requirements
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </section>
        <section id="tracking" className="bg-muted py-20 lg:py-24">
          <div className={container}>
            <Heading
              eyebrow="APPLICATION TRACKING"
              title="Follow Your Application Every Step of the Way"
              description="No need to repeatedly visit or contact the office just to ask about your application status."
              center
            />
            <div className={`${panel} mt-10 overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
                <div>
                  <h3 className="text-base font-semibold text-[#0A2F6F]">
                    Educational Assistance Program
                  </h3>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Application ID: SCH-2026-00125{" "}
                    <span className="mx-2 text-[#D0D5DD]">|</span> Submitted:
                    September 22, 2026
                  </p>
                </div>
                <Badge tone="blue" icon={Clock3}>
                  Under Evaluation · Sample
                </Badge>
              </div>
              <div className="grid lg:grid-cols-[1fr_290px]">
                <div className="px-6 py-9 sm:px-8 lg:py-11">
                  <ApplicationTimeline />
                </div>
                <div className="border-t border-border bg-[#fcfdff] p-6 lg:border-l lg:border-t-0">
                  <p className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-primary">
                    <Bell size={13} />
                    LATEST UPDATE
                  </p>
                  <p className="mt-3 text-sm font-medium leading-6">
                    Your application is currently under eligibility evaluation.
                  </p>
                  <p className="mb-3 mt-3 text-[10px] text-muted-foreground">
                    Updated: September 29, 2026
                  </p>
                  <Button
                    variant="text"
                    className="min-h-9 px-0 py-1 text-xs"
                    onClick={() => setModal({ kind: "application" })}
                  >
                    View Application
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 lg:py-24">
          <div className={container}>
            <Heading
              eyebrow="BUILT AROUND YOUR JOURNEY"
              title="One Platform for Your Scholarship Journey"
              center
            />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Scholarship Discovery",
                  text: "Browse and filter scholarship opportunities.",
                },
                {
                  icon: Sparkles,
                  title: "AI-Assisted Recommendations",
                  text: "Receive scholarship suggestions based on your profile.",
                },
                {
                  icon: ShieldCheck,
                  title: "Eligibility Screening",
                  text: "Review possible eligibility before applying.",
                },
                {
                  icon: Files,
                  title: "Document Management",
                  text: "Upload and monitor scholarship requirements.",
                },
                {
                  icon: Activity,
                  title: "Application Tracking",
                  text: "Follow the progress of submitted applications.",
                },
                {
                  icon: Bell,
                  title: "Notifications",
                  text: "Receive updates about requirements and application status.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`${panel} flex gap-4 p-6 transition duration-200 hover:-translate-y-1 hover:border-[#b9c9e4] hover:shadow-[0_8px_24px_rgba(18,70,163,0.07)]`}
                >
                  <IconBox icon={item.icon} />
                  <div>
                    <h3 className="mb-2 text-[15px] font-semibold text-[#0A2F6F]">
                      {item.title}
                    </h3>
                    <p className="text-base leading-7 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[#EDF3FC] py-20 lg:py-24">
          <div
            className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}
          >
            <div>
              <Eyebrow>FOR AUTHORIZED SCHOLARSHIP COORDINATORS</Eyebrow>
              <Heading
                title="Manage Scholarship Applications More Efficiently"
                description="ScholarMatch provides scholarship coordinators with tools to organize scholarship programs, review applicants, verify documents, evaluate applications, and monitor results."
              />
              <div className="my-6 grid gap-2 sm:grid-cols-2">
                {[
                  "Manage Scholarship Programs",
                  "Define Eligibility Criteria",
                  "Review Applicant Profiles",
                  "Verify Documents",
                  "Evaluate Applications",
                  "Request Additional Requirements",
                  "Generate Reports",
                ].map((text) => (
                  <CheckLine key={text} small>
                    {text}
                  </CheckLine>
                ))}
              </div>
              <Button onClick={() => setModal({ kind: "coordinator" })}>
                Coordinator Login
                <ArrowRight size={15} />
              </Button>
              <p className="mt-3 text-[10px] text-muted-foreground">
                Secure access for authorized personnel only.
              </p>
            </div>
            <div>
              <AdminPreview />
              <p className="mt-3 text-center text-[10px] leading-5 text-muted-foreground">
                UI sample data only. Not actual Bansud or government statistics.
              </p>
            </div>
          </div>
        </section>
        <section id="scholarships" className="py-20 lg:py-24">
          <div className={container}>
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <Heading
                eyebrow="DISCOVER YOUR NEXT OPPORTUNITY"
                title="Explore Scholarship Opportunities"
                description="Browse available scholarship programs and review their eligibility requirements."
              />
              <label className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                Education level
                <select
                  aria-label="Education level"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="min-h-11 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground"
                >
                  <option>All levels</option>
                  <option>Senior High</option>
                  <option>College</option>
                </select>
              </label>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {programs
                .filter(
                  (program) =>
                    filter !== "Senior High" ||
                    program.level.includes("Senior"),
                )
                .map((program) => (
                  <article
                    key={program.name}
                    className={`${panel} group flex flex-col p-6 transition hover:-translate-y-1 hover:border-[#b9c9e4] hover:shadow-[0_8px_24px_rgba(18,70,163,0.06)]`}
                  >
                    <div className="flex items-center justify-between">
                      <IconBox icon={program.icon} />
                      <Badge tone="gray">Sample Program</Badge>
                    </div>
                    <p className="mb-2 mt-5 text-[11px] text-muted-foreground">
                      {program.type}
                    </p>
                    <h3 className="mb-5 min-h-12 text-lg font-semibold leading-6 text-[#0A2F6F]">
                      {program.name}
                    </h3>
                    <dl className="mb-5 space-y-3 text-xs">
                      <div className="flex gap-2">
                        <ShieldCheck
                          size={14}
                          className="mt-0.5 shrink-0 text-primary"
                        />
                        <div>
                          <dt className="text-[10px] text-muted-foreground">
                            Example criteria
                          </dt>
                          <dd className="mt-1 leading-5">{program.criteria}</dd>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <GraduationCap
                          size={14}
                          className="shrink-0 text-primary"
                        />
                        <dt className="sr-only">Education level</dt>
                        <dd>{program.level}</dd>
                      </div>
                      <div className="flex gap-2">
                        <Clock3 size={14} className="shrink-0 text-primary" />
                        <dt className="sr-only">Deadline</dt>
                        <dd className="text-muted-foreground">
                          Deadline: Not published · Sample only
                        </dd>
                      </div>
                    </dl>
                    <Button
                      variant="secondary"
                      className="mt-auto w-full"
                      onClick={() =>
                        setModal({ kind: "scholarship", title: program.name })
                      }
                    >
                      View Details
                      <ArrowRight size={15} />
                    </Button>
                  </article>
                ))}
            </div>
            <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground">
              <Info size={14} className="mt-0.5 shrink-0" />
              These are illustrative programs, not active scholarship offers.
              Actual program information will be provided by authorized
              coordinators.
            </p>
          </div>
        </section>
        <section
          id="help"
          className="border-t border-border bg-[#fcfdff] py-12"
        >
          <div
            className={`${container} flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center`}
          >
            <div className="flex items-center gap-4">
              <IconBox icon={CircleHelp} />
              <div>
                <h2 className="text-lg font-semibold text-[#0A2F6F]">
                  A little guidance goes a long way.
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get answers about matching, requirements, and applications.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setModal({ kind: "help" })}
            >
              Visit the Help Center
              <ArrowRight size={15} />
            </Button>
          </div>
        </section>
        <section className="relative overflow-hidden bg-[#0A2F6F] py-20 text-center lg:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-40 size-[420px] rounded-full border border-white/[0.06]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-64 -right-32 size-[500px] rounded-full border-[50px] border-white/[0.025]"
          />
          <div className={`${container} relative`}>
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#F4C430]">
              <GraduationCap size={26} strokeWidth={1.5} />
            </div>
            <h2 className="mx-auto max-w-[650px] text-[32px] font-bold leading-[1.25] tracking-[-0.5px] text-white sm:text-[40px]">
              Start Your Scholarship Journey with ScholarMatch
            </h2>
            <p className="mx-auto mt-5 max-w-[580px] text-base leading-7 text-blue-100">
              Create your applicant profile and discover scholarship
              opportunities that may match your qualifications.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                variant="white"
                onClick={() => setModal({ kind: "signup" })}
              >
                Create Your Account
                <ArrowRight size={15} />
              </Button>
              <Button
                variant="secondary"
                className="border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10"
                onClick={browse}
              >
                Browse Scholarships
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#071F4A] pb-7 pt-16 text-white">
        <div className={container}>
          <div className="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-14">
            <div>
              <a href="#home">
                <Logo light />
              </a>
              <p className="mt-5 max-w-[290px] text-sm leading-7 text-[#b3bfd4]">
                Helping students discover, understand, apply for, and monitor
                scholarship opportunities.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] text-[#b3bfd4]">
                <ShieldCheck size={15} className="text-[#F4C430]" />
                Clear guidance. Human decisions.
              </div>
            </div>
            {[
              {
                title: "ScholarMatch",
                links: [
                  { label: "Home", href: "#home" },
                  { label: "Scholarships", href: "#scholarships" },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "About", href: "#about" },
                ],
              },
              {
                title: "Applicants",
                links: [
                  { label: "Create Account", kind: "signup" },
                  { label: "Log In", kind: "login" },
                  { label: "Application Tracking", href: "#tracking" },
                  { label: "Help Center", kind: "help" },
                ],
              },
              {
                title: "Support",
                links: [
                  { label: "Contact", kind: "contact" },
                  { label: "Frequently Asked Questions", kind: "help" },
                  { label: "Privacy Policy", kind: "privacy" },
                  { label: "Terms of Use", kind: "terms" },
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 text-sm font-semibold">{group.title}</h3>
                <ul className="space-y-1">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {"href" in link ? (
                        <a
                          className="inline-flex min-h-9 items-center text-xs text-[#b3bfd4] transition hover:text-white"
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <button
                          className="min-h-9 text-left text-xs text-[#b3bfd4] transition hover:text-white"
                          onClick={() =>
                            setModal({
                              kind: link.kind as NonNullable<Modal>["kind"],
                            })
                          }
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col justify-between gap-3 text-[10px] text-[#b3bfd4] sm:flex-row">
              <p>© 2026 ScholarMatch. All rights reserved.</p>
              <p>Designed to help you take the next step.</p>
            </div>
            <p className="mt-5 max-w-[1000px] text-[10px] leading-5 text-[#9aaac5]">
              ScholarMatch provides AI-assisted scholarship recommendations and
              preliminary eligibility screening. Final eligibility verification
              and scholarship decisions remain with authorized scholarship
              personnel. This is a platform design preview; no government
              adoption or partnership is implied.
            </p>
          </div>
        </div>
      </footer>
      <DemoDialog
        modal={modal}
        close={() => {
          setModal(null)
        }}
      />
    </>
  )
}
