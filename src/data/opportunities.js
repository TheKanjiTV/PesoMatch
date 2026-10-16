export const trainings = [
  {
    id: "excel",

    name: "Microsoft Excel Essentials",

    skill: "Microsoft Excel",

    description:
      "Practice spreadsheets, formulas, and basic reports for office and customer service work.",
  },

  {
    id: "communication",

    name: "Workplace Communication",

    skill: "Communication",

    description:
      "Build confidence in customer conversations, workplace messages, and team coordination.",
  },

  {
    id: "bookkeeping",

    name: "Basic Bookkeeping",

    skill: "Bookkeeping",

    description:
      "Learn to organize transaction records and prepare simple financial summaries.",
  },
]

export const jobs = [
  {
    id: "customer-service",

    title: "Customer Service Representative",

    category: "Customer Service",

    location: "Bansud, Oriental Mindoro",

    type: "Full-time",

    employer: "Sample Local Employer",

    match: 86,

    description:
      "Assist customers with inquiries, explain available services, and maintain clear records of each interaction.",

    matched: [
      "Customer Service",

      "Communication",

      "Education requirement",

      "Preferred location",
    ],

    gaps: ["Microsoft Excel", "Basic reporting"],

    skills: [
      "Customer Service",

      "Communication",

      "Microsoft Excel",

      "Basic reporting",
    ],

    qualifications: [
      "Clear spoken and written communication",

      "Ability to handle customer inquiries",

      "Basic computer and recordkeeping skills",
    ],

    training: ["excel", "communication"],
  },

  {
    id: "administrative",

    title: "Administrative Assistant",

    category: "Office Administration",

    location: "Calapan, Oriental Mindoro",

    type: "Full-time",

    employer: "Sample Office Employer",

    match: 78,

    description:
      "Support day-to-day office coordination, maintain records, and help prepare schedules and reports.",

    matched: ["Communication", "Organization", "Preferred location"],

    gaps: ["Microsoft Excel", "Bookkeeping"],

    skills: ["Organization", "Communication", "Microsoft Excel", "Bookkeeping"],

    qualifications: [
      "Organized approach to records and schedules",

      "Basic office software knowledge",

      "Attention to detail in written work",
    ],

    training: ["excel", "bookkeeping"],
  },

  {
    id: "sales",

    title: "Sales Associate",

    category: "Sales / Retail",

    location: "Bansud, Oriental Mindoro",

    type: "Part-time",

    employer: "Sample Retail Employer",

    match: 82,

    description:
      "Help customers find products, explain product information, and assist with daily store activities.",

    matched: ["Customer Service", "Preferred location"],

    gaps: ["Workplace communication"],

    skills: ["Customer Service", "Communication", "Product knowledge"],

    qualifications: [
      "Willingness to assist customers",

      "Clear communication and teamwork",

      "Interest in retail and product knowledge",
    ],

    training: ["communication"],
  },
]

export const jobTrainings = (job) =>
  trainings.filter((item) => job.training.includes(item.id))
