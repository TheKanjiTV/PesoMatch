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

export function WorkspaceLoadingProvider({ children, routePending = false }) {
  const [pending, setPending] = useState(() => new Set())
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)

  // Child resources register in layout effects before the first paint. Give
  // them a commit before deciding that an otherwise idle shell is ready.
  useLayoutEffect(() => setMounted(true), [])
  useLayoutEffect(() => {
    if (mounted && !routePending && pending.size === 0) setReady(true)
  }, [mounted, routePending, pending.size])

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
    () => ({ loading: pending.size > 0, initialLoading: !ready, track }),

    [pending, ready, track],
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
