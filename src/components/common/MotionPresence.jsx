import { useEffect, useState } from "react"

export function MotionPresence({ open, children, motion = "presence" }) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMounted(false)
      return
    }
    const timer = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(timer)
  }, [open])
  if (!open && !mounted) return null
  return (
    <div
      className={`contents ${motion}-${open ? "enter" : "exit"}`}
      inert={!open ? true : undefined}
      aria-hidden={!open ? true : undefined}
    >
      {children}
    </div>
  )
}
