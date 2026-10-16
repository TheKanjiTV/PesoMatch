import { useState } from "react"

import { useSearchParams } from "react-router"

import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Users,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext.jsx"

import {
  Button,
  EmptyState,
  Field,
  panel,
} from "../../components/common/UI.jsx"

import { JourneyLink } from "../../components/common/JourneyLink.jsx"

import { SupportWidget } from "../../components/activity/SupportWidget.jsx"

import { canCreateCompany } from "../../services/businessPermissions.js"

import { useDemoState } from "../../hooks/useDemoState.js"

import {
  AdminTutorial,
  AdminFeatures,
  TutorialPicture,
  TutorialViewer,
} from "../../components/business/AdminTutorial.jsx"

import { adminGuide } from "../../data/adminGuide.js"

export function AdminCenterPage() {
  const [params] = useSearchParams()

  const [viewer, setViewer] = useState(null)

  const [supportRequest, setSupportRequest] = useState(0)

  return (
    <div className="bg-white">
      <div className="bg-[#26344a] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-5 py-2 text-xs sm:px-8">
          <span>PESO employment services</span>
          <JourneyLink to="/help/staff" className="py-1 hover:underline">
            Help for PESO teams
          </JourneyLink>
        </div>
      </div>
      <nav
        aria-label="Admin Center navigation"
        className="border-b border-border bg-white"
      >
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-5 sm:px-8">
          <JourneyLink
            to="/dashboard"
            className="inline-flex flex-wrap items-center gap-2 text-lg font-semibold text-primary"
            aria-label="PesoMatch Home"
          >
            <BriefcaseBusiness size={24} /> PesoMatch{" "}
            <span className="ml-1 border-l border-border pl-3 text-sm font-normal text-muted-foreground">
              Admin Center
            </span>
          </JourneyLink>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-primary">
            <JourneyLink to="/business/hire" className="py-2">
              Employer services
            </JourneyLink>
            <a href="#workflow-guide" className="py-2">
              Workflow guide
            </a>
            <a href="#admin-resources" className="py-2">
              Resources
            </a>
            <button
              onClick={() => setSupportRequest((value) => value + 1)}
              className="min-h-10 rounded-full border border-primary px-4 py-2"
            >
              Contact support
            </button>
          </div>
        </div>
      </nav>
      <div className="bg-[#dce8ff] px-5 py-4 text-center text-sm leading-6 text-[#26344a]">
        From the first request to the next opportunity.{" "}
        <a
          href="#workflow-guide"
          className="font-semibold text-[#283bd1] underline underline-offset-4"
        >
          Explore the picture guide.
        </a>
      </div>
      <section className="bg-[#f6f5f2]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-20">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[0.12em] text-[#596176]">
              FOR PESO TEAMS
            </p>
            <h1 className="max-w-lg text-[38px] font-medium leading-[1.2] tracking-[-0.035em] sm:text-[52px]">
              Welcome to
              <br />
              <span className="text-primary">PesoMatch</span>
              <br />
              Admin Center.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-muted-foreground">
              Help jobseekers move forward. Review requests, coordinate
              referrals, and keep every next step in one workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/peso/dashboard" className="!rounded-full px-5">
                Enter Staff Portal <ArrowRight size={17} />
              </Button>
              <a
                href="#workflow-guide"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary hover:bg-secondary"
              >
                Explore the workflow
              </a>
            </div>
            <p className="mt-5 max-w-md text-xs leading-6 text-muted-foreground">
              Staff & Admin demo access uses sample records. Your account role
              stays the same.
            </p>
          </div>
          <AdminTutorial onExpand={setViewer} />
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-medium leading-snug sm:text-4xl">
          Support every step of the employment journey
        </h2>
        <div className="mt-12 grid gap-9 md:grid-cols-3 md:gap-10">
          {[
            [
              Users,
              "A connected workspace",
              "Read profiles, assistance history and selected opportunities together, so each decision starts with the full picture.",
            ],

            [
              Handshake,
              "A clearer next step",
              "Move from review to referral, employer coordination and follow-up with actions suited to the current stage.",
            ],

            [
              ShieldCheck,
              "Updates people can trust",
              "Keep jobseeker updates separate from internal notes, and review the trail of staff actions.",
            ],
          ].map(([Icon, title, text]) => (
            <article key={title}>
              <div className="grid size-24 place-items-center rounded-full bg-[#e4edff]">
                <Icon size={40} strokeWidth={1.5} className="text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
      <AdminFeatures onExpand={setViewer} />
      <section className="bg-[#dce8ff]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <button
            onClick={() => setViewer(3)}
            aria-label="Open public updates picture guide"
            className="rounded-xl bg-[#c7d8fb] p-4 text-left sm:p-6"
          >
            <TutorialPicture slide={adminGuide[3]} />
          </button>
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#283bd1]">
              CLEAR COMMUNICATION
            </p>
            <h2 className="mt-4 text-2xl font-medium sm:text-3xl">
              Keep the jobseeker in the loop.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-8 text-[#44506a]">
              A status is more useful when it comes with a clear next step.
              Preview the public timeline while keeping internal coordination
              notes in the staff workspace.
            </p>
            <button
              onClick={() => setViewer(3)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#283bd1] hover:underline"
            >
              View the update guide <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <section
        id="admin-resources"
        className="mx-auto max-w-[1200px] scroll-mt-8 px-5 py-14 sm:px-8 sm:py-20"
      >
        <h2 className="text-center text-3xl font-medium sm:text-4xl">
          Picture guides to get you started
        </h2>
        <p className="mt-4 text-center text-sm leading-7 text-muted-foreground">
          Choose a guide and follow the screens at your own pace.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {adminGuide.map((slide, i) => (
            <article key={slide.id}>
              <button
                onClick={() => setViewer(i)}
                aria-label={`Open ${slide.resource}`}
                className="block w-full overflow-hidden rounded-lg bg-secondary p-2 text-left"
              >
                <TutorialPicture slide={slide} />
              </button>
              <h3 className="mt-5 text-base font-semibold">{slide.resource}</h3>
              <p className="mt-3 text-xs leading-7 text-muted-foreground">
                {slide.instruction}
              </p>
              <button
                onClick={() => setViewer(i)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                View picture guide <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#26344a] px-5 py-14 text-center text-white sm:py-16">
        <h2 className="mx-auto max-w-3xl text-3xl font-medium leading-snug sm:text-4xl">
          Bring every assistance request into one clear workflow.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#d8dfec]">
          Explore the Staff Portal, or read the help guide before your first
          review.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <JourneyLink
            to="/peso/dashboard"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-secondary"
          >
            Open staff preview
          </JourneyLink>
          <JourneyLink
            to="/help/staff"
            className="inline-flex min-h-11 items-center rounded-full border border-white/60 px-6 py-3 text-sm font-medium hover:bg-white/10"
          >
            Resources & Support
          </JourneyLink>
        </div>
      </section>
      <footer className="flex flex-wrap justify-center gap-5 bg-[#f7f8fa] px-5 pb-24 pt-8 text-xs text-muted-foreground sm:pb-20">
        <JourneyLink to="/help">Help Center</JourneyLink>
        <JourneyLink to="/privacy">Privacy Policy</JourneyLink>
        <JourneyLink to="/terms">Terms</JourneyLink>
        <span>&copy; PesoMatch</span>
      </footer>
      {viewer !== null && (
        <TutorialViewer
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
        />
      )}
      <SupportWidget
        initiallyOpen={params.get("support") === "1"}
        openRequest={supportRequest}
      />
    </div>
  )
}

export function HirePage() {
  return (
    <div className="mx-auto max-w-[850px]">
      <header className="py-10">
        <BriefcaseBusiness size={32} className="text-primary" />
        <h1 className="mt-5 text-3xl font-semibold">Hire on PesoMatch</h1>
        <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
          Explore how employers and PESO can connect opportunities with
          jobseekers. Employer posting and verification are not connected in
          this prototype.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        <section className={`${panel} p-6`}>
          <h2 className="text-lg font-semibold">Coordinate with PESO</h2>
          <p className="mt-3 text-xs leading-7 text-muted-foreground">
            The staff preview includes employer coordination and vacancy
            reference records.
          </p>
          <Button to="/business/admin-center" className="mt-5 text-xs">
            Open Admin Center
          </Button>
        </section>
        <section className={`${panel} p-6`}>
          <h2 className="text-lg font-semibold">Support skills development</h2>
          <p className="mt-3 text-xs leading-7 text-muted-foreground">
            Explore sample training related to job qualifications and skills.
          </p>
          <Button to="/training" variant="secondary" className="mt-5 text-xs">
            Learn with PesoMatch
          </Button>
        </section>
      </div>
    </div>
  )
}

export function CompanyPageDraft() {
  const { user } = useAuth(),
    [drafts, setDrafts] = useDemoState(user?.id, "company-drafts"),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [saved, setSaved] = useState(false)

  if (!canCreateCompany(user))
    return (
      <EmptyState
        title="Company pages are for employee and employer accounts"
        description="Your account cannot create a company-page draft."
        action={<Button to="/dashboard">Back to Home</Button>}
      />
    )

  return (
    <section className={`${panel} mx-auto max-w-xl p-6`}>
      <h1 className="text-2xl font-semibold">Create a Company Page</h1>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Create a browser-only draft. Company publishing and verification are not
        connected yet.
      </p>
      {saved ? (
        <>
          <p role="status" className="mt-5 text-sm">
            Company draft saved on this browser.
          </p>
          <Button onClick={() => setSaved(false)} className="mt-4">
            Edit draft
          </Button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()

            setDrafts([
              ...drafts,

              {
                id: Date.now(),

                name: name.trim(),

                description: description.trim(),
              },
            ])

            setSaved(true)
          }}
          className="mt-5 space-y-4"
        >
          <Field
            required
            label="Company name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            textarea
            label="Description"
            value={description}
            maxLength={1000}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit">Save draft</Button>
        </form>
      )}
    </section>
  )
}
