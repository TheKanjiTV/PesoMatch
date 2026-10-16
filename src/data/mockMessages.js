export const mockMessages = [
  {
    id: "welcome",

    sender: "Sample PESO Officer",

    subject: "Preparing for your referral",

    read: false,

    time: "September 30, 2026",

    messages: [
      {
        id: 1,

        outgoing: false,

        text: "Welcome, Kenji. You can review your sample referral in PESO Assistance. Keep your skills and contact information updated before discussing an opportunity with PESO.",
      },
    ],
  },

  {
    id: "training",

    sender: "Sample Training Desk",

    subject: "About your training suggestions",

    read: true,

    time: "September 29, 2026",

    messages: [
      {
        id: 1,

        outgoing: false,

        text: "Your training recommendations connect to skills in the sample job listings. Schedules and provider availability would be confirmed with PESO in a connected system.",
      },
    ],
  },

  {
    id: "employer",

    sender: "Sample Employer",

    subject: "Interview invitation",

    read: false,

    time: "September 28, 2026",

    messages: [
      {
        id: 1,

        outgoing: false,

        text: "Hello Kenji, we reviewed your profile and would like to invite you for a sample interview. Please let us know your availability.",
      },

      {
        id: 2,

        outgoing: true,

        text: "Thank you for the opportunity. I am available next week on weekdays.",
      },

      {
        id: 3,

        outgoing: false,

        text: "Great! We will send a confirmation with the details shortly.",
      },
    ],
  },
]
