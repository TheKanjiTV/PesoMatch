import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthContext.jsx"
import { mockStaff } from "../data/mockStaff.js"
import {
  loadStaffState,
  saveStaffState,
  applyStaffAction,
} from "../services/staffAssistanceService.js"
import { can } from "../services/staffPermissions.js"
const StaffContext = createContext(null)
export function StaffProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(() => loadStaffState(user.id))
  const stateRef = useRef(state)
  const [actorId, setActorId] = useState(() => {
    try {
      return sessionStorage.getItem(`pesomatch:staff-preview:${user.id}`) || ""
    } catch {
      return ""
    }
  })
  const actor = mockStaff.find(
    (member) => member.id === actorId && member.active,
  )
  useEffect(() => {
    saveStaffState(user.id, stateRef.current)
  }, [user.id])
  useEffect(() => {
    const synchronize = (event) => {
      if (event.key !== `pesomatch:demo:${user.id}:staff-workspace`) return
      const fresh = loadStaffState(user.id)
      stateRef.current = fresh
      setState(fresh)
    }
    window.addEventListener("storage", synchronize)
    return () => window.removeEventListener("storage", synchronize)
  }, [user.id])
  const selectActor = (id) => {
    setActorId(id)
    try {
      sessionStorage.setItem(`pesomatch:staff-preview:${user.id}`, id)
    } catch {
      /* Current-session preview remains usable. */
    }
  }
  const commit = (next) => {
    stateRef.current = next
    setState(next)
    saveStaffState(user.id, next)
  }
  const act = (id, action, payload) => {
    const result = applyStaffAction(
      stateRef.current,
      actor,
      id,
      action,
      payload,
    )
    commit(result.state)
    return result
  }
  const markRead = (id) =>
    commit({
      ...stateRef.current,
      notifications: stateRef.current.notifications.map((item) =>
        !id || item.id === id ? { ...item, read: true } : item,
      ),
    })
  return (
    <StaffContext.Provider
      value={{
        state,
        actor,
        selectActor,
        act,
        markRead,
        can: (permission) => can(actor, permission),
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}
export const useStaff = () => useContext(StaffContext)
