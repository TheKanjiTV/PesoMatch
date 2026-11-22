import { Notice, secondaryStyle } from "./ui.jsx"

import { PageSkeleton } from "./LoadingStates.jsx"

import { useLocation } from "react-router"

export function ResourceState({
  resource,

  children,

  paginate = true,

  skeleton,
}) {
  const { pathname } = useLocation()

  if (resource.loading) return skeleton || <PageSkeleton pathname={pathname} />

  if (resource.error)
    return (
      <div className="space-y-4">
        <Notice error>{resource.error}</Notice>
        <button className={secondaryStyle} onClick={resource.reload}>
          Retry loading
        </button>
      </div>
    )

  return (
    <>
      {children}
      {paginate && resource.data?.last_page >= 1 && (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span
            aria-live="polite"
            className="text-muted-foreground tabular-nums"
          >
            Page {resource.data.current_page} of {resource.data.last_page} ·{" "}
            {resource.data.total} records
          </span>
          <div className="flex gap-3">
            <button
              className={secondaryStyle}
              disabled={resource.data.current_page === 1}
              onClick={() => resource.setPage(resource.data.current_page - 1)}
            >
              Previous page
            </button>
            <button
              className={secondaryStyle}
              disabled={resource.data.current_page >= resource.data.last_page}
              onClick={() => resource.setPage(resource.data.current_page + 1)}
            >
              Next page
            </button>
          </div>
        </div>
      )}
    </>
  )
}
