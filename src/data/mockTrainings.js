import { mockJobs } from "./mockJobs.js"

export const mockTrainings = [
  {
    id: "excel",

    title: "Microsoft Excel Essentials",

    category: "Digital Skills",

    skillAddressed: "Microsoft Excel",

    reason:
      "Build spreadsheet skills used in several of the sample office and customer service roles.",

    provider: "Sample PESO / Partner Training Provider",

    status: "Available Training",

    jobIds: ["customer-service", "administrative", "data-entry"],

    modules: [
      "Organizing spreadsheets",

      "Formulas and basic calculations",

      "Preparing readable reports",
    ],

    schedule: "To be confirmed by the provider",

    isSample: true,
  },

  {
    id: "communication",

    title: "Workplace Communication",

    category: "Employability Skills",

    skillAddressed: "Communication",

    reason:
      "Practice communication skills commonly required by customer-facing roles.",

    provider: "Sample PESO / Partner Training Provider",

    status: "Available Training",

    jobIds: ["customer-service", "sales"],

    modules: [
      "Customer conversations",

      "Writing workplace messages",

      "Team coordination",
    ],

    schedule: "To be confirmed by the provider",

    isSample: true,
  },

  {
    id: "bookkeeping",

    title: "Basic Bookkeeping",

    category: "Business Skills",

    skillAddressed: "Bookkeeping",

    reason:
      "Explore bookkeeping fundamentals used in administrative roles and recordkeeping.",

    provider: "Sample PESO / Partner Training Provider",

    status: "Available Training",

    jobIds: ["administrative", "records"],

    modules: [
      "Recording transactions",

      "Organizing financial records",

      "Preparing simple summaries",
    ],

    schedule: "To be confirmed by the provider",

    isSample: true,
  },
]

mockTrainings.push({
  id: "digital",
  title: "Everyday Computer Troubleshooting",
  category: "Digital Skills",
  skillAddressed: "Basic Troubleshooting",
  skillsAddressed: [
    "Basic Troubleshooting",
    "Digital Literacy",
    "Computer Literacy",
  ],
  provider: "Sample Training Partner",
  status: "Available Training",
  jobIds: ["it-support", "office-support", "data-entry"],
  reason:
    "Develop digital literacy and practical troubleshooting skills used in the sample technology and office roles.",
  modules: [
    "Using everyday office software",
    "Diagnosing common computer issues",
    "Keeping support records",
  ],
  schedule: "To be confirmed by the provider",
  isSample: true,
})

mockTrainings.forEach((item) => {
  item.skillsAddressed ||= [item.skillAddressed]
  item.location = "Sample Oriental Mindoro venue / To be confirmed"
  item.requirements = [
    "Interest in developing the listed skills",
    "Confirm actual prerequisites with the provider",
  ]
})

// Fixed prototype information, not a live provider listing or registration offer.
const trainingDetails = {
  excel: {
    mode: "Face-to-face",
    duration: "3 days",
    durationCategory: "1–3 days",
    availability: "Available",
    image: "/images/career-portrait.jpg",
    skillsAddressed: ["Microsoft Excel", "Basic Reporting"],
    audience:
      "Jobseekers preparing for customer service, office support, and data entry roles.",
  },
  communication: {
    mode: "Online",
    duration: "2 days",
    durationCategory: "1–3 days",
    availability: "Registration Open",
    image: "/images/team-collaboration.jpg",
    skillsAddressed: ["Communication", "Professional Email Writing"],
    audience:
      "Jobseekers looking to strengthen customer conversations and workplace messages.",
  },
  bookkeeping: {
    mode: "Hybrid",
    duration: "2 weeks",
    durationCategory: "1–2 weeks",
    availability: "Upcoming",
    image: "/images/career-workspace.jpg",
    audience:
      "Jobseekers interested in office administration and financial recordkeeping.",
  },
  digital: {
    mode: "Face-to-face",
    duration: "5 days",
    durationCategory: "4–7 days",
    availability: "Available",
    image: "/images/office-team.jpg",
    audience:
      "Jobseekers building everyday computer support and digital workplace skills.",
  },
}
mockTrainings.forEach((item) => {
  Object.assign(item, trainingDetails[item.id])
  item.skillCategory = item.category
  // Resolve the existing explicit demo job/training associations in both directions.
  item.jobIds = [
    ...new Set([
      ...item.jobIds,
      ...mockJobs
        .filter((job) => job.trainingIds.includes(item.id))
        .map((job) => job.id),
    ]),
  ]
  item.location = item.mode === "Online" ? "Online" : "Oriental Mindoro"
  item.description = `A sample practical workshop covering ${item.skillsAddressed.join(", ").toLowerCase()}. Guided exercises connect these skills with everyday workplace tasks.`
  item.learningObjectives = item.modules.map(
    (module) =>
      `Practice ${module.toLowerCase()} through guided workplace exercises.`,
  )
  item.registrationDetails =
    "Sample training information. Registration is not available in this prototype; no place is reserved by saving or marking interest."
})
