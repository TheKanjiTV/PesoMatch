import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  getAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "../services/account.js"

import { withMinimumLoading } from "../platform/loading.js"

const AuthContext = createContext(null)

export function destinationFor(onboarding, user) {
  if (user && user.role !== "jobseeker") return "/dashboard"
  return onboarding?.completed
    ? "/dashboard"
    : `/jobseeker/onboarding/${Math.min(5, Math.max(1, Number(onboarding?.current_step) || 1))}`
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, onboarding: null })

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const generation = useRef(0)

  const refresh = useCallback(async () => {
    const request = ++generation.current

    try {
      const result = await withMinimumLoading(getAccount)

      if (request === generation.current) {
        setSession({ user: result.user, onboarding: result.onboarding })

        setError("")
      }

      return result
    } catch (failure) {
      if (request === generation.current) {
        if (failure.status === 401) {
          setSession({ user: null, onboarding: null })

          setError("")
        } else {
          setError(
            failure.message ||
              "We couldn't connect to your account. Please try again.",
          )
        }
      }

      if (failure.status !== 401) throw failure

      return null
    } finally {
      if (request === generation.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh().catch(() => {})

    const profileUpdated = (event) => {
      if (event.detail?.onboarding) {
        setSession((current) => ({
          ...current,

          onboarding: event.detail.onboarding,
        }))
      }

      refresh().catch(() => {})
    }

    window.addEventListener("pesomatch:profile-updated", profileUpdated)

    return () =>
      window.removeEventListener("pesomatch:profile-updated", profileUpdated)
  }, [refresh])

  const authenticate = async (action, payload) => {
    ++generation.current

    try {
      const result = await action(payload)

      setSession({ user: result.user, onboarding: result.onboarding })

      setError("")

      return result
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutAccount()
    } catch (failure) {
      if (failure.status !== 401) throw failure
    }

    ++generation.current

    setSession({ user: null, onboarding: null })

    setError("")

    setLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        ...session,

        loading,

        error,

        refresh,

        login: (payload) => authenticate(loginAccount, payload),

        register: registerAccount,

        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) throw new Error("useAuth must be used within AuthProvider")

  return value
}
