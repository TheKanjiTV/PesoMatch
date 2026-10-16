export const mockProfile = {
  id: 1,

  firstName: "Kenji",

  lastName: "Santos",

  email: "kenji@example.com",

  location: "Oriental Mindoro",

  education: "Senior high school graduate",

  skills: ["Customer Service", "Communication", "Basic Computer Skills"],

  experience: "",

  certifications: "",

  profileCompletion: 80,

  preferredFields: ["Customer Service", "Administration"],

  preferredLocation: "Oriental Mindoro",

  employmentType: "Full-time",

  workArrangement: ["On-site", "Hybrid"],

  isSample: true,
}

export const profileSections = [
  { name: "Personal Information", field: "firstName", status: "Completed" },

  { name: "Education", field: "education", status: "Completed" },

  { name: "Skills", field: "skills", status: "Completed" },

  { name: "Job Preferences", field: "preferredFields", status: "Completed" },

  { name: "Work Experience", field: "experience", status: "Developing" },

  { name: "Certifications", field: "certifications", status: "Not in Profile" },
]

export const mockSkillGaps = [
  {
    id: "excel",

    name: "Microsoft Excel",

    status: "Needs Improvement",

    jobIds: ["customer-service", "administrative"],

    trainingIds: ["excel"],

    reason:
      "Spreadsheet reporting is required in customer service and administration roles.",
  },

  {
    id: "bookkeeping",

    name: "Bookkeeping",

    status: "Not in Profile",

    jobIds: ["administrative", "records"],

    trainingIds: ["bookkeeping"],

    reason:
      "Some administrative vacancies ask for basic transaction records. No bookkeeping information is recorded in the sample profile.",
  },

  {
    id: "digital",

    name: "Digital Literacy",

    status: "Developing",

    jobIds: ["office-support", "data-entry"],

    trainingIds: ["excel"],

    reason:
      "Practice with everyday office software can support records and data-entry tasks.",
  },

  {
    id: "communication",

    name: "Communication",

    status: "Matched",

    jobIds: ["customer-service", "sales"],

    trainingIds: ["communication"],

    reason:
      "The sample profile lists customer-facing communication. Training can further develop this existing strength.",
  },
]
