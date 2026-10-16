import { createContext, useContext, useEffect, useState } from "react"

import { Check, CircleAlert, Info, X } from "lucide-react"
import { MotionPresence } from "./MotionPresence.jsx"

const FeedbackContext = createContext(null)

export function FeedbackProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [open, setOpen] = useState(false)

  const [paused, setPaused] = useState(false)

  const notify = (message, { type = "success", undo } = {}) => {
    setPaused(false)

    setToast({ message, type, undo, id: Date.now() })
    setOpen(true)
  }

  useEffect(() => {
    if (!toast || !open || paused) return

    const timeout = setTimeout(() => setOpen(false), 10000)

    return () => clearTimeout(timeout)
  }, [toast, open, paused])

  const Icon =
    toast?.type === "success"
      ? Check
      : toast?.type === "info"
        ? Info
        : CircleAlert

  return (
    <FeedbackContext.Provider value={{ notify }}>
      {children}
      <MotionPresence open={open} motion="toast">
        {toast && (
          <div
            className="fixed bottom-5 right-5 z-50 flex w-[calc(100%_-_40px)] max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 text-foreground shadow-lg"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setPaused(false)
            }}
          >
            <Icon
              size={20}
              className="mt-3 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p
              role={toast.type === "error" ? "alert" : "status"}
              className="flex-1 py-2.5 text-sm leading-6"
            >
              {toast.message}
            </p>
            {toast.undo && (
              <button
                className="min-h-11 text-sm font-semibold text-primary underline underline-offset-4"
                onClick={() => {
                  const undo = toast.undo
                  setOpen(false)
                  undo()
                }}
              >
                Undo
              </button>
            )}
            <button
              className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"
              aria-label="Dismiss notification"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </MotionPresence>
    </FeedbackContext.Provider>
  )
}

export const useFeedback = () => useContext(FeedbackContext)
