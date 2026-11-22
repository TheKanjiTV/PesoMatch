import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { accountRequest } from "../services/account.js"

import { withMinimumLoading } from "./loading.js"

import { normalizeSearch, searchError } from "./search.js"

import { useWorkspaceLoading } from "./WorkspaceLoading.jsx"

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

const tableSettingsEvent = "peso-table-settings-changed"

export function refreshTableSettings() {
  window.dispatchEvent(new Event(tableSettingsEvent))

  try {
    localStorage.setItem(tableSettingsEvent, String(Date.now()))
  } catch {
    /* Refresh still works when browser storage is unavailable. */
  }
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

  const [settingsVersion, setSettingsVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setSettingsVersion((version) => version + 1)

    const onStorage = (event) => {
      if (event.key === tableSettingsEvent) refresh()
    }

    window.addEventListener(tableSettingsEvent, refresh)

    window.addEventListener("storage", onStorage)

    return () => {
      window.removeEventListener(tableSettingsEvent, refresh)

      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const [pagination, setPagination] = useState({
    path,

    page: 1,

    settingsVersion,
  })

  const page =
    pagination.path === path && pagination.settingsVersion === settingsVersion
      ? pagination.page
      : 1

  const requestPath = path + (path.includes("?") ? "&" : "?") + "page=" + page

  const key = root + requestPath + "#" + settingsVersion

  const loading = state.key !== key || state.loading

  const workspace = useWorkspaceLoading()

  const resourceId = useId()

  const track = workspace?.track

  useLayoutEffect(() => {
    if (loading && track && !key.startsWith("/api/public/"))
      return track(resourceId)
  }, [loading, track, resourceId, key])

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

      if (
        request === generation.current &&
        result?.last_page >= 1 &&
        result.current_page > result.last_page
      ) {
        setPagination({ path, page: result.last_page, settingsVersion })

        return result
      }

      if (request === generation.current)
        setState({ key, data: result, error: "", loading: false })

      return result
    } catch (e) {
      if (request === generation.current && !abort.signal.aborted)
        setState({ key, data: null, error: e.message, loading: false })
    }
  }, [requestPath, root, key, path, settingsVersion])

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

    loading,

    settingsVersion,

    reload,

    setPage: (page) => setPagination({ path, page, settingsVersion }),
  }
}
