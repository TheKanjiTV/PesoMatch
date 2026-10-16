export function waitingVersion(worker) {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const finish = (value) => {
      clearTimeout(timer)
      channel.port1.close()
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), 1200)
    channel.port1.onmessage = (event) =>
      finish(
        typeof event.data?.version === "string" ? event.data.version : null,
      )
    try {
      worker.postMessage({ type: "GET_VERSION" }, [channel.port2])
    } catch {
      finish(null)
    }
  })
}

export async function announceUpdate(worker) {
  if (!worker || worker.state !== "installed") return
  let version = await waitingVersion(worker)
  // Compatibility for a waiting worker built before GET_VERSION existed.
  if (!version) {
    try {
      version = (
        await (await fetch("/sw.js", { cache: "no-store" })).text()
      ).match(/peso-shell-([a-f0-9]{12})/)?.[1]
    } catch {}
  }
  if (!version || worker.state !== "installed") return
  window.dispatchEvent(
    new CustomEvent("peso:update", { detail: { worker, version } }),
  )
}
