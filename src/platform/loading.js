export const MIN_LOADING_MS = 400

export const usesLogoLoading = (pathname) =>
  ["/", "/home", "/login", "/staff/login", "/register"].includes(pathname)

// Keep the placeholder visible for 400 ms, while allowing slower work to finish.
// Errors follow the same timing so a fast failure does not flash the layout.
export async function withMinimumLoading(work) {
  const started = performance.now()
  try {
    return await work()
  } finally {
    const remaining = MIN_LOADING_MS - (performance.now() - started)
    if (remaining > 0)
      await new Promise((resolve) => setTimeout(resolve, remaining))
  }
}
