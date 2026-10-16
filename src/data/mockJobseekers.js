export const mockJobseekers = [
  [
    "seeker-alex",
    "Alex Reyes",
    "Bansud",
    "Customer Service Representative",
    [
      "Customer Service",
      "Communication",
      "Microsoft Word",
      "Computer Literacy",
    ],
  ],
  [
    "seeker-bea",
    "Bea Mendoza",
    "Calapan",
    "Administrative Assistant",
    ["Communication", "Microsoft Word", "Data Entry"],
  ],
  [
    "seeker-carlo",
    "Carlo Ramos",
    "Bongabong",
    "Data Entry Assistant",
    ["Computer Literacy", "Microsoft Excel", "Data Entry"],
  ],
  [
    "seeker-dina",
    "Dina Torres",
    "Roxas",
    "Sales Associate",
    ["Sales", "Communication", "Customer Service"],
  ],
].map(([id, name, municipality, occupation, skills], index) => ({
  id,
  name,
  municipality,
  location: `${municipality}, Oriental Mindoro`,
  occupation,
  skills,
  email: `${id}@example.test`,
  mobile: "Not connected in prototype",
  verified: index % 2 === 0,
  education: {
    attainment: "College Level",
    school: "Sample Community College",
    program: index === 2 ? "Information Technology" : "Business Administration",
  },
  completion: index === 1 ? 80 : 100,
  experience:
    index === 1
      ? []
      : [
          {
            title: "Customer Support Assistant",
            company: "Sample Community Services",
            period: "2024–2025",
            description:
              "Helped customers, maintained records and coordinated routine office tasks.",
          },
        ],
  certifications: index === 2 ? ["Sample Digital Skills Certificate"] : [],
  languages: ["Filipino — Fluent", "English — Conversational"],
  preferences: {
    occupations: [occupation],
    location: "Oriental Mindoro",
    employmentTypes: ["Full-time"],
    arrangements: ["On-site", "Hybrid"],
  },
  isSample: true,
}))
