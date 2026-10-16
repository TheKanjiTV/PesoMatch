import { ClipboardList, UserRoundCheck, Handshake, Eye } from "lucide-react"

// Screenshots of the existing Staff Portal, captured using isolated demo data.
export const adminGuide = [
  {
    id: "queue",
    label: "Find a request",
    title: "Start with the assistance queue",
    description:
      "Find a jobseeker by name or reference, then choose Needs Review to focus on requests that need your attention.",
    instruction:
      "Open Employment Assistance, filter the queue, and select Review.",
    image: "/images/admin-guide/queue.png",
    alt: "PesoMatch Staff Portal assistance queue showing search, stage filters and Review actions for sample requests",
    icon: ClipboardList,
    focus: { left: "24%", top: "29%", width: "9%", height: "7%" },
    resource: "Assistance queue guide",
  },
  {
    id: "review",
    label: "Review the profile",
    title: "Understand the person behind the request",
    description:
      "Read the jobseeker profile and selected opportunity. Ask for missing information before preparing a referral.",
    instruction:
      "Review the profile, check job requirements, and choose the next staff action.",
    image: "/images/admin-guide/review.png",
    alt: "PesoMatch sample assistance review screen with the jobseeker profile, selected job and next staff actions",
    icon: UserRoundCheck,
    focus: { left: "21%", top: "42%", width: "51%", height: "29%" },
    resource: "Profile review guide",
  },
  {
    id: "coordination",
    label: "Coordinate & follow up",
    title: "Keep the referral moving",
    description:
      "Record the employer response, add a follow-up, and save the confirmed outcome when it is available. Each update stays connected to the request.",
    instruction:
      "Use Record Employer Coordination or Add Follow-up to document the next step.",
    image: "/images/admin-guide/coordination.png",
    alt: "PesoMatch employer coordination screen showing Record Employer Coordination, Add Follow-up and outcome actions",
    icon: Handshake,
    focus: { left: "21%", top: "57%", width: "31%", height: "7%" },
    resource: "Referral & follow-up guide",
  },
  {
    id: "updates",
    label: "Check public updates",
    title: "Give jobseekers a clear next step",
    description:
      "Preview the status and updates a jobseeker can read. Internal staff notes stay separate from the public timeline.",
    instruction:
      "Open Preview Jobseeker Updates before sharing a status update.",
    image: "/images/admin-guide/updates.png",
    alt: "PesoMatch jobseeker update preview showing the current status, next step and public assistance timeline",
    icon: Eye,
    focus: { left: "21%", top: "44%", width: "53%", height: "23%" },
    resource: "Jobseeker updates guide",
  },
]
