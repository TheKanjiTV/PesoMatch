import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigation } from "react-router"
import { MIN_LOADING_MS, usesLogoLoading } from "./loading.js"
import { LogoLoading } from "./LoadingStates.jsx"

export function RouteScreen() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  const [readyPath, setReadyPath] = useState(null)
  const pending =
    usesLogoLoading(pathname) &&
    (readyPath !== pathname || navigation.state === "loading")
  useEffect(() => {
    const timer = setTimeout(() => setReadyPath(pathname), MIN_LOADING_MS)
    return () => clearTimeout(timer)
  }, [pathname])
  // Only the public entry pages use a logo overlay. Workspace requests and
  // navigation use their layout-specific skeletons without covering the shell.
  useEffect(() => {
    if (!pending) return
    // The mobile drawer owns body overflow; keep transition locking separate
    // so closing the drawer during navigation cannot leave the page locked.
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = "hidden"
    return () => {
      root.style.overflow = previousOverflow
    }
  }, [pending])
  return (
    <>
      <div inert={pending} aria-hidden={pending || undefined}>
        <Outlet />
      </div>
      {pending && <LogoLoading fullScreen />}
    </>
  )
}
