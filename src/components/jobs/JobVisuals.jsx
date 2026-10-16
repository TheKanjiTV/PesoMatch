import { JourneyLink } from "../common/JourneyLink.jsx"

import {
  ArrowUpRight,
  AudioLines,
  Blocks,
  Building2,
  Compass,
  Flower2,
  Layers3,
  LifeBuoy,
  MessageCircle,
  Mountain,
  Orbit,
  Sparkles,
  Waves,
} from "lucide-react"

const marks = [
  [MessageCircle, "bg-[#12b886]"],

  [Layers3, "bg-[#7546ef]"],

  [Flower2, "bg-[#f15c49]"],

  [Mountain, "bg-[#f2a93b]"],

  [LifeBuoy, "bg-[#16aaca]"],

  [Orbit, "bg-[#354bff]"],

  [Building2, "bg-[#41567c]"],

  [Blocks, "bg-[#b344bc]"],

  [AudioLines, "bg-[#eb5576]"],

  [Compass, "bg-[#109c85]"],

  [Waves, "bg-[#536ee8]"],

  [Sparkles, "bg-[#db8f25]"],
]

export function CompanyMark({ job, small = false }) {
  const [Icon, color] = marks[job.brandIndex ?? 0] || marks[0]

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-[10px] text-white ${color} ${
        small ? "size-10" : "size-12"
      }`}
    >
      <Icon size={small ? 23 : 29} strokeWidth={2.2} />
    </span>
  )
}

export function CareerPromo({ className = "" }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-lg bg-[#15213d] ${className}`}
    >
      <img
        src="/images/career-professional.jpg"
        alt=""
        className="absolute inset-0 -z-20 size-full object-cover object-[58%_28%]"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#101a31]/95 via-[#101a31]/55 to-transparent" />
      <div className="py-6 pl-4 pr-12">
        <p className="max-w-[125px] text-[17px] font-semibold leading-[1.55] text-white">
          Go forward.
          <br />
          Your next chapter starts here.
        </p>
        <JourneyLink
          to="/jobs?tab=browse"
          className="mt-5 inline-flex min-h-9 items-center gap-1 rounded bg-primary px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#283bd1]"
        >
          EXPLORE JOBS
          <ArrowUpRight size={13} />
        </JourneyLink>
      </div>
    </div>
  )
}

export function WorkplaceBanner() {
  return (
    <div className="grid h-36 grid-cols-[1fr_.85fr_1fr] gap-1 overflow-hidden rounded-t-xl sm:h-44">
      <img
        src="/images/office-team.jpg"
        alt="Colleagues working together in an office"
        className="size-full object-cover"
      />
      <div className="flex flex-col justify-center bg-[#fafbfe] px-4 text-xl font-semibold leading-tight sm:text-2xl">
        <span className="text-[#087f58]">Grow.</span>
        <span className="text-[#976114]">Connect.</span>
        <span className="text-[#bb442c]">Create.</span>
        <span className="text-primary">
          Your next
          <br />
          opportunity.
        </span>
      </div>
      <img
        src="/images/team-collaboration.jpg"
        alt="A team collaborating on their work"
        className="size-full object-cover object-[65%_center]"
      />
    </div>
  )
}
