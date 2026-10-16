import { reducedMotion } from "../platform/motionPreference.js"
// Pair this 180ms panel exit with the 220ms CSS entrance: 400ms total.

// Keep the navigation shell still and skip movement for reduced motion.

export async function exitPanel(panel, direction = "forward") {
  if (!panel?.animate || reducedMotion()) return

  await panel
    .animate(
      [
        { opacity: 1, transform: "translateX(0)" },

        {
          opacity: 0,
          transform: `translateX(${direction === "back" ? 20 : -20}px)`,
        },
      ],

      { duration: 180, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
    )
    .finished.catch(() => {})
}
