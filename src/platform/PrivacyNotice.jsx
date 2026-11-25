import { useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router"
import { legalNotices } from "../app/auth/legal.js"
import { Modal } from "./Modal.jsx"
import { primaryStyle } from "./ui.jsx"

export function PrivacyDialog({ onClose }) {
  const notice = legalNotices["/privacy"]
  return (
    <Modal title={notice.title} size="reading" onClose={onClose}>
      <div className="mx-auto max-w-prose space-y-6 text-sm leading-7">
        <p className="text-muted-foreground">
          Implementation-based draft. Operator approval and legal review
          required before public launch.
        </p>
        {notice.sections.map(([heading, text]) => (
          <section key={heading}>
            <h3 className="mb-2 font-semibold text-primary">{heading}</h3>
            <p className="text-muted-foreground">{text}</p>
          </section>
        ))}
        <a
          className="inline-block font-semibold text-primary underline"
          href="https://privacy.gov.ph/data-subject-rights/"
          target="_blank"
          rel="noopener noreferrer"
        >
          National Privacy Commission: data subject rights
        </a>
        <div className="flex justify-end border-t border-border pt-5">
          <button type="button" className={primaryStyle} onClick={onClose}>
            Close privacy notice
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function PrivacyLink({ children, onClick, to, target, rel, ...props }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Link
        {...props}
        to="/privacy"
        aria-haspopup="dialog"
        onClick={(event) => {
          onClick?.(event)
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        {children}
      </Link>
      {open &&
        createPortal(
          <PrivacyDialog onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  )
}
