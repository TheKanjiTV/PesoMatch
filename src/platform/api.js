import { useCallback, useEffect, useRef, useState } from "react"
import { accountRequest } from "../services/account.js"
import { withMinimumLoading } from "./loading.js"
import { normalizeSearch, searchError } from "./search.js"
export const api = (
  path,
  method = "GET",
  body,
  root = "/api/platform",
  options = {},
) => accountRequest(`${root}${path}`, { method, body, ...options })
export function useDebounced(value) {
  const [result, setResult] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 300)
    return () => clearTimeout(timer)
  }, [value])
  return result
}
export function useSearchQuery(value) {
  const [query, setQuery] = useState(() => normalizeSearch(value))
  useEffect(() => {
    if (searchError(value)) return
    const timer = setTimeout(() => setQuery(normalizeSearch(value)), 300)
    return () => clearTimeout(timer)
  }, [value])
  return query
}
export function useResource(path, root = "/api/platform") {
  const [state, setState] = useState({
    key: "",
    data: null,
    error: "",
    loading: true,
  })
  const generation = useRef(0)
  const controller = useRef(null)
  const [pagination, setPagination] = useState({ path, page: 1 })
  const page = pagination.path === path ? pagination.page : 1
  const requestPath = path + (path.includes("?") ? "&" : "?") + "page=" + page
  const key = root + requestPath
  const reload = useCallback(async () => {
    const request = ++generation.current
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setState((current) => ({ ...current, key, loading: true, error: "" }))
    try {
      const result = await withMinimumLoading(() =>
        api(requestPath, "GET", undefined, root, { signal: abort.signal }),
      )
      if (request === generation.current)
        setState({ key, data: result, error: "", loading: false })
      return result
    } catch (e) {
      if (request === generation.current && !abort.signal.aborted)
        setState({ key, data: null, error: e.message, loading: false })
    }
  }, [requestPath, root, key])
  useEffect(() => {
    reload()
    return () => {
      ++generation.current
      controller.current?.abort()
    }
  }, [reload])
  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : "",
    loading: state.key !== key || state.loading,
    reload,
    setPage: (page) => setPagination({ path, page }),
  }
}
