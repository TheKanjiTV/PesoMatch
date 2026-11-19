import { lazy, Suspense, useState } from "react"
import { Link } from "react-router"
import { Modal } from "./Modal.jsx"

const Catalog = lazy(() =>
  import("./Catalog.jsx").then((m) => ({ default: m.CatalogPage })),
)

export function RecordLink({ to, children, onClick, ...props }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
    window.dispatchEvent(new Event("peso:catalog-changed"))
  }
  const match =
    typeof to === "string" && to.match(/^\/(jobs|training)\/(\d+)(?:\?.*)?$/)
  if (!match)
    return (
      <Link to={to} onClick={onClick} {...props}>
        {children}
      </Link>
    )
  return (
    <>
      <Link
        to={to}
        {...props}
        onClick={(e) => {
          onClick?.(e)
          if (
            !e.defaultPrevented &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey &&
            !e.altKey &&
            e.button === 0
          ) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {children}
      </Link>
      {open && (
        <Modal
          title={
            match[1] === "training"
              ? "Training program details"
              : "Vacancy details"
          }
          onClose={close}
        >
          <Suspense fallback={<p role="status">Loading record details…</p>}>
            <Catalog
              kind={match[1] === "training" ? "training" : "vacancies"}
              previewId={match[2]}
              onPreviewClose={close}
            />
          </Suspense>
        </Modal>
      )}
    </>
  )
}
