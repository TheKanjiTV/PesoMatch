import { useDemoState } from "../hooks/useDemoState.js"

import { useAuth } from "./AuthContext.jsx"

import { getOnboarding, getSkills } from "../services/account.js"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { mockMessages } from "../data/mockMessages.js"

import { getMockDashboard } from "../services/api.js"

import {
  normalizeAssistance,
  requestAssistance,
  withdrawAssistance,
  restoreAssistance,
  assistanceNotification,
} from "../services/assistanceService.js"

import { useRef } from "react"

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [data, setData] = useState(getMockDashboard)
  const [feedExtraCount, setFeedExtraCount] = useState(0)
  const [feedRefreshing, setFeedRefreshing] = useState(false)
  const feedTimer = useRef(null)
  useEffect(() => () => clearTimeout(feedTimer.current), [])
  const refreshHome = () => {
    if (feedTimer.current) return
    setFeedRefreshing(true)
    feedTimer.current = setTimeout(() => {
      setFeedExtraCount((count) => Math.min(count + 1, 11))
      setFeedRefreshing(false)
      feedTimer.current = null
    }, 600)
  }

  const { user, onboarding } = useAuth()

  const [workspacePreferences, setWorkspacePreferences] = useDemoState(
    user?.id,
    "workspace-preferences",
    {
      headline: "",
      language: "en",
      contentLanguage: "en",
      feedView: "relevant",
      jobUpdates: true,
      trainingUpdates: true,
      referralUpdates: true,
    },
  )

  const [feedPreferences, setFeedPreferences] = useDemoState(
    user?.id,
    "feed-preferences",
    { hidden: [], unfollowed: [], followed: [], reports: [] },
  )

  const [searchHistory, setSearchHistory] = useDemoState(
    user?.id,
    "search-history",
  )

  const [publicRevision, setPublicRevision] = useState(0)

  useEffect(() => {
    const update = () => setPublicRevision((value) => value + 1)

    window.addEventListener("storage", update)

    window.addEventListener("pesomatch:staff-demo-updated", update)

    return () => {
      window.removeEventListener("storage", update)
      window.removeEventListener("pesomatch:staff-demo-updated", update)
    }
  }, [])

  const [serverProfile, setServerProfile] = useState(null)

  const [skillLookup, setSkillLookup] = useState([])

  const [profileError, setProfileError] = useState("")

  const [profileLoading, setProfileLoading] = useState(true)

  const reloadProfile = useCallback(async () => {
    setProfileLoading(true)

    try {
      const [record, lookup] = await Promise.all([getOnboarding(), getSkills()])

      setServerProfile(record.data)

      setSkillLookup(lookup.data)

      setProfileError("")
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    reloadProfile()

    window.addEventListener("pesomatch:profile-updated", reloadProfile)

    return () =>
      window.removeEventListener("pesomatch:profile-updated", reloadProfile)
  }, [reloadProfile])

  const personal = serverProfile?.personal || {},
    preferences = serverProfile?.preferences || {}

  const profile = {
    headline: workspacePreferences.headline || "",

    role:
      user?.role === "admin"
        ? "Admin"
        : user?.role === "peso_staff"
          ? "PESO Staff"
          : user?.role === "employee"
            ? "Employee"
            : user?.role === "employer"
              ? "Employer"
              : "Jobseeker",

    firstName: personal.first_name || user?.first_name || "Jobseeker",

    lastName: personal.last_name || user?.last_name || "",

    email: user?.email || "",

    location: personal.municipality || "",

    education: serverProfile?.education?.highest_attainment || "",

    skills: (serverProfile?.skills?.skills || [])

      .map((id) => skillLookup.find((skill) => skill.id === id)?.name)

      .filter(Boolean),

    preferredFields: preferences.occupations || [],

    preferredLocation: preferences.preferred_location || "",

    employmentType: (preferences.employment_types || []).join(" / "),

    workArrangement: preferences.work_arrangements || [],

    profileCompletion: onboarding?.completion_percentage || 0,
  }

  const [savedJobs, setSavedJobs] = useDemoState(user?.id, "saved-jobs")

  const [savedTraining, setSavedTraining] = useDemoState(
    user?.id,

    "saved-training",
  )

  const [messages, setMessages] = useState(() => structuredClone(mockMessages))

  const [interestedTraining, setInterestedTraining] = useDemoState(
    user?.id,

    "interested-training",
  )

  const [drafts, setDrafts] = useState({})

  const [storedRequests, setStoredRequests] = useDemoState(
    user?.id,

    "assistance",
  )

  const requests = normalizeAssistance(storedRequests)

  const requestRef = useRef(requests)

  requestRef.current = requests

  const [assistanceNotifications, setAssistanceNotifications] = useDemoState(
    user?.id,

    "assistance-notifications",
  )

  const setRequests = (value) => {
    requestRef.current = value

    setStoredRequests(value)
  }

  const publishAssistance = (record, kind) => {
    const notification = assistanceNotification(record, kind)

    setAssistanceNotifications((items) => [notification, ...items])
  }

  const submitAssistance = (jobId, notes) => {
    const result = requestAssistance(jobId, user.id, requestRef.current, notes)

    setRequests(result.records)

    if (result.created) publishAssistance(result.record, "request")

    return result
  }

  const withdrawRequest = (id) => {
    const result = withdrawAssistance(id, user.id, requestRef.current)

    setRequests(result.records)

    publishAssistance(result.record, "withdraw")

    return result
  }

  const undoWithdrawal = (before) => {
    const result = restoreAssistance(before, user.id, requestRef.current)

    setRequests(result.records)

    publishAssistance(result.record, "restore")

    return result
  }

  const [savedAnnouncements, setSavedAnnouncements] = useDemoState(
    user?.id,

    "saved-announcements",
  )

  const [settings, setSettings] = useState({
    jobUpdates: true,

    trainingUpdates: true,

    referralUpdates: true,
  })

  const markRead = (id) => {
    setAssistanceNotifications((items) =>
      items.map((item) =>
        id === undefined || item.id === id ? { ...item, read: true } : item,
      ),
    )

    setData((current) => ({
      ...current,

      notifications: current.notifications.map((item) =>
        id === undefined || item.id === id ? { ...item, read: true } : item,
      ),
    }))
  }

  const replaceNotifications = (notifications) => {
    setAssistanceNotifications(
      notifications.filter((item) => String(item.id).startsWith("assistance:")),
    )

    setData((current) => ({
      ...current,

      notifications: notifications.filter(
        (item) => !String(item.id).startsWith("assistance:"),
      ),
    }))
  }

  const reset = () => {
    setData(getMockDashboard())

    setSavedJobs([])

    setSavedTraining([])

    setInterestedTraining([])

    setMessages(structuredClone(mockMessages))

    setDrafts({})

    setRequests([])

    setAssistanceNotifications([])

    setSettings({
      jobUpdates: true,

      trainingUpdates: true,

      referralUpdates: true,
    })
  }

  return (
    <DashboardContext.Provider
      value={{
        ...data,
        feedExtraCount,
        feedRefreshing,
        refreshHome,

        accountId: user?.id,

        workspacePreferences,
        setWorkspacePreferences,

        feedPreferences,
        setFeedPreferences,

        searchHistory,
        setSearchHistory,

        publicRevision,

        notifications: [...assistanceNotifications, ...data.notifications],

        profile,

        serverProfile,

        skillLookup,

        profileLoading,

        profileError,

        reloadProfile,

        markRead,

        replaceNotifications,

        settings,

        setSettings,

        reset,

        savedAnnouncements,

        setSavedAnnouncements,

        savedJobs,

        setSavedJobs,

        savedTraining,

        setSavedTraining,

        interestedTraining,

        setInterestedTraining,

        messages,

        setMessages,

        drafts,

        setDrafts,

        requests,

        submitAssistance,

        withdrawRequest,

        undoWithdrawal,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => useContext(DashboardContext)
