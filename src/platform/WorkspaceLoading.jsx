import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"

const WorkspaceLoading = createContext(null)

export function WorkspaceLoadingProvider({ children }) {
  const [pending, setPending] = useState(() => new Set())

  const track = useCallback((id) => {
    setPending((current) => new Set(current).add(id))

    return () =>
      setPending((current) => {
        const next = new Set(current)

        next.delete(id)

        return next
      })
  }, [])

  const value = useMemo(
    () => ({ loading: pending.size > 0, track }),

    [pending, track],
  )

  return (
    <WorkspaceLoading.Provider value={value}>
      {children}
    </WorkspaceLoading.Provider>
  )
}

export const useWorkspaceLoading = () => useContext(WorkspaceLoading)

export function useWorkspaceActivity(active) {
  const workspace = useWorkspaceLoading()

  const id = useId()

  const track = workspace?.track

  useLayoutEffect(() => {
    if (active && track) return track(id)
  }, [active, id, track])
}
