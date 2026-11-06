import { useEffect } from "react"
import { useLocation } from "react-router"

const descriptions = {
  "/verify-email":
    "Email verification delivery is not configured for this academic PesoMatch deployment. Review the current account verification information.",
  "/": "Explore PesoMatch employment facilitation: jobseeker profiling, vacancies, PESO referrals, training enrollment, placement and employment outcome monitoring.",
  "/app":
    "Learn how to install the PesoMatch web app or use its Android companion to access the same employment services account.",
  "/login":
    "Sign in to your PesoMatch account to manage your profile, referrals, training enrollment and employment updates.",
  "/staff/login":
    "Sign in with a provisioned PESO staff, administrator, employer or training provider account.",
  "/register":
    "Create a free jobseeker account and begin your employment profile. Public registration is for jobseekers.",
  "/help":
    "Find official PESO job listings, the PESO office directory, TESDA and privacy assistance contacts. These agencies are external resources.",
  "/privacy":
    "Read the draft PesoMatch privacy notice covering personal information, resume processing, recipients, retention and privacy requests.",
  "/terms":
    "Read the draft PesoMatch terms describing account responsibilities, acceptable use and employment service limitations.",
  "/cookies":
    "Learn about necessary PesoMatch session cookies, appearance preferences and web app storage. No optional tracking is currently enabled.",
}

export function RouteMetadata() {
  const { pathname } = useLocation()
  useEffect(() => {
    const description = document.querySelector('meta[name="description"]')
    description?.setAttribute(
      "content",
      descriptions[pathname === "/home" ? "/" : pathname] ||
        (["/forgot-password", "/reset-password", "/password-updated"].includes(
          pathname,
        )
          ? "Password recovery email delivery is not enabled for this PesoMatch deployment. Review the available sign-in and account assistance options."
          : null) ||
        "PesoMatch employment services. Sign in to access the services permitted by your account.",
    )
    // The academic/local deployment remains unindexed. A production publication
    // decision must never make private routes indexable as a side effect.
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute("content", "noindex, nofollow")
  }, [pathname])
  return null
}
