import { useEffect, useRef, useState } from "react"

import { Link, useLocation } from "react-router"

import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleAlert,
  GraduationCap,
  Headphones,
  MapPin,
  Menu,
  Search,
  Target,
  UserRound,
  X,
} from "lucide-react"

import { jobs, trainings, jobTrainings } from "../data/opportunities.js"

import { CompanyMark, WorkplaceBanner } from "../components/jobs/JobVisuals.jsx"

const container = "mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-10"

const action =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[#283cdd]"

const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#eef2f8] px-5 py-3 text-[13px] font-semibold text-[#526075] transition hover:bg-[#e3e9f4]"

const control =
  "min-h-11 w-full rounded-lg border border-[#e4e8f0] bg-white px-3 text-[13px] text-[#334155] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"

const companies = {
  "customer-service": {
    name: "Mindoro Connect",
    caption: "Customer support",
    brandIndex: 0,
  },

  administrative: {
    name: "Northline Office",
    caption: "Office administration",
    brandIndex: 1,
  },

  sales: { name: "Everyday Market", caption: "Retail & sales", brandIndex: 2 },
}

const nav = [
  ["Jobs", "jobs"],
  ["Training", "training"],
  ["How it works", "how-it-works"],
  ["About", "about"],
  ["Help", "help"],
]

function AccountLink({ onClick, ...props }) {
  return (
    <Link
      {...props}
      viewTransition
      onClick={(event) => {
        document.documentElement.dataset.pageTransition = "forward"
        onClick?.(event)
      }}
    />
  )
}

function Brand({ inverse = false }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${
        inverse ? "text-white" : "text-[#24283a]"
      }`}
    >
      <BriefcaseBusiness size={27} strokeWidth={2.3} aria-hidden="true" />
      <div>
        <span className="block text-[21px] font-semibold tracking-[-0.7px]">
          PesoMatch
        </span>
        <span
          className={`mt-0.5 block max-w-[215px] text-[7px] font-medium tracking-[0.07em] sm:text-[8px] ${
            inverse ? "text-white/85" : "text-[#64748b]"
          }`}
        >
          AI-POWERED EMPLOYMENT ASSISTANCE PLATFORM
        </span>
      </div>
    </div>
  )
}

function JobMark({ job, small = false }) {
  return <CompanyMark job={companies[job.id]} small={small} />
}

function JobDetails({ job, close }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current

    if (job) {
      dialog.showModal()
      dialog.scrollTop = 0
      document.body.classList.add("overflow-hidden")
    } else dialog.close()

    return () => document.body.classList.remove("overflow-hidden")
  }, [job])

  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(event) => {
        if (event.target === ref.current) close()
      }}
      aria-labelledby="job-title"
      className="m-auto max-h-[92dvh] w-[calc(100%_-_24px)] max-w-[1000px] overflow-y-auto rounded-2xl border-0 bg-[#f5f7fc] p-0 text-[#252a38] shadow-2xl backdrop:bg-[#182047]/55"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8ebf3] bg-white px-5 py-2.5 sm:px-8">
        <button
          onClick={close}
          className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-[#64748b]"
        >
          <ArrowRight size={15} className="rotate-180" /> Back to jobs
        </button>
        <span className="hidden text-xs text-[#64748b] sm:block">
          Find a role that fits your skills
        </span>
        <button
          aria-label="Close job details"
          onClick={close}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-[#eef2f8]"
        >
          <X size={20} />
        </button>
      </div>
      {job && (
        <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-hidden rounded-xl bg-white">
            <WorkplaceBanner />
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <JobMark job={job} />
                <div>
                  <p className="text-lg font-semibold">
                    {companies[job.id].name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    {companies[job.id].caption}
                  </p>
                </div>
              </div>
              <h2
                id="job-title"
                className="mt-6 text-2xl font-semibold leading-snug tracking-[-0.5px]"
              >
                {job.title}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#64748b]">
                <MapPin size={14} />
                {job.location}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-5 border-y border-[#edf0f5] py-5 text-xs sm:grid-cols-3">
                {[
                  ["Employment type", job.type],
                  ["Job category", job.category],
                  ["Salary", "Not published"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-[#64748b]">{label}</dt>
                    <dd className="mt-1.5 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <section className="mt-6">
                <h3 className="text-sm font-semibold">About the job</h3>
                <p className="mt-2 text-[13px] leading-7 text-[#626d82]">
                  {job.description}
                </p>
              </section>
              <section className="mt-6">
                <h3 className="text-sm font-semibold">
                  Minimum qualifications
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {job.qualifications.map((text) => (
                    <li
                      key={text}
                      className="flex gap-2.5 text-[13px] leading-6 text-[#626d82]"
                    >
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-[#a6afbf]" />
                      {text}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="mt-6">
                <h3 className="text-sm font-semibold">
                  Required skills & qualifications
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.skills.map((text) => (
                    <span
                      key={text}
                      className="rounded-md bg-[#f0f3f9] px-2.5 py-1.5 text-xs text-[#566176]"
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </section>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[#e8ebf3] pt-5">
                <span className="text-sm font-medium">
                  Interested in this job?
                </span>
                <AccountLink to="/register" onClick={close} className={action}>
                  Apply now <ArrowUpRight size={16} />
                </AccountLink>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-[#69748a]">
                Illustrative vacancy. Create a profile to explore the workspace;
                no application is sent to an employer from this preview.
              </p>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#68748b]">
                Example match assessment
              </p>
              <p className="mt-3 text-2xl font-semibold text-primary">
                {job.match}% Job Match
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748b]">
                Based on an example profile.
              </p>
              <h3 className="mt-5 text-sm font-semibold">Why you match</h3>
              <ul className="mt-3 space-y-2.5">
                {job.matched.map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-2 text-xs leading-5 text-[#536278]"
                  >
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-[#14824f]"
                    />
                    {text}
                  </li>
                ))}
              </ul>
              <h3 className="mt-5 text-sm font-semibold">Skills to improve</h3>
              <ul className="mt-3 space-y-2.5">
                {job.gaps.map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-2 text-xs leading-5 text-[#536278]"
                  >
                    <CircleAlert
                      size={15}
                      className="mt-0.5 shrink-0 text-[#9a661d]"
                    />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white p-5">
              <h3 className="text-sm font-semibold">Recommended training</h3>
              <div className="mt-3 divide-y divide-[#edf0f5]">
                {jobTrainings(job).map((item) => (
                  <a
                    key={item.id}
                    href={`#training-${item.id}`}
                    onClick={() => {
                      delete document.documentElement.dataset.pageTransition
                      close()
                    }}
                    className="flex min-h-12 items-center justify-between gap-3 py-3 text-xs font-medium leading-5 text-primary"
                  >
                    {item.name}
                    <ArrowUpRight size={15} className="shrink-0" />
                  </a>
                ))}
              </div>
            </div>
            <p className="px-1 text-[11px] leading-5 text-[#64748b]">
              PESO assists with referrals. Employers make final hiring
              decisions.
            </p>
          </aside>
        </div>
      )}
    </dialog>
  )
}

