import { createContext, useContext, useState } from "react"

const AiPreferences = createContext(null)

export function AiPreferencesProvider({ children }) {
  const [consent, setConsent] = useState(false)
  const [language, setLanguage] = useState("en")
  // Session memory only. Identity/role changes unmount the keyed workspace.
  return (
    <AiPreferences.Provider
      value={{ consent, setConsent, language, setLanguage }}
    >
      {children}
    </AiPreferences.Provider>
  )
}

export const useAiPreferences = () => useContext(AiPreferences)
