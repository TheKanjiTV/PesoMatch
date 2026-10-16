// User-provided PESO announcement examples, transcribed from the reference posts.

// These are not a live PESO feed or verified availability. Poster files were supplied by the user.

export const mockFeed = [
  {
    id: "mandaluyong-interviews",

    organization: "PESO Mandaluyong Official",

    initials: "PM",

    type: "Recruitment announcement",

    date: "September 20, 2026 · 12:43 PM",

    title: "In-house job interviews",

    description:
      "Attention, jobseekers! PESO Mandaluyong is accepting applicants for in-house job interviews. Explore the September 21–23 recruitment schedule below.",

    details:
      "Daily local recruitment activity at the City Public Employment Service Office, 2/F Multi-Level Parking, BOC Building, City Government Complex, Maysilo Circle, Barangay Plainview, Mandaluyong City.\n\nDirect employer interviews: 8:00 AM–12:00 noon. Manpower agency interviews: 12:00 noon–3:00 PM.\n\nBring your résumé, a 2×2 photo and a ballpen. Wear appropriate interview attire. The dates in this user-provided reference have passed; contact the organizer for current schedules.",

    cta: "Explore PESO Assistance",

    to: "/jobseeker/assistance",

    posters: [
      {
        src: "/images/announcements/poster13.png",

        heading: "September 21 interviews: SM Supermarket and Fieldmen",
      },

      {
        src: "/images/announcements/poster14.png",

        heading: "September 22 interviews: Big Apple Express Spa and Bidair's",
      },
    ],
  },

  {
    id: "paranaque-palscon",

    organization: "City of Parañaque – PESO",

    initials: "PP",

    type: "Job fair announcement",

    date: "User-provided October 2026 announcement",

    title: "Jobs Fair · Project PALSCON",

    description:
      "Calling Parañaque jobseekers! Project PALSCON Jobs Fair is scheduled for October 9, 2026, Friday, from 8:00 AM to 4:00 PM at 88 Square Mall, Barangay San Dionisio, Parañaque City.",

    details:
      "Venue: 88 Square Mall, Quirino Avenue, Barangay San Dionisio, Parañaque City. The supplied post text gives 668 Quirino Avenue; the supplied poster gives 568. Confirm the exact address with the organizer before travelling.\n\nBring your résumé or biodata, a black pen, a valid ID and supporting documents. Participating employer examples and roles are listed in the reference panels. Check current availability and qualifications with PESO; these announcements do not guarantee a vacancy or employment.\n\nOrganizer contacts shown in the supplied poster: 877-11078 / 8521-0896; peso.employment@paranaque.gov.ph and peso@paranaque.gov.ph.",

    cta: "Explore PESO Assistance",

    to: "/jobseeker/assistance",

    posters: [
      {
        src: "/images/announcements/poster.png",

        heading: "Project PALSCON Jobs Fair and registration QR code",
      },

      {
        src: "/images/announcements/poster1.png",

        heading: "J.G. Manpower Corp.",
      },

      {
        src: "/images/announcements/poster3.png",

        heading: "Job Clean Manpower & General Services Phils. Inc.",
      },

      {
        src: "/images/announcements/poster4.png",

        heading: "MAR Employment for Good Services, Inc.",
      },

      {
        src: "/images/announcements/poster5.png",

        heading:
          "Omniworx: maintenance, laboratory, carpentry and technical roles",
      },

      {
        src: "/images/announcements/poster6.png",

        heading:
          "Omniworx: aircon, boiler, building maintenance and pool roles",
      },

      {
        src: "/images/announcements/poster7.png",

        heading: "Omniworx: lead technician, engineer and store room roles",
      },

      {
        src: "/images/announcements/poster8.png",

        heading: "Omniworx: help desk and driver roles",
      },

      {
        src: "/images/announcements/poster9.png",

        heading: "Phil. Pinoy: HR, bar captain, receptionist and server roles",
      },

      {
        src: "/images/announcements/poster10.png",

        heading:
          "Phil. Pinoy: busser, steward, housekeeping and sous chef roles",
      },

      {
        src: "/images/announcements/poster11.png",

        heading:
          "Phil. Pinoy: executive chef, commis chef, cook and distribution roles",
      },

      {
        src: "/images/announcements/poster12.png",

        heading: "Phil. Pinoy: baker, cake decorator and production roles",
      },
    ],
  },
]

// More posts use the same supplied fair's employer posters, not invented live announcements.

export const additionalFeed = mockFeed[1].posters

  .slice(1)

  .map((poster, index) => ({
    ...mockFeed[1],

    id: `palscon-employer-${index + 1}`,

    title: poster.heading,

    description:
      "Available job posts shown in the supplied Project PALSCON Jobs Fair poster. Open the image for the listed roles and qualifications.",

    posters: [poster],
  }))
