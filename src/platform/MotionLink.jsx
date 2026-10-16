import { Link } from "react-router"

export function MotionLink({ direction = "forward", onClick, ...props }) {
  return (
    <Link
      {...props}
      viewTransition
      onClick={(e) => {
        if (
          !e.defaultPrevented &&
          e.button === 0 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        )
          document.documentElement.dataset.pageTransition = direction
        onClick?.(e)
      }}
    />
  )
}
