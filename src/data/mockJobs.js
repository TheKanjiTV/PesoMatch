// TODO: Replace predefined match scores and classifications with Laravel / AI API results.

// No recommendation or scoring algorithm runs in the frontend.

export const mockJobs = [
  {
    id: "customer-service",

    title: "Customer Service Representative",

    company: "Mindoro Connect",

    category: "Customer Service",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "On-site",

    matchScore: 86,

    matchLabel: "Strong Match",

    matchedCriteria: [
      "Customer Service",

      "Communication",

      "Education Requirement",

      "Preferred Location",
    ],

    skillGaps: ["Microsoft Excel"],

    trainingIds: ["excel", "communication"],

    description:
      "Assist customers with inquiries, explain services, and maintain accurate interaction records.",

    qualifications: [
      "Clear spoken and written communication",

      "Customer service and basic recordkeeping skills",

      "Willingness to work with a service team",
    ],

    isSample: true,
  },

  {
    id: "administrative",

    title: "Administrative Assistant",

    company: "Northline Office",

    category: "Administration",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "Hybrid",

    matchScore: 78,

    matchLabel: "Potential Match",

    matchedCriteria: [
      "Communication",

      "Basic Computer Skills",

      "Education Requirement",
    ],

    skillGaps: ["Bookkeeping", "Microsoft Excel"],

    trainingIds: ["bookkeeping", "excel"],

    description:
      "Support office schedules, maintain records, and prepare basic reports.",

    qualifications: [
      "Organized approach to schedules and records",

      "Basic office software knowledge",

      "Attention to detail",
    ],

    isSample: true,
  },

  {
    id: "sales",

    title: "Sales Associate",

    company: "Everyday Market",

    category: "Sales / Retail",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Part-time",

    arrangement: "On-site",

    matchScore: 72,

    matchLabel: "Potential Match",

    matchedCriteria: ["Customer Service", "Preferred Location"],

    skillGaps: ["Product communication"],

    trainingIds: ["communication"],

    description:
      "Help customers find products and support day-to-day store activities.",

    qualifications: [
      "Friendly communication",

      "Teamwork and basic retail knowledge",
    ],

    isSample: true,
  },

  {
    id: "front-desk",

    title: "Front Desk Associate",

    company: "Coastline Stays",

    category: "Customer Service",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "On-site",

    matchScore: 88,

    matchLabel: "Strong Match",

    matchedCriteria: [
      "Customer Service",

      "Communication",

      "Preferred Location",
    ],

    skillGaps: ["Spreadsheet reporting"],

    trainingIds: ["excel"],

    description:
      "Welcome visitors, answer inquiries, and coordinate front-desk records.",

    qualifications: [
      "Customer service",

      "Clear written and verbal communication",
    ],

    isSample: true,
  },

  {
    id: "service-desk",

    title: "Service Desk Assistant",

    company: "Nexa Services",

    category: "Customer Service",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "On-site",

    matchScore: 85,

    matchLabel: "Strong Match",

    matchedCriteria: [
      "Customer Service",

      "Basic Computer Skills",

      "Education Requirement",
    ],

    skillGaps: ["Reporting"],

    trainingIds: ["excel"],

    description: "Provide first-line assistance and record service requests.",

    qualifications: ["Basic computer skills", "Patient communication"],

    isSample: true,
  },

  {
    id: "client-support",

    title: "Client Support Associate",

    company: "Orbit Support",

    category: "Customer Service",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "Hybrid",

    matchScore: 87,

    matchLabel: "Strong Match",

    matchedCriteria: [
      "Communication",

      "Customer Service",

      "Employment Preference",
    ],

    skillGaps: ["Spreadsheet reporting"],

    trainingIds: ["excel"],

    description: "Respond to client inquiries and coordinate service updates.",

    qualifications: ["Customer communication", "Organized follow-up"],

    isSample: true,
  },

  {
    id: "office-support",

    title: "Office Support Clerk",

    company: "Common Ground",

    category: "Administration",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "On-site",

    matchScore: 76,

    matchLabel: "Potential Match",

    matchedCriteria: ["Education Requirement", "Preferred Location"],

    skillGaps: ["Digital Literacy"],

    trainingIds: ["excel"],

    description:
      "Assist with office documents, scheduling, and basic digital records.",

    qualifications: ["Organization", "Basic digital literacy"],

    isSample: true,
  },

  {
    id: "records",

    title: "Records Assistant",

    company: "Clarity Records",

    category: "Administration",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Contract",

    arrangement: "On-site",

    matchScore: 74,

    matchLabel: "Potential Match",

    matchedCriteria: ["Basic Computer Skills", "Education Requirement"],

    skillGaps: ["Bookkeeping"],

    trainingIds: ["bookkeeping"],

    description: "Maintain and organize office and transaction records.",

    qualifications: ["Attention to detail", "Basic recordkeeping"],

    isSample: true,
  },

  {
    id: "data-entry",

    title: "Data Entry Clerk",

    company: "DataNest",

    category: "Administration",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Contract",

    arrangement: "Hybrid",

    matchScore: 73,

    matchLabel: "Potential Match",

    matchedCriteria: ["Basic Computer Skills", "Preferred Location"],

    skillGaps: ["Digital Literacy", "Microsoft Excel"],

    trainingIds: ["excel"],

    description: "Enter, verify, and organize structured information.",

    qualifications: ["Accurate typing", "Spreadsheet familiarity"],

    isSample: true,
  },

  {
    id: "retail-support",

    title: "Retail Support Assistant",

    company: "Harbor Trading",

    category: "Sales / Retail",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Part-time",

    arrangement: "On-site",

    matchScore: 71,

    matchLabel: "Potential Match",

    matchedCriteria: ["Customer Service", "Education Requirement"],

    skillGaps: ["Product communication"],

    trainingIds: ["communication"],

    description: "Support customer inquiries and daily retail operations.",

    qualifications: ["Customer service", "Team communication"],

    isSample: true,
  },

  {
    id: "reception",

    title: "Reception Assistant",

    company: "Bayside Office",

    category: "Administration",

    location: "Bansud, Oriental Mindoro",

    employmentType: "Full-time",

    arrangement: "On-site",

    matchScore: 79,

    matchLabel: "Potential Match",

    matchedCriteria: ["Communication", "Preferred Location"],

    skillGaps: ["Office reporting"],

    trainingIds: ["excel"],

    description:
      "Manage reception inquiries, visitor records, and appointment schedules.",

    qualifications: ["Clear communication", "Basic office software"],

    isSample: true,
  },

  {
    id: "community-support",

    title: "Community Support Assistant",

    company: "Together Works",

    category: "Customer Service",

    location: "Calapan, Oriental Mindoro",

    employmentType: "Contract",

    arrangement: "On-site",

    matchScore: 75,

    matchLabel: "Potential Match",

    matchedCriteria: ["Communication", "Education Requirement"],

    skillGaps: ["Written reporting"],

    trainingIds: ["communication"],

    description:
      "Help coordinate community inquiries and routine service records.",

    qualifications: ["Community-facing communication", "Organized reporting"],

    isSample: true,
  },
]

