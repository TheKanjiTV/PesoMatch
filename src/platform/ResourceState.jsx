import { Loading, Notice, secondaryStyle } from "./ui.jsx"

export function ResourceState({ resource, children, paginate = true }) {
  if (resource.loading) return <Loading />

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
      {paginate && resource.data?.last_page > 1 && (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
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
              disabled={resource.data.current_page === resource.data.last_page}
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
