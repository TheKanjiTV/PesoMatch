// Browser-only demo records. Namespaced per authenticated account; never store credentials.

export function readDemo(userId, section, fallback = []) {
  try {
    const value = JSON.parse(
      localStorage.getItem(`pesomatch:demo:${userId}:${section}`),
    )
    return Array.isArray(fallback)
      ? Array.isArray(value)
        ? value
        : fallback
      : value && typeof value === "object"
        ? value
        : fallback
  } catch {
    return fallback
  }
}

export function writeDemo(userId, section, value) {
  try {
    localStorage.setItem(
      `pesomatch:demo:${userId}:${section}`,
      JSON.stringify(value),
    )
  } catch {
    /* Private/quota-limited browsers retain session state. */
  }

  return value
}
