import { useLayoutEffect } from "react"

import { useLocation } from "react-router"
import { reducedMotion } from "./motionPreference.js"

export function PageMotion() {
  const location = useLocation()
  useLayoutEffect(() => {
    const reduce = reducedMotion()
    const main = document.querySelector("main")
    if (!main) return
    const animation = main.animate(
      reduce
        ? [{ opacity: 1 }, { opacity: 1 }]
        : [
            { transform: "translateY(8px)", opacity: 1 },
            { transform: "none", opacity: 1 },
          ],
      { duration: reduce ? 1 : 240, easing: "cubic-bezier(.16,1,.3,1)" },
    )
    return () => animation.cancel()
  }, [location.pathname, location.search])
  return null
}
