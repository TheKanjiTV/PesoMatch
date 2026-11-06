import { lazy, Suspense, useEffect, useState } from "react"

import { Link } from "react-router"

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  MapPin,
  Menu,
  Route,
  X,
} from "lucide-react"

import { accountRequest } from "../services/account.js"

import { withMinimumLoading } from "./loading.js"

import {
  Brand,
  title,
  Badge,
  Sample,
  Source,
  date,
  primaryStyle,
  secondaryStyle,
  LogoLoading,
} from "./ui.jsx"

import { AppearanceControls } from "./Appearance.jsx"

import { MotionLink } from "./MotionLink.jsx"

import { InstallButton } from "./AppRuntime.jsx"

const PathwayScene = lazy(() => import("./PathwayScene.jsx"))

const journey = [
  "Register & build your profile",

  "Explore vacancies & matching",

  "Get a PESO referral",

  "Enroll & develop your skills",

  "Facilitate employment & placement",

  "Monitor employment outcomes",
]

export default function Landing() {
  const [catalog, setCatalog] = useState(null),
    [error, setError] = useState(""),
    [open, setOpen] = useState(false)

  useEffect(() => {
    document.title = title

    let alive = true

    withMinimumLoading(() => accountRequest("/api/public/catalog"))

      .then((data) => {
        if (alive) setCatalog(data)
      })

      .catch((e) => {
        if (alive) setError(e.message)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false)

        document.querySelector('[aria-label="Toggle navigation"]')?.focus()
      }
    }

    document.addEventListener("keydown", close)

    return () => document.removeEventListener("keydown", close)
  }, [open])

  return (
    <div className="public-portal bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded bg-primary px-5 py-3 text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="public-header border-b border-border bg-card">
        <div className="mx-auto flex min-h-24 max-w-[1360px] flex-wrap items-center justify-between gap-4 px-6 lg:px-12">
          <Brand />
          <nav
            aria-label="Public navigation"
            className="hidden items-center gap-7 text-sm lg:flex"
          >
            <a href="#services">PESO services</a>
            <a href="#opportunities">Find work</a>
            <a href="#upskilling">Build skills</a>
            <a href="#how-it-works">Your pathway</a>
          </nav>
          <div className="flex items-center gap-3">
            <AppearanceControls compact />
            <MotionLink to="/login" className={secondaryStyle}>
              Sign in
            </MotionLink>
            <MotionLink
              to="/register"
              className={`${primaryStyle} hidden sm:inline-flex`}
            >
              Register
              <ArrowUpRight size={15} />
            </MotionLink>
            <button
              aria-label="Toggle navigation"
              aria-expanded={open}
              aria-controls="mobile-public-navigation"
              onClick={() => setOpen(!open)}
              className="min-h-11 px-2 lg:hidden"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
          {open && (
            <nav
              id="mobile-public-navigation"
              aria-label="Mobile public navigation"
              className="grid w-full gap-1 border-t border-border py-3 lg:hidden"
            >
              {[
                ["PESO services", "#services"],

                ["Find work", "#opportunities"],

                ["Build skills", "#upskilling"],

                ["Your pathway", "#how-it-works"],

                ["Register", "/register"],
              ].map(([l, to]) =>
                to.startsWith("/") ? (
                  <MotionLink
                    key={l}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="py-3 text-sm"
                  >
                    {l}
                  </MotionLink>
                ) : (
                  <a
                    key={l}
                    href={to}
                    onClick={() => setOpen(false)}
                    className="py-3 text-sm"
                  >
                    {l}
                  </a>
                ),
              )}
            </nav>
          )}
        </div>
      </header>
      <main id="main-content">
        <section className="landing-hero mx-auto grid max-w-[1440px] gap-8 px-6 py-12 lg:grid-cols-[.95fr_1.15fr] lg:gap-10 lg:px-12 lg:py-16">
          <div>
            <h1 className="max-w-[650px] font-display font-bold text-[clamp(3rem,5.4vw,5.3rem)] leading-[1.06] tracking-[-0.035em] text-primary">
              Good work starts with a{" "}
              <span className="text-accent">clear path.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-muted-foreground">
              From your first profile to your next opportunity. Find work, build
              practical skills, and stay connected to your PESO through every
              step of your employment journey.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <MotionLink to="/register" className={primaryStyle}>
                Start your employment journey
                <ArrowRight size={17} />
              </MotionLink>
              <a href="#services" className={secondaryStyle}>
                Explore services
                <ArrowDown size={16} />
              </a>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              Jobseeker registration is free. Already registered?{" "}
              <MotionLink
                to="/login"
                className="font-semibold text-primary underline underline-offset-4"
              >
                Continue your journey
              </MotionLink>
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <InstallButton />
              <Link
                to="/app"
                className="text-sm font-bold text-primary underline underline-offset-4"
              >
                PESO on your phone
              </Link>
            </div>
            <div className="mt-8 border-t border-border pt-5">
              <p className="max-w-xl text-xs leading-6 text-muted-foreground">
                {title}
              </p>
            </div>
          </div>
          <div className="min-w-0 self-center">
            <Suspense
              fallback={
                <div className="scene-placeholder">
                  Preparing your employment pathway…
                </div>
              }
            >
              <PathwayScene />
            </Suspense>
          </div>
        </section>
        <section id="services" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1360px] gap-8 px-6 py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-12">
            <div>
              <h2 className="max-w-sm font-display text-4xl leading-tight text-primary">
                More than finding a vacancy.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                PESO connects employment services, upskilling, and ongoing
                support in one place.
              </p>
              <Link
                to="/register"
                className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary"
              >
                Connect with PESO
                <ArrowRight size={17} />
              </Link>
            </div>
            <div>
              {[
                [
                  "Employment facilitation",

                  "Register your skills and preferences, explore vacancies, review match explanations, and request a PESO referral.",
                ],

                [
                  "Upskilling & training enrollment",

                  "Explore training, understand requirements, request enrollment, and track provider-confirmed progress.",
                ],

                [
                  "Placement & continued support",

                  "Follow referrals and interviews, review verified placements, and report changes in your employment status.",
                ],

                [
                  "Career & community services",

                  "Request counseling, orientation, assessments, livelihood referrals, reintegration assistance, and support for employment programs.",
                ],
              ].map(([h, p], i) => (
                <div
                  key={h}
                  className="grid gap-3 border-b border-border py-5 first:pt-0 last:border-0 sm:grid-cols-[1fr_1.4fr]"
                >
                  <h3 className="text-base font-semibold text-primary">{h}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="opportunities"
          className="mx-auto max-w-[1360px] px-6 py-14 lg:px-12"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 className="font-display text-4xl text-primary">
                Your next opportunity.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore source-listed opportunities and PESO-managed vacancies.
              </p>
            </div>
            <Link to="/login" className={secondaryStyle}>
              Explore vacancies
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {error && (
            <p role="alert" className="text-sm text-error-ink">
              The catalog is unavailable.{" "}
              <button
                className="underline"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
              .
            </p>
          )}
          {!catalog && !error && <LogoLoading label="Loading opportunities…" />}
          <div className="grid gap-4 md:grid-cols-2">
            {catalog?.vacancies.slice(0, 4).map((v) => (
              <article
                key={v.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge>{v.employment_type}</Badge>
                  <Sample record={v} />
                  <Source record={v} />
                  {v.external_application && (
                    <span className="text-xs text-muted-foreground">
                      Confirm availability on source
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-primary">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {v.organization}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} />
                    {v.location}
                  </span>
                  <Link
                    to="/login"
                    aria-label={`View vacancy: ${v.title}`}
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
                  >
                    View vacancy
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {catalog && !catalog.vacancies.length && (
            <p className="rounded-md border border-border p-7 text-sm text-muted-foreground">
              PESO has no published vacancies yet. Register to prepare your
              profile.
            </p>
          )}
        </section>
        <section
          id="upskilling"
          className="upskilling-section bg-[#123d35] text-[#f6f7ee]"
        >
          <div className="mx-auto grid max-w-[1360px] gap-10 px-6 py-14 lg:grid-cols-[.8fr_1.2fr] lg:px-12">
            <div>
              <GraduationCap size={35} strokeWidth={1.4} />
              <h2 className="mt-6 max-w-sm font-display text-4xl leading-tight">
                Build skills.
                <br />
                Open new doors.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#d4e0d5]">
                Get training recommendations based on skill gaps, explore
                program requirements, and follow your enrollment from request to
                completion.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-lg bg-[#e8eddd] px-5 py-3 text-sm font-bold text-[#123d35]"
              >
                Explore your skills pathway
                <ArrowRight size={16} />
              </Link>
            </div>
            <div>
              {catalog?.training.map((p) => (
                <article
                  key={p.id}
                  className="border-b border-white/20 py-6 first:pt-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">{p.title}</h3>
                    <Sample record={p} />
                  </div>
                  <p className="mt-3 text-sm text-[#d4e0d5]">
                    {p.provider} · {p.mode}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-[#d4e0d5]">
                    <span>
                      {p.external_enrollment
                        ? p.catalog_type === "online_course"
                          ? "Official online course · Self-paced"
                          : p.catalog_type === "overseas_training"
                            ? "Official overseas announcement · Confirm intake"
                            : "Registered program · Confirm intake"
                        : `Starts ${date(p.starts_on)}`}
                    </span>
                    <Link
                      to="/login"
                      aria-label={`View program: ${p.title}`}
                      className="inline-flex min-h-8 items-center gap-2 font-semibold text-white"
                    >
                      View program
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
              <p className="mt-5 text-xs leading-6 text-[#d4e0d5]">
                Enrollment is subject to provider review and available places.
                Sample programs are not TESDA offerings. An enrollment request
                does not reserve a scholarship or issue a National Certificate.
              </p>
            </div>
          </div>
        </section>
        <section
          id="how-it-works"
          className="mx-auto max-w-[1360px] px-6 py-14 lg:px-12"
        >
          <h2 className="font-display text-4xl text-primary">
            Support at every stage.
          </h2>
          <ol className="journey-strip">
            {journey.map((step, i) => (
              <li key={step}>
                <span>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {[
              [
                "Make your profile count.",

                "Tell us about your education, skills, experience, and employment preferences. Keep your information up to date.",
              ],

              [
                "Choose your next step.",

                "Review suggested vacancies and training. Matching explains its reasons; your PESO officer helps you decide what comes next.",
              ],

              [
                "Stay connected to PESO.",

                "Track referrals, enrollment and placement. Report your employment status so PESO can provide the right follow-up support.",
              ],
            ].map(([h, p]) => (
              <div key={h} className="border-t border-[#b6c3ad] pt-6">
                <h3 className="font-display text-2xl text-primary">{h}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  {p}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section
          id="help"
          className="mx-auto max-w-[1360px] border-t border-border px-6 py-12 lg:px-12"
        >
          <h2 className="font-display text-3xl text-primary">
            Before you begin.
          </h2>
          <div className="mt-6 grid gap-x-12 md:grid-cols-2">
            {[
              [
                "Does a match guarantee employment?",

                "No. Matching is advisory. PESO reviews referrals and the employer makes the hiring decision.",
              ],

              [
                "Who confirms training enrollment?",

                "The training provider or authorized PESO officer confirms the request after checking requirements and capacity.",
              ],

              [
                "Can employers and providers register here?",

                "Public registration is for jobseekers. A PESO administrator provisions partner access on an existing account.",
              ],

              [
                "What information does monitoring show?",

                "Your reported employment status and PESO verification. Labor market information covers platform records only.",
              ],
            ].map(([q, a]) => (
              <details key={q} className="border-b border-border py-5">
                <summary className="min-h-8 text-sm font-semibold text-primary">
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-muted">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-start justify-between gap-7 px-6 py-9 lg:px-12">
          <div>
            <Brand />
            <p className="mt-5 max-w-xl text-xs leading-6 text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              © {new Date().getFullYear()} PesoMatch · Local academic platform.
              No government affiliation implied.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-primary">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/help">Official help</Link>
            <Link to="/staff/login">Staff & partner sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
