import { useState } from "react"

import { readDemo, writeDemo } from "../services/demoStore.js"

export function useDemoState(userId, section, fallback = []) {
  const key = `${userId}:${section}`

  const [record, setRecord] = useState(() => ({
    key,
    value: readDemo(userId, section, fallback),
  }))

  const value =
    record.key === key ? record.value : readDemo(userId, section, fallback)

  function setValue(next) {
    setRecord((current) => {
      const before =
        current.key === key
          ? current.value
          : readDemo(userId, section, fallback)

      const value = typeof next === "function" ? next(before) : next

      writeDemo(userId, section, value)

      return { key, value }
    })
  }

  return [value, setValue]
}
