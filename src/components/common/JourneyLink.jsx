import { Link, useLocation } from "react-router"

export const isJourneyPath = (to) =>
  typeof to === "string" &&
  /^\/(peso|jobs|training|dashboard|help|search|feed|business|jobseeker\/(jobs|training|skill-analysis|assistance|skills|profile|settings|notifications|messages))(\/|\?|$)/.test(
    to,
  )

export function JourneyLink({ to, back = false, onClick, ...props }) {
  const location = useLocation()

  const returnState =
    location.pathname === "/jobs"
      ? { jobsReturn: location.pathname + location.search }
      : undefined

  return (
    <Link
      state={returnState}
      to={to}
      viewTransition
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented)
          document.documentElement.dataset.pageTransition = back
            ? "journey-back"
            : "journey-forward"
      }}
      {...props}
    />
  )
}
