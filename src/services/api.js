import { mockProfile, mockSkillGaps } from "../data/mockProfile.js"

import { getJobs } from "./jobsService.js"

import { mockTrainings } from "../data/mockTrainings.js"

import { mockReferrals } from "../data/mockReferrals.js"

import { mockNotifications } from "../data/mockNotifications.js"
import { assistanceExampleNotifications } from "../data/mockAssistance.js"

// FUTURE LARAVEL API ONLY: no fetch, Axios, endpoint implementation or AI call here.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"

const copy = (value) => structuredClone(value)

// TODO GET /api/jobseeker/profile; PUT /api/jobseeker/profile

export const getJobseekerProfile = () => Promise.resolve(copy(mockProfile))

// TODO GET /api/jobseeker/job-matches; GET /api/jobseeker/job-matches/{job}

export const getJobMatches = () => Promise.resolve(getJobs())

// TODO GET /api/training-recommendations

export const getTrainingRecommendations = () =>
  Promise.resolve(copy(mockTrainings))

// TODO GET /api/jobseeker/skill-gaps

export const getSkillGaps = () => Promise.resolve(copy(mockSkillGaps))

// TODO GET /api/jobseeker/peso-assistance

export const getPesoAssistance = () => Promise.resolve(copy(mockReferrals))

// TODO GET /api/jobseeker/notifications

export const getNotifications = () => Promise.resolve(copy(mockNotifications))

// Immediate initial snapshot avoids an artificial startup/loading delay.

export const getMockDashboard = () =>
  copy({
    profile: mockProfile,

    jobs: getJobs(),

    trainings: mockTrainings,

    skillGaps: mockSkillGaps,

    referrals: mockReferrals,

    notifications: [
      ...mockNotifications.filter((item) => item.id !== 4),
      ...assistanceExampleNotifications,
    ],
  })
