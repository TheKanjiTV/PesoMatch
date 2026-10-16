import { expect } from "@playwright/test"

// Observe the real browser animations without delaying or replacing them.

export async function recordMotion(page) {
  await page.addInitScript(() => {
    window.navigationMotion = []

    const animate = Element.prototype.animate

    Element.prototype.animate = function (frames, options) {
      window.navigationMotion.push({
        kind: "exit",
        frames,
        duration: options.duration,
      })

      return animate.call(this, frames, options)
    }

    document.addEventListener(
      "animationstart",
      (event) => {
        if (
          !["auth-flow-enter", "onboarding-enter-back"].includes(
            event.animationName,
          )
        )
          return

        const animation = event.target
          .getAnimations()
          .find((item) => item.animationName === event.animationName)

        if (animation)
          window.navigationMotion.push({
            kind: "enter",
            name: event.animationName,

            target: event.target.id || event.target.tagName.toLowerCase(),

            frames: animation.effect.getKeyframes(),
            duration: animation.effect.getTiming().duration,
          })
      },
      true,
    )
  })
}

export async function expectPanelMotion(page, direction = "forward", target) {
  const expectedName =
    direction === "back" ? "onboarding-enter-back" : "auth-flow-enter"
  await expect
    .poll(() =>
      page.evaluate(
        ({ expectedName, target }) =>
          window.navigationMotion.filter(
            (item) =>
              item.kind === "enter" &&
              item.name === expectedName &&
              (!target || item.target === target),
          ).length,
        { expectedName, target },
      ),
    )
    .toBeGreaterThan(0)

  const motion = await page.evaluate(() => window.navigationMotion)

  const exit = motion.filter((item) => item.kind === "exit").at(-1)

  const enter = motion
    .filter(
      (item) =>
        item.kind === "enter" &&
        item.name === expectedName &&
        (!target || item.target === target),
    )
    .at(-1)

  expect(exit.frames.at(-1)).toEqual({
    opacity: 0,
    transform: `translateX(${direction === "back" ? 20 : -20}px)`,
  })

  expect(exit.duration + enter.duration).toBe(400)

  expect(enter.name).toBe(
    direction === "back" ? "onboarding-enter-back" : "auth-flow-enter",
  )

  expect(enter.frames[0].opacity).toBe("0")

  expect(enter.frames[0].transform).toBe(
    `translateX(${direction === "back" ? -20 : 20}px)`,
  )

  if (target) expect(enter.target).toBe(target)
}

export async function clearMotion(page) {
  await page.evaluate(() => {
    window.navigationMotion = []
  })
}
