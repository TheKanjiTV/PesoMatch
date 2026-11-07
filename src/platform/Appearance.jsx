import { createContext, useContext, useLayoutEffect, useState } from "react"

import { Moon, Sun } from "lucide-react"

const AppearanceContext = createContext(null)
const defaults = {
  theme: "hc1",
  large: false,
  reduceMotion: false,
  underlineLinks: false,
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("peso-appearance") || "{}")

      return {
        theme: saved.theme === "hc2" ? "hc2" : "hc1",

        large: !!saved.large,
        reduceMotion: !!saved.reduceMotion,
        underlineLinks: !!saved.underlineLinks,
      }
    } catch {
      return defaults
    }
  })

  useLayoutEffect(() => {
    document.documentElement.dataset.contrast = appearance.theme

    document.documentElement.dataset.textSize = appearance.large
      ? "large"
      : "standard"
    document.documentElement.dataset.motion = appearance.reduceMotion
      ? "reduced"
      : "system"
    document.documentElement.dataset.links = appearance.underlineLinks
      ? "underlined"
      : "standard"
    window.dispatchEvent(
      new CustomEvent("peso:motion-change", {
        detail: { reduceMotion: appearance.reduceMotion },
      }),
    )

    document

      .querySelector('meta[name="theme-color"]')

      ?.setAttribute(
        "content",

        appearance.theme === "hc2" ? "#18191A" : "#123d35",
      )

    try {
      localStorage.setItem("peso-appearance", JSON.stringify(appearance))
    } catch {
      /* Storage is optional. */
    }
  }, [appearance])

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export function AppearanceControls({ compact = false }) {
  const { appearance, setAppearance } = useContext(AppearanceContext)

  const dark = appearance.theme === "hc2"

  const label = dark ? "Switch to light mode" : "Switch to dark mode"

  return (
    <button
      type="button"
      className={`appearance-controls ${compact ? "appearance-compact" : ""}`}
      aria-label={label}
      title={label}
      onClick={() =>
        setAppearance((s) => ({ ...s, theme: dark ? "hc1" : "hc2" }))
      }
    >
      {dark ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  )
}

export function AppearanceSettings() {
  const { appearance, setAppearance } = useContext(AppearanceContext)

  return (
    <section
      className="mb-6 rounded-lg border border-border bg-card p-6"
      aria-labelledby="appearance-heading"
    >
      <h2
        id="appearance-heading"
        className="text-lg font-semibold text-primary"
      >
        Appearance
      </h2>
      <fieldset className="mt-5 border-b border-border pb-5">
        <legend className="font-semibold">Color theme</legend>
        <p className="mt-2 text-sm text-muted-foreground">
          Light, or layered charcoal dark mode. Saved on this device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            ["hc1", "Light", Sun],
            ["hc2", "Dark", Moon],
          ].map(([theme, label, Icon]) => (
            <button
              key={theme}
              type="button"
              aria-pressed={appearance.theme === theme}
              onClick={() => setAppearance((s) => ({ ...s, theme }))}
              className="appearance-theme-option"
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5 flex items-center justify-between gap-6">
        <div>
          <h3 id="larger-text-label" className="font-semibold">
            Larger text
          </h3>
          <p
            id="larger-text-help"
            className="mt-2 text-sm text-muted-foreground"
          >
            Increase text size across the platform. Saved on this device.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={appearance.large}
          aria-labelledby="larger-text-label"
          aria-describedby="larger-text-help"
          className="text-size-switch"
          onClick={() => setAppearance((s) => ({ ...s, large: !s.large }))}
        >
          <span />
        </button>
      </div>
      {[
        [
          "reduceMotion",
          "Reduce motion",
          "Limit page transitions and pause automatic 3D motion. Your device's reduced-motion preference also applies.",
        ],
        [
          "underlineLinks",
          "Underline links",
          "Make links easier to distinguish from surrounding text.",
        ],
      ].map(([key, label, help]) => (
        <div
          key={key}
          className="mt-5 flex items-center justify-between gap-6 border-t border-border pt-5"
        >
          <div>
            <h3 id={`${key}-label`} className="font-semibold">
              {label}
            </h3>
            <p
              id={`${key}-help`}
              className="mt-2 text-sm text-muted-foreground"
            >
              {help}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={appearance[key]}
            aria-labelledby={`${key}-label`}
            aria-describedby={`${key}-help`}
            className="text-size-switch"
            onClick={() => setAppearance((s) => ({ ...s, [key]: !s[key] }))}
          >
            <span />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mt-6 min-h-11 font-semibold text-primary underline underline-offset-4"
        onClick={() => setAppearance({ ...defaults })}
      >
        Reset appearance preferences
      </button>
    </section>
  )
}
