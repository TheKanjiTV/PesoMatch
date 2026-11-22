import { useState } from "react"
import { useResource } from "./api.js"
import { ResourceState } from "./ResourceState.jsx"

export function RecordPages({ rows, children }) {
  const settings = useResource("/table-settings")
  const perPage = settings.data?.rows_per_page ?? 20
  const [position, setPosition] = useState({ page: 1, perPage })
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage))
  const page = Math.min(
    position.perPage === perPage ? position.page : 1,
    lastPage,
  )
  const resource = {
    ...settings,
    data: { current_page: page, last_page: lastPage, total: rows.length },
    setPage: (page) => setPosition({ page, perPage }),
  }
  return (
    <ResourceState
      resource={resource}
      skeleton={
        <p role="status" className="py-4 text-sm text-muted-foreground">
          Loading table…
        </p>
      }
    >
      {children(rows.slice((page - 1) * perPage, page * perPage))}
    </ResourceState>
  )
}