// All criteria and scores below are fixed demonstration data, never a profile assessment.

const details = {
  "customer-service": {
    educationLevel: "College Level",

    experienceLevel: "Entry level",

    requiredSkills: [
      "Customer Service",
      "Communication",
      "Computer Literacy",
      "Microsoft Word",
      "Microsoft Excel",
      "Basic Reporting",
    ],

    preferredSkills: ["Professional Email Writing"],

    similarJobIds: ["administrative", "front-desk", "sales"],
  },

  administrative: {
    educationLevel: "College Level",

    experienceLevel: "1-2 years",

    requiredSkills: ["Communication", "Microsoft Word", "Microsoft Excel"],

    preferredSkills: ["Bookkeeping"],

    similarJobIds: ["data-entry", "records", "reception"],
  },

  sales: {
    educationLevel: "Senior High School",

    experienceLevel: "No experience required",

    similarJobIds: ["retail-support", "customer-service"],
  },

  "data-entry": {
    educationLevel: "Senior High School",

    experienceLevel: "Entry level",

    similarJobIds: ["records", "administrative"],
  },
}

mockJobs.forEach((job, index) => {
  Object.assign(job, {
    company: `Sample ${job.company}`,

    employer: `Sample ${job.company}`,

    brandIndex: index,

    workArrangement: job.arrangement,

    educationLevel: "College Level",

    experienceLevel: "Entry level",

    postedAt: `2026-10-${String(4 - (index % 4)).padStart(2, "0")}`,

    postedLabel: `October ${4 - (index % 4)}, 2026 (sample)`,

    salaryRange: "Not specified",

    requiredSkills: [
      ...job.matchedCriteria.filter(
        (value) => !/education|location|preference/i.test(value),
      ),

      ...job.skillGaps,
    ],

    preferredSkills: ["Basic Reporting"],

    responsibilities: [
      job.description,

      "Maintain accurate records and communicate progress clearly.",

      "Follow workplace procedures and coordinate with the assigned team.",
    ],

    preferredQualifications: [
      "Willingness to learn and collaborate with the team.",
    ],

    similarJobIds: ["administrative", "sales", "front-desk"].filter(
      (id) => id !== job.id,
    ),

    skillStatuses: job.skillGaps.map((skill, i) => ({
      skill,

      status: i === 0 ? "Needs Improvement" : "Not in Profile",
    })),

    ...details[job.id],
  })
})

