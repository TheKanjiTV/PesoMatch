export const mockNotifications = [
  {
    id: 1,

    title: "New Job Match",

    message:
      "A Customer Service Representative vacancy was added to your recommendations.",

    time: "2 hours ago",

    to: "/jobseeker/jobs/customer-service",

    read: false,

    type: "job",
  },

  {
    id: 2,

    title: "Training Recommendation",

    message:
      "Microsoft Excel Essentials was recommended based on your current skill gaps.",

    time: "Yesterday",

    to: "/training/excel",

    read: false,

    type: "training",
  },

  {
    id: 3,

    title: "Profile Updated",

    message: "Your skills information was updated.",

    time: "2 days ago",

    to: "/jobseeker/profile",

    read: true,

    type: "profile",
  },

  {
    id: 4,

    title: "PESO Assistance",

    message: "Your employment referral status was updated.",

    time: "3 days ago",

    to: "/jobseeker/assistance",

    read: true,

    type: "referral",
  },
]
