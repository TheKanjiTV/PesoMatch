import { lazy, Suspense, useEffect, useState } from "react"

import { Link } from "react-router"

import {
  ArrowLeft,
  Download,
  Monitor,
  Smartphone,
} from "lucide-react"

import { AppearanceControls } from "./Appearance.jsx"

import { Brand, primaryStyle } from "./ui.jsx"

const PhoneScene = lazy(() => import("./PhoneScene.jsx"))

import { InstallButton } from "./AppRuntime.jsx"

export function InstallPage() {
  const [android, setAndroid] = useState(null)

  useEffect(() => {
    document.title = "Install PESO | Employment Services"

    fetch("/app-release.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))

      .then(setAndroid)

      .catch(() => {})
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Brand />
        <AppearanceControls />
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        <Link
          to="/"
          className="mb-7 inline-flex min-h-11 items-center gap-2 font-bold text-primary"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>
        <div className="app-hero grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="font-display text-5xl font-bold leading-tight text-primary">
              PESO, wherever
              <br />
              your next step takes you.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Your profile, vacancies, referrals, training and employment
              updates. One account, on your phone or computer.
            </p>
            <div className="mt-7">
              <InstallButton />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Already installed? Open PESO from your home screen.
            </p>
            <Link to="/dashboard" className={`${primaryStyle} mt-7`}>
              Continue to my workspace
            </Link>
          </div>
          <Suspense
            fallback={<div className="phone-stage" aria-hidden="true" />}
          >
            <PhoneScene />
          </Suspense>
        </div>
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-3xl font-extrabold text-primary">
            Choose how to install.
          </h2>
          <div className="mt-7 grid gap-6 md:grid-cols-3">
            <article className="install-instructions">
              <Smartphone />
              <h3>Android · web app</h3>
              <ol>
                <li>Open the platform in Chrome or Edge.</li>
                <li>
                  Tap Install PESO app, or use the browser menu → Install app /
                  Add to Home screen.
                </li>
                <li>Open PESO from your app launcher.</li>
              </ol>
            </article>
            <article className="install-instructions">
              <Smartphone />
              <h3>iPhone / iPad</h3>
              <ol>
                <li>Open the platform in Safari.</li>
                <li>Tap Share → Add to Home Screen.</li>
                <li>Enable Open as Web App if shown, then tap Add.</li>
              </ol>
            </article>
            <article className="install-instructions">
              <Monitor />
              <h3>Computer</h3>
              <ol>
                <li>Open the platform in Chrome or Edge.</li>
                <li>
                  Use Install PESO app or the install icon in the address bar.
                </li>
                <li>Launch it from your desktop or Start menu.</li>
              </ol>
            </article>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-muted-foreground">
            Installation depends on browser support. On a phone, use the
            deployed HTTPS platform address; 127.0.0.1 points to the phone
            itself. Online access is required for sign-in and all service
            records. Personal records are not cached for offline access.
          </p>
        </section>
        <section className="mt-12 rounded-2xl border border-border bg-card p-7">
          <h2 className="text-2xl font-extrabold text-primary">
            Android application
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            The Android companion opens the same platform in a dedicated app,
            with mobile navigation and Android Back support. It connects to
            pesomatch.site automatically.
          </p>
          {android?.available ? (
            <>
              <a
                className={`${primaryStyle} mt-5`}
                href={android.versionCode ? `${android.url}?v=${android.versionCode}` : android.url}
                download
              >
                <Download size={18} />
                Download Android APK
              </a>
              <p className="mt-3 text-sm text-muted-foreground">
                Version {android.version} · Direct download
              </p>
            </>
          ) : (
            <p className="mt-5 font-semibold text-muted-foreground">
              Android project is included with the source. See the mobile setup
              guide for the APK build.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
