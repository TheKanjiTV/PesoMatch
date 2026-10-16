const deviceMotion = matchMedia("(prefers-reduced-motion: reduce)")
let manualMotion = false
try {
  manualMotion = !!JSON.parse(localStorage.getItem("peso-appearance") || "{}")
    .reduceMotion
} catch {}
window.addEventListener("peso:motion-change", (event) => {
  manualMotion = !!event.detail?.reduceMotion
})
export function reducedMotion() {
  return deviceMotion.matches || manualMotion
}
