import { useCallback, useEffect, useState } from "react"
import { accountRequest } from "../services/account.js"
export const api = (path, method = "GET", body, root = "/api/platform") =>
  accountRequest(`${root}${path}`, { method, body })
export function useDebounced(value) {
  const [result, setResult] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), 300)
    return () => clearTimeout(timer)
  }, [value])
  return result
}
export function useResource(path, root = "/api/platform") {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ path, page: 1 })
  const page = pagination.path === path ? pagination.page : 1
  const requestPath = path + (path.includes("?") ? "&" : "?") + "page=" + page
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api(requestPath, "GET", undefined, root)
      setData(result)
      setError("")
      return result
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [requestPath, root])
  useEffect(() => {
    let alive = true
    setLoading(true)
    setData(null)
    api(requestPath, "GET", undefined, root)
      .then((d) => {
        if (alive) {
          setData(d)
          setError("")
        }
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [requestPath, root])
  return {
    data,
    error,
    loading,
    reload,
    setPage: (page) => setPagination({ path, page }),
  }
}