export default function LandingPage() {
  const { hash } = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)

  const [activeSection, setActiveSection] = useState("")

  const [job, setJob] = useState(null)

  const [keyword, setKeyword] = useState("")

  const [category, setCategory] = useState("All categories")

  const [location, setLocation] = useState("All locations")

  const [type, setType] = useState("All types")

  const [skillJobId, setSkillJobId] = useState(jobs[0].id)

  const skillJob = jobs.find((item) => item.id === skillJobId)

  const visible = jobs.filter(
    (item) =>
      (category === "All categories" || item.category === category) &&
      (location === "All locations" || item.location === location) &&
      (type === "All types" || item.type === type) &&
      `${item.title} ${item.category} ${item.skills.join(" ")}`
        .toLowerCase()
        .includes(keyword.toLowerCase().trim()),
  )

  useEffect(() => {
    let frame

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const sections = nav
          .map(([, id]) => document.getElementById(id))
          .filter(Boolean)
        const current = sections
          .filter((el) => el.getBoundingClientRect().top <= 210)
          .sort((a, b) => b.offsetTop - a.offsetTop)[0]
        setActiveSection(
          window.scrollY + innerHeight >=
            document.documentElement.scrollHeight - 8
            ? "help"
            : current?.id || "",
        )
      })
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  useEffect(() => {
    document.title = "PesoMatch - Jobs, Training & PESO Assistance"
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
      else window.scrollTo({ top: 0, behavior: "instant" })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash])

  useEffect(() => {
    if (!mobileOpen) return
    const escape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false)
        document.getElementById("public-menu-toggle")?.focus()
      }
    }
    window.addEventListener("keydown", escape)
    return () => window.removeEventListener("keydown", escape)
  }, [mobileOpen])

  const clearFilters = () => {
    setKeyword("")
    setCategory("All categories")
    setLocation("All locations")
    setType("All types")
  }

  const navigateSection = (id) => {
    // Section links: scrolling lang (default smooth scroll), walang page slide left/right.

    // Burahin ang stale pageTransition para hindi mag-slide; itira ang login/create slide.

    delete document.documentElement.dataset.pageTransition

    setActiveSection(id)

    setMobileOpen(false)
  }

  return (
    <div className="bg-white text-[#252a38]">
      <a
        href="#main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-white px-5 py-3 text-primary shadow-lg focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-primary text-white shadow-[0_2px_14px_rgba(46,65,175,0.08)]">
        <div
          className={`${container} flex min-h-[84px] items-center justify-between gap-5`}
        >
          <a
            href="#home"
            aria-label="PesoMatch home"
            onClick={() =>
              delete document.documentElement.dataset.pageTransition
            }
          >
            <Brand inverse />
          </a>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 lg:flex"
          >
            {nav.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={activeSection === id ? "location" : undefined}
                onClick={() => navigateSection(id)}
                className={`relative inline-flex min-h-11 items-center py-3 text-[12px] font-medium after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:rounded-full after:bg-white after:transition-transform ${
                  activeSection === id
                    ? "text-white after:scale-x-100"
                    : "text-white/85 hover:text-white after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <AccountLink
              to="/login"
              className="py-3 text-xs font-semibold text-white"
            >
              Log In
            </AccountLink>
            <AccountLink
              to="/register"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-xs font-semibold text-primary transition hover:bg-[#eef0ff]"
            >
              Create Account <ArrowRight size={15} />
            </AccountLink>
          </div>
          <button
            id="public-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-white/20 px-5 pb-5 lg:hidden"
          >
            {nav.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => navigateSection(id)}
                aria-current={activeSection === id ? "location" : undefined}
                className={`block border-b border-white/15 py-3.5 text-sm ${
                  activeSection === id
                    ? "font-semibold underline decoration-2 underline-offset-8"
                    : "text-white/85"
                }`}
              >
                {label}
              </a>
            ))}
            <div className="mt-4 flex gap-3">
              <AccountLink
                to="/login"
                className="inline-flex min-h-11 items-center rounded-lg border border-white/50 px-5 text-sm font-medium"
              >
                Log In
              </AccountLink>
              <AccountLink
                to="/register"
                className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-semibold text-primary"
              >
                Create Account
              </AccountLink>
            </div>
          </nav>
        )}
      </header>
      <main id="main">
        <section
          id="home"
          className="scroll-mt-24 overflow-hidden bg-[#f5f7fc]"
        >
          <div
            className={`${container} grid items-center gap-10 pb-10 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-8 lg:pb-14 lg:pt-14`}
          >
            <div className="max-w-[600px]">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <span className="h-px w-7 bg-primary" /> Your career starts here
              </p>
              <h1 className="mt-5 text-[clamp(2.3rem,4vw,3.75rem)] font-semibold leading-[1.16] tracking-[-0.055em]">
                Your next opportunity.
                <br />
                <span className="text-primary">
                  A job that fits
                  <br className="hidden lg:block" /> your skills.
                </span>
              </h1>
              <p className="mt-5 max-w-[440px] text-[14px] leading-7 text-[#626d82]">
                Find your next role, build the skills you need, and move forward
                with employment support from PESO.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#jobs"
                  onClick={() => navigateSection("jobs")}
                  className={action}
                >
                  Explore Jobs <ArrowRight size={16} />
                </a>
                <AccountLink
                  to="/register"
                  className="inline-flex min-h-11 items-center gap-2 px-2 text-[13px] font-medium text-[#384458]"
                >
                  Create Jobseeker Profile <ArrowUpRight size={16} />
                </AccountLink>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#626d82]">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-primary" /> Skills-based
                  matching
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-primary" /> Local
                  opportunities
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[550px] pb-9 pl-3 sm:pl-8">
              <img
                src="/images/career-professional.jpg"
                alt="A smiling professional holding a laptop in an office"
                fetchPriority="high"
                className="h-[290px] w-full rounded-[20px] object-cover object-[center_30%] sm:h-[370px] lg:h-[410px]"
              />
              <div className="absolute right-3 top-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm sm:right-4">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#e9f8ef] text-[#198350]">
                  <Check size={15} />
                </span>
                <span className="text-[11px] font-medium">
                  Your skills. New possibilities.
                </span>
              </div>
              <div className="absolute bottom-0 left-0 w-[85%] max-w-[355px] rounded-xl bg-white p-4 shadow-[0_10px_40px_-10px_rgba(47,64,154,0.2)] sm:p-5">
                <div className="flex items-center gap-3">
                  <JobMark job={jobs[0]} small />
                  <div>
                    <p className="text-xs font-semibold">
                      Find your next opportunity
                    </p>
                    <p className="mt-1 text-[11px] text-[#626d82]">
                      Based on the skills you bring.
                    </p>
                  </div>
                  <Target size={19} className="ml-auto shrink-0 text-primary" />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#edf0f5] pt-3">
                  <span className="text-[11px] text-[#626d82]">
                    A little direction goes a long way.
                  </span>
                  <a
                    href="#how-it-works"
                    onClick={() =>
                      delete document.documentElement.dataset.pageTransition
                    }
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef0ff] text-primary"
                    aria-label="See how PesoMatch works"
                  >
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className={`${container} pb-9`}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                delete document.documentElement.dataset.pageTransition
                document
                  .getElementById("jobs")
                  ?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  })
                navigateSection("jobs")
              }}
              className="grid gap-3 rounded-xl bg-white p-3 shadow-[0_4px_24px_rgba(55,74,132,0.05)] md:grid-cols-[1.4fr_1fr_auto]"
            >
              <label className="flex items-center gap-3 px-3">
                <Search size={19} className="shrink-0 text-[#97a2b3]" />
                <span className="sr-only">Search jobs or skills</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, keyword, or skill"
                  className="min-h-12 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                />
              </label>
              <label className="flex items-center gap-3 border-t border-[#edf0f5] px-3 md:border-l md:border-t-0">
                <MapPin size={19} className="shrink-0 text-[#97a2b3]" />
                <span className="sr-only">Preferred location</span>
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="min-h-12 min-w-0 flex-1 bg-white text-[13px] text-[#626d82] outline-none"
                >
                  <option>All locations</option>
                  {[...new Set(jobs.map((item) => item.location))].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
              <button className={`${action} px-9`}>
                <Search size={16} /> Search Jobs
              </button>
            </form>
          </div>
        </section>

        <section id="jobs" className="scroll-mt-24 bg-[#f5f7fc] pb-14 pt-4">
          <div className={container}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[25px] font-semibold tracking-[-0.8px] sm:text-[29px]">
                  Discover your next role
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#626d82]">
                  Explore opportunities across customer service, office work,
                  and retail.
                </p>
              </div>
              <span className="text-xs text-[#626d82]">
                {visible.length}{" "}
                {visible.length === 1 ? "opportunity" : "opportunities"} to
                explore
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <label className="sr-only" htmlFor="job-category">
                Job category
              </label>
              <select
                id="job-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={control}
              >
                <option>All categories</option>
                {[...new Set(jobs.map((item) => item.category))].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="job-location">
                Location
              </label>
              <select
                id="job-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className={control}
              >
                <option>All locations</option>
                {[...new Set(jobs.map((item) => item.location))].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="job-type">
                Employment type
              </label>
              <select
                id="job-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={control}
              >
                <option>All types</option>
                <option>Full-time</option>
                <option>Part-time</option>
              </select>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <article
                  key={item.id}
                  className="relative flex flex-col rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(46,63,125,0.02)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(46,63,125,0.09)]"
                >
                  <div className="flex items-center gap-3">
                    <JobMark job={item} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold tracking-[-0.3px]">
                        {companies[item.id].name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#626d82]">
                        {companies[item.id].caption}
                      </p>
                    </div>
                    <AccountLink
                      to="/login"
                      aria-label={`Save ${item.title}`}
                      className="relative z-10 ml-auto flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f6fa] text-[#758093] hover:bg-[#e9edff] hover:text-primary"
                    >
                      <Bookmark size={17} />
                    </AccountLink>
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold leading-6 tracking-[-0.3px]">
                    {item.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#626d82]">
                    <MapPin size={12} />
                    {item.location}
                  </p>
                  <p className="mt-5 text-xs font-medium">Job Description</p>
                  <p className="mt-2 text-[12px] leading-6 text-[#626d82]">
                    {item.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md bg-[#f0f3f8] px-2 py-1.5 text-[10px] text-[#626d82]">
                      {item.type}
                    </span>
                    <span className="rounded-md bg-[#f0f3f8] px-2 py-1.5 text-[10px] text-[#626d82]">
                      On-site
                    </span>
                    <span className="rounded-md bg-[#edf0ff] px-2 py-1.5 text-[10px] text-primary">
                      Skills-based role
                    </span>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <AccountLink
                      to="/register"
                      className={`${action} relative z-10 min-h-10 px-3 py-2 text-[11px]`}
                    >
                      Apply now
                    </AccountLink>
                    <button
                      onClick={() => setJob(item)}
                      className={`${secondary} min-h-10 px-3 py-2 text-[11px] after:absolute after:inset-0 after:rounded-xl`}
                    >
                      <span>View details</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {visible.length === 0 && (
              <div className="mt-5 rounded-xl bg-white px-6 py-12 text-center">
                <Search size={25} className="mx-auto text-[#9aa4b6]" />
                <p className="mt-3 text-sm font-medium">
                  No sample vacancies match these filters.
                </p>
                <p className="mt-2 text-xs text-[#626d82]">
                  Try another keyword or broaden your search.
                </p>
                <button onClick={clearFilters} className={`${action} mt-5`}>
                  Clear filters
                </button>
              </div>
            )}
            <p className="mt-5 text-[11px] leading-5 text-[#626d82]">
              These are illustrative opportunities for the course project.
              Employers, vacancies, and match scores are examples.
            </p>
          </div>
        </section>

        <section id="training" className="scroll-mt-24 bg-white py-14">
          <div className={container}>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  Keep moving forward
                </p>
                <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.8px] sm:text-[29px]">
                  A new skill. More possibilities.
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#626d82]">
                  Find training that connects what you know with where you want
                  to go.
                </p>
              </div>
              <AccountLink
                to="/register"
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary"
              >
                Build your skill profile <ArrowRight size={16} />
              </AccountLink>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {trainings.map((item, index) => (
                <article
                  id={`training-${item.id}`}
                  key={item.id}
                  className="scroll-mt-28 overflow-hidden rounded-xl border border-[#e8ebf3] bg-white"
                >
                  <div className="relative h-44">
                    <img
                      src={
                        [
                          "/images/career-portrait.jpg",
                          "/images/team-collaboration.jpg",
                          "/images/office-team.jpg",
                        ][index]
                      }
                      alt={
                        [
                          "Hands typing on a laptop at a desk",
                          "Colleagues sharing ideas at work",
                          "Professionals collaborating in an office",
                        ][index]
                      }
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#4e5b70]">
                      {item.skill}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="flex items-center gap-1.5 text-[10px] text-[#626d82]">
                      <GraduationCap size={14} /> Career development
                    </p>
                    <h3 className="mt-2 text-base font-semibold leading-6">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-[#626d82]">
                      {item.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[#edf0f5] pt-3">
                      <span className="text-[10px] text-[#626d82]">
                        Sample training program
                      </span>
                      <AccountLink
                        to="/register"
                        aria-label={`Explore ${item.name}`}
                        className="flex size-9 items-center justify-center rounded-lg bg-[#eef0ff] text-primary hover:bg-[#dfe4ff]"
                      >
                        <ArrowUpRight size={17} />
                      </AccountLink>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-[#e9edf5] bg-[#f7f9fd] py-14"
        >
          <div className={container}>
            <div className="mx-auto max-w-[570px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Your next step, made simpler
              </p>
              <h2 className="mt-2 text-[25px] font-semibold tracking-[-0.8px] sm:text-[29px]">
                From your profile to your next possibility.
              </h2>
            </div>
            <div className="mt-9 grid gap-7 sm:grid-cols-3">
              {[
                {
                  Icon: UserRound,
                  title: "Tell us about yourself",
                  text: "Add your education, experience, skills, and the kind of work you are looking for.",
                },
                {
                  Icon: Target,
                  title: "Explore your matches",
                  text: "Understand how a role fits your profile and see which skills you can develop next.",
                },
                {
                  Icon: BriefcaseBusiness,
                  title: "Take the next step",
                  text: "Explore training, review job details, and follow employment assistance through PESO.",
                },
              ].map(({ Icon, title, text }, index) => (
                <div key={title} className="relative rounded-xl bg-white p-6">
                  <span
                    aria-hidden="true"
                    className="absolute right-5 top-4 text-3xl font-semibold text-[#7d88a3]"
                  >
                    0{index + 1}
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-[#edf0ff] text-primary">
                    <Icon size={24} strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#626d82]">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 py-14">
          <div
            className={`${container} grid items-center gap-9 lg:grid-cols-[1fr_1fr] lg:gap-14`}
          >
            <div>
              <div className="relative mb-6 overflow-hidden rounded-xl">
                <img
                  src="/images/team-collaboration.jpg"
                  alt="Professionals discussing ideas around a work table"
                  loading="lazy"
                  className="h-56 w-full object-cover sm:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14213c]/75 to-transparent" />
                <p className="absolute bottom-5 left-5 max-w-[280px] text-xl font-semibold leading-relaxed text-white">
                  A little guidance.
                  <br />A world of possibility.
                </p>
              </div>
              <h2 className="text-[25px] font-semibold leading-snug tracking-[-0.8px] sm:text-[29px]">
                Know why you match.
                <br />
                Know what comes next.
              </h2>
              <p className="mt-3 text-[13px] leading-7 text-[#626d82]">
                PesoMatch brings job discovery, skill development, and PESO
                assistance into one place for jobseekers in Oriental Mindoro.
                Your profile helps you understand the opportunities ahead.
              </p>
              <p className="mt-3 text-xs leading-6 text-[#626d82]">
                Matching and training results in this preview use illustrative
                data. Employment guidance supports your decisions; employers
                make final hiring decisions.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e7ebf4] bg-[#f8f9fd] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  Your match at a glance
                </h3>
                <Target size={24} className="text-primary" />
              </div>
              <p className="mt-2 text-xs leading-6 text-[#626d82]">
                Choose a role to see how skills and training connect.
              </p>
              <label className="mt-5 block text-[11px] font-medium text-[#626d82]">
                Sample target job
                <select
                  value={skillJobId}
                  onChange={(event) => setSkillJobId(event.target.value)}
                  className={`${control} mt-2`}
                >
                  {jobs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-5 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-white">
                <span className="text-xs">Illustrative job match</span>
                <span className="text-xl font-semibold">{skillJob.match}%</span>
              </div>
              <ul className="mt-3 divide-y divide-[#e5e9f2]">
                {[
                  ...skillJob.matched
                    .slice(0, 2)
                    .map((name) => [name, "Matched"]),
                  ...skillJob.gaps.map((name) => [name, "To develop"]),
                ].map(([name, status]) => (
                  <li
                    key={name}
                    className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-xs"
                  >
                    <span className="font-medium text-[#4e5b70]">{name}</span>
                    <span
                      className={`flex items-center gap-1.5 text-[10px] ${
                        status === "Matched"
                          ? "text-[#157b4e]"
                          : "text-[#936323]"
                      }`}
                    >
                      {status === "Matched" ? (
                        <Check size={14} />
                      ) : (
                        <CircleAlert size={14} />
                      )}
                      {status}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg bg-white p-4">
                <p className="flex items-center gap-2 text-[11px] text-[#626d82]">
                  <GraduationCap size={15} /> A place to start
                </p>
                <a
                  href={`#training-${jobTrainings(skillJob)[0].id}`}
                  onClick={() =>
                    delete document.documentElement.dataset.pageTransition
                  }
                  className="mt-2 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-primary"
                >
                  {jobTrainings(skillJob)[0].name}
                  <ArrowRight size={14} />
                </a>
                <p className="mt-1 text-[11px] leading-5 text-[#626d82]">
                  Build {jobTrainings(skillJob)[0].skill.toLowerCase()} for this
                  role.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="help" className="scroll-mt-24 bg-[#f5f7fc] py-14">
          <div
            className={`${container} grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16`}
          >
            <div>
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-[#e9edff] text-primary">
                <Headphones size={24} />
              </span>
              <h2 className="mt-5 text-[25px] font-semibold tracking-[-0.8px] sm:text-[29px]">
                A little clarity
                <br />
                before you begin.
              </h2>
              <p className="mt-3 max-w-sm text-[13px] leading-7 text-[#626d82]">
                Answers to questions about your profile, job matching, training,
                and PESO assistance.
              </p>
              <AccountLink to="/register" className={`${action} mt-6`}>
                Get started <ArrowRight size={16} />
              </AccountLink>
            </div>
            <div className="divide-y divide-[#e6eaf3] rounded-xl bg-white px-5 sm:px-7">
              {[
                [
                  "Does a high match guarantee that I will get the job?",
                  "No. A match shows how a profile compares with a role's requirements. It is guidance, and employers make final hiring decisions. Match scores in this preview are illustrative.",
                ],
                [
                  "How does PesoMatch recommend training?",
                  "The planned matching system connects skills to develop with relevant training. You can explore sample recommendations here; real program schedules and enrollment are not yet connected.",
                ],
                [
                  "Who can create an account?",
                  "Public registration is for jobseekers. You can create an account and save your education, skills, experience, and job preferences. Authorized PESO personnel use accounts provided to them.",
                ],
                [
                  "Can I apply for a real job in this preview?",
                  "Jobs, applications, and PESO referrals are demonstration features. You can try the workflow, but nothing is submitted to a real employer or PESO office.",
                ],
                [
                  "Can I return to my profile later?",
                  "Yes. Your account and profile information are saved. Log in to continue any unfinished profile steps or update your information.",
                ],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium leading-6">
                    {question}
                    <ChevronDown
                      size={17}
                      className="shrink-0 text-[#778198] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-xs leading-7 text-[#626d82]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-primary py-11 text-white">
          <div
            className={`${container} flex flex-wrap items-center justify-between gap-6`}
          >
            <div>
              <h2 className="text-[25px] font-semibold tracking-[-0.7px] sm:text-[29px]">
                Your next chapter starts with you.
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-white/85">
                Bring your skills. Discover what could come next.
              </p>
            </div>
            <AccountLink
              to="/register"
              className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-white px-6 text-xs font-semibold text-primary transition hover:bg-[#edf0ff]"
            >
              Create Jobseeker Profile <ArrowRight size={16} />
            </AccountLink>
          </div>
        </section>
      </main>
      <footer className={`${container} py-8`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Brand />
          <div className="flex gap-6 text-xs text-[#626d82]">
            <Link to="/privacy" className="py-3 hover:text-primary">
              Privacy
            </Link>
            <Link to="/terms" className="py-3 hover:text-primary">
              Terms
            </Link>
            <a
              href="#help"
              onClick={() =>
                delete document.documentElement.dataset.pageTransition
              }
              className="py-3 hover:text-primary"
            >
              Help
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-[#edf0f5] pt-5 text-[10px] leading-5 text-[#626d82]">
          <p>© 2026 PesoMatch · Oriental Mindoro</p>
          <p>
            Course project. No government adoption or employer partnership is
            implied.
          </p>
        </div>
      </footer>
      <JobDetails job={job} close={() => setJob(null)} />
    </div>
  )
}