// Explicit demo values; no score calculation or employer verification is performed.

Object.assign(
  mockJobs.find((job) => job.id === "sales"),

  {
    matchScore: 74,

    location: "Roxas, Oriental Mindoro",

    employmentType: "Full-time",
  },
)

Object.assign(
  mockJobs.find((job) => job.id === "data-entry"),

  {
    title: "Data Entry Assistant",

    matchScore: 81,

    location: "Bongabong, Oriental Mindoro",
  },
)

mockJobs[0].skillStatuses.push({
  skill: "Basic Reporting",

  status: "Not in Profile",
})

mockJobs.push({
  ...mockJobs[0],

  id: "it-support",

  title: "IT Support Assistant",

  company: "Sample Technology Office",

  employer: "Sample Technology Office",

  category: "Information Technology",

  location: "Oriental Mindoro",

  arrangement: "Hybrid",

  workArrangement: "Hybrid",

  matchScore: 76,

  matchLabel: "Potential Match",

  brandIndex: 5,

  description: "Help staff troubleshoot everyday computer and software issues.",

  requiredSkills: [
    "Computer Literacy",

    "Communication",

    "Basic Troubleshooting",
  ],

  matchedCriteria: ["Computer Literacy", "Communication"],

  skillGaps: ["Basic Troubleshooting"],

  skillStatuses: [{ skill: "Basic Troubleshooting", status: "Developing" }],

  trainingIds: ["digital"],

  preferredSkills: ["Microsoft Excel"],

  responsibilities: [
    "Help staff troubleshoot routine computer, software and connectivity issues.",

    "Record support requests and explain practical solutions clearly.",

    "Assist with workstation setup and escalate issues to the assigned technical team.",
  ],

  qualifications: [
    "Computer literacy and familiarity with everyday office software",

    "Clear communication when explaining a technical issue",

    "Basic troubleshooting knowledge and willingness to learn",
  ],

  similarJobIds: ["data-entry", "office-support"],
})

export const recommendedJobIds = [
  "customer-service",

  "administrative",

  "data-entry",

  "sales",

  "it-support",

  "front-desk",
]

export const demoMatchProfile = {
  skills: [
    "Customer Service",

    "Communication",

    "Microsoft Word",

    "Computer Literacy",
  ],

  education: "College Level",

  preferredFields: ["Customer Service", "Administration"],

  preferredLocation: "Oriental Mindoro",

  employmentType: "Full-time",
}

mockJobs.find((job) => job.id === "office-support").trainingIds = ["digital"]

export function describeMatchedCriterion(job, criterion) {
  const descriptions = {
    "Education Requirement": `The sample profile records ${demoMatchProfile.education}; this opportunity lists ${job.educationLevel}. The education criterion is marked matched in this demo.`,

    "Preferred Location": `${job.location} is within the sample profile's preferred province, ${demoMatchProfile.preferredLocation}.`,

    "Employment Preference": `The sample profile prefers ${demoMatchProfile.employmentType}; this opportunity is recorded as ${job.employmentType}.`,

    "Basic Computer Skills":
      "The sample profile includes Computer Literacy, which relates to this role's basic computer requirements.",
  }

  return (
    descriptions[criterion] ||
    `${criterion} is listed in the sample profile and appears in this opportunity's recorded skill criteria.`
  )
}

export function describeSkillStatus(job, skill, status) {
  const kind = job.preferredSkills.includes(skill)
    ? "preferred skill"
    : "required skill"

  if (status === "Not in Profile")
    return `This ${kind} is not listed in the sample profile. Add accurate information if you already have it, or explore a relevant course.`

  if (status === "Developing")
    return `The sample comparison marks this ${kind} as developing. More practice or relevant training could help you prepare for this role.`

  if (status === "Matched")
    return `This ${kind} is recorded as matched in the sample comparison.`

  return `This ${kind} is weakly represented in the sample profile. Review your proficiency and consider training to strengthen it.`
}
