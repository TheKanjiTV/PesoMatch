// Each step visits the real role-authorized page. The guide never submits data.
export function tutorialSteps(role) {
  const staff = ["admin", "peso_staff"].includes(role)
  const seeker = role === "jobseeker"
  const employer = role === "employer"
  const provider = role === "training_provider"
  const steps = [
    {
      path: "/dashboard",
      title: seeker
        ? "Welcome to your PESO workspace"
        : staff
          ? "Your PESO service desk"
          : "Your partner workspace",
      text: "This is your Overview. Next visits the actual services available to your account. You can go back or skip at any time.",
    },
  ]
  const add = (path, title, text) => steps.push({ path, title, text })
  if (seeker)
    add(
      "/profile",
      "Your profile and résumé",
      "Keep your contact details, education, skills and preferences current. Optional résumé review lets you choose which detected skills to add.",
    )
  if (staff)
    add(
      "/jobseekers",
      "Jobseeker registry",
      "Review registered jobseekers and declared profile evidence within your PESO role. Keep personal information limited to service needs.",
    )
  add(
    "/jobs",
    "Vacancy Management",
    employer
      ? "Use My vacancies to create and manage your postings. Browse published openings in All vacancies or by organization in Employers. PESO reviews submissions before publication."
      : provider
        ? "Explore published work opportunities. Vacancy management and employer decisions remain restricted to their authorized roles."
        : "Search and filter vacancies, then open a detail page. Jobseekers apply through PESO by requesting a referral; the official source supports staff verification.",
  )
  if (seeker)
    add(
      "/matches",
      "Job Matching",
      "Compare your declared skills with vacancy requirements and review relevant training suggestions. A match supports your decision; it does not guarantee eligibility or hiring.",
    )
  if (!provider)
    add(
      "/referrals",
      "Referrals and interviews",
      seeker
        ? "Follow your PESO review, referral, interview schedule and employer updates here. Check the highlighted notes; withdraw an active request if you no longer want to continue."
        : employer
          ? "Review candidates PESO referred to your vacancies. Accept a referral for review, arrange an interview, record an offer or decline. PESO verifies employment starts."
          : "Review authorized referral requests, record employer verification where required, and coordinate interviews and offers. PESO verifies employment-start evidence before placement.",
    )
  add(
    "/training",
    "Training & Skills Development",
    seeker
      ? "Explore programs and request enrollment through PESO. Registry entries need provider-intake confirmation; opening this guide does not enroll you."
      : provider
        ? "Manage your own program submissions, requirements, fees, schedules and places. PESO controls publication review."
        : staff
          ? "Review programs and create a verified local intake for source-listed training after confirming the provider, actual dates, fee and capacity."
          : "Explore training pathways related to employment. Enrollment management is limited to the authorized jobseeker, provider and PESO roles.",
  )
  if (!employer)
    add(
      "/enrollments",
      "Training Enrollment",
      seeker
        ? "Track requested, confirmed, in-progress and completed training. Use Withdraw request to cancel an active request. There is no separate Delete enrollment request button."
        : "Review eligible enrollment requests. Source-program confirmation needs the exact verified local intake and available capacity. Record progress and the provider completion reference separately.",
    )
  if (!provider)
    add(
      "/placements",
      "Employment Facilitation & Placement",
      "Verified placements appear after a recorded employer offer and actual employment-start evidence. The guide does not create a placement or change employment records.",
    )
  if (seeker || staff) {
    add(
      "/outcomes",
      "Employment outcomes and follow-up",
      "Keep employment updates separate from verified results. PESO reviews supporting evidence and follows up on recorded placements.",
    )
    add(
      "/services",
      "PESO support services",
      "Request or coordinate counseling, orientation and other employment support. Use only the details needed for the service.",
    )
  }
  add(
    "/events",
    "Events & Employment Programs",
    "Review job fairs, programs, venue details and organizer links. Check current instructions before attending.",
  )
  add(
    "/labor-market",
    "Labor Market Information",
    "Explore platform activity and attributed official reports. Platform totals are not municipal or national unemployment rates.",
  )
  if (role === "admin") {
    add(
      "/users",
      "Account Access",
      "Manage authorized account roles and responsibilities. Sensitive changes require your current password; access and deletion protections still apply.",
    )
    add(
      "/audit",
      "Audit records",
      "Review who changed service records and access. Tutorial navigation itself does not approve or modify those records.",
    )
  }
  add(
    "/settings",
    "Account Settings and replay",
    "Manage your account, appearance and privacy settings here. Replay workspace tutorial starts this full guide again. Choose Finish to return to your Overview.",
  )
  return steps
}
