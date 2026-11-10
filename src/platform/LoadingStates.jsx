import { LoaderCircle } from "lucide-react"

import { PesoMark } from "./Logo.jsx"

import { CollectionNotice } from "./CollectionNotice.jsx"

export function LogoLoading({ fullScreen = false, label = "Loading…" }) {
  return (
    <div
      role="status"
      aria-label={`PESO ${label}`}
      aria-busy="true"
      data-logo-loading="true"
      className={
        fullScreen
          ? "fixed inset-0 z-[200] grid place-items-center bg-background text-primary"
          : "grid min-h-48 place-items-center py-10 text-primary"
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div aria-hidden="true" className="flex items-center gap-3">
          <PesoMark className="size-14" />
          <span className="text-3xl font-extrabold tracking-tight">PESO</span>
        </div>
        <span className="flex items-center gap-3 text-sm font-medium">
          <LoaderCircle
            aria-hidden="true"
            className="size-5 motion-safe:animate-spin"
          />
          {label}
        </span>
      </div>
    </div>
  )
}

function Bar({ className = "h-4 w-2/3" }) {
  return <div className={`rounded bg-border ${className}`} />
}

export function SidebarSkeleton({ items = 11, role = "jobseeker" }) {
  return (
    <div
      role="status"
      aria-label="Loading sidebar menu"
      aria-busy="true"
      data-skeleton="sidebar"
      className="flex min-h-0 flex-1 flex-col"
    >
      <span className="sr-only">Loading sidebar menu…</span>
      <div
        aria-hidden="true"
        className="flex min-h-0 flex-1 flex-col motion-safe:animate-pulse"
      >
        <div className="hidden items-center gap-3 px-7 py-8 lg:flex">
          <Bar className="size-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Bar className="h-6 w-24" />
            <Bar className="h-3 w-32" />
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-hidden px-3 py-4">
          {Array.from({ length: items }, (_, i) => (
            <div
              key={i}
              className="flex min-h-12 items-center gap-3 rounded-lg px-3"
            >
              <Bar className="size-[18px] shrink-0" />
              <Bar
                className={`h-4 ${
                  i % 3 === 1 ? "w-40" : i % 3 === 2 ? "w-32" : "w-28"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="space-y-5 border-t border-border p-7">
          {Array.from({ length: role === "jobseeker" ? 3 : 2 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bar className="size-4" />
              <Bar className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function MobileNavigationSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading mobile navigation"
      aria-busy="true"
      data-skeleton="mobile-navigation"
      className="col-span-5 grid w-full grid-cols-5 motion-safe:animate-pulse"
    >
      <span className="sr-only">Loading mobile navigation…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex min-h-16 flex-col items-center justify-center gap-2"
        >
          <Bar className="size-5" />
          <Bar className="h-2 w-10" />
        </div>
      ))}
    </div>
  )
}

export function WorkspaceHeaderSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading workspace header"
      aria-busy="true"
      data-skeleton="workspace-header"
      className="workspace-topbar flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 sm:px-9"
    >
      <span className="sr-only">Loading account and workspace actions…</span>
      <div
        aria-hidden="true"
        className="workspace-identity flex min-w-0 items-center gap-3 motion-safe:animate-pulse"
      >
        <Bar className="size-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Bar className="h-4 w-32" />
          <Bar className="h-3 w-20" />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="workspace-actions flex items-center gap-3 motion-safe:animate-pulse"
      >
        <Bar className="size-10 rounded-full" />
        <Bar className="hidden h-12 w-24 rounded-lg lg:block" />
        <Bar className="hidden h-3 w-24 lg:block" />
      </div>
    </div>
  )
}

export function WorkspaceBrandSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-3 motion-safe:animate-pulse"
    >
      <Bar className="size-10" />
      <div className="space-y-2">
        <Bar className="h-6 w-20" />
        <Bar className="h-3 w-28" />
      </div>
    </div>
  )
}

export function WorkspaceShellSkeleton({ pathname, role = "jobseeker" }) {
  if (pathname?.startsWith("/jobseeker/onboarding"))
    return (
      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <PageSkeleton pathname={pathname} role={role} />
      </main>
    )

  const counts = {
    admin: 13,
    peso_staff: 11,
    jobseeker: 11,
    employer: 7,
    training_provider: 6,
  }

  return (
    <div
      className="platform-shell min-h-dvh bg-background"
      data-skeleton="workspace-shell"
    >
      <div
        aria-hidden="true"
        className="mobile-app-header flex min-h-20 items-center justify-between border-b border-border bg-card px-4 lg:hidden"
      >
        <WorkspaceBrandSkeleton />
        <Bar className="size-6" />
      </div>
      <aside className="workspace-sidebar fixed inset-y-0 left-0 hidden w-[272px] flex-col border-r border-border lg:flex">
        <SidebarSkeleton items={counts[role] || 11} role={role} />
      </aside>
      <div className="lg:pl-[272px]">
        <WorkspaceHeaderSkeleton />
        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-9 lg:py-10">
          <PageSkeleton pathname={pathname} role={role} />
        </main>
      </div>
      <div className="app-bottom-nav lg:hidden">
        <MobileNavigationSkeleton />
      </div>
    </div>
  )
}

function Lines({ count = 2 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <Bar
          key={i}
          className={`h-3 ${i === count - 1 ? "w-4/5" : "w-full"}`}
        />
      ))}
    </div>
  )
}

function ButtonBar({ className = "w-44" }) {
  return <Bar className={`h-12 ${className}`} />
}

function Frame({ children, kind, label }) {
  return (
    <div
      role="status"
      aria-label={label || `Loading ${kind.replaceAll("-", " ")}…`}
      aria-busy="true"
      data-skeleton="screen"
      data-skeleton-layout={kind}
      className="w-full"
    >
      <span className="sr-only">
        {label || `Loading ${kind.replaceAll("-", " ")}…`}
      </span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        {children}
      </div>
    </div>
  )
}

function PageHeading() {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 basis-72 max-w-3xl space-y-4">
        <Bar className="h-10 w-4/5" />
        <Bar className="h-4 w-full max-w-2xl" />
        <Bar className="h-4 w-2/3" />
      </div>
      <ButtonBar className="w-52" />
    </div>
  )
}

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      {children}
    </div>
  )
}

function Tags() {
  return (
    <div className="flex flex-wrap gap-2">
      <Bar className="h-6 w-24" />
      <Bar className="h-6 w-32" />
    </div>
  )
}

// Route/session/module fallbacks use the destination's structure too. Data

// components retain their more specific, local skeletons once mounted.

export function PageSkeleton({ pathname = "/dashboard", role = "jobseeker" }) {
  const parts = pathname.split("/").filter(Boolean)

  const page = parts[0]

  let content

  if (page === "dashboard") return <OverviewSkeleton role={role} />

  if (page === "settings") return <SettingsSkeleton />

  if (page === "jobseeker" && parts[1] === "onboarding")
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeading />
        <OnboardingSkeleton step={Number(parts[2]) || 1} />
      </div>
    )

  if (page === "jobs" && role === "employer" && !parts[1])
    content = (
      <>
        <div aria-hidden="true" className="mb-6 flex flex-wrap gap-2">
          <ButtonBar className="w-32" />
          <ButtonBar className="w-32" />
          <ButtonBar className="w-28" />
        </div>
        <TableSkeleton kind="employer-vacancies" columns={6} />
      </>
    )
  else if (["jobs", "training"].includes(page))
    content = (
      <>
        {!parts[1] && (
          <div aria-hidden="true" className="mb-6">
            <Bar className="h-12 w-full" />
          </div>
        )}
        <CatalogSkeleton
          training={page === "training"}
          detail={Boolean(parts[1])}
        />
      </>
    )
  else if (page === "matches")
    content = (
      <>
        <div aria-hidden="true" className="mb-6 rounded-lg bg-secondary p-4">
          <Lines />
        </div>
        <div aria-hidden="true" className="mb-6 flex flex-wrap gap-3">
          <ButtonBar />
          <ButtonBar />
        </div>
        <MatchesSkeleton />
      </>
    )
  else if (
    ["referrals", "enrollments", "placements", "outcomes", "services"].includes(
      page,
    )
  )
    content = (
      <>
        <div aria-hidden="true" className="mb-6">
          <Bar className="h-12 w-full max-w-lg" />
        </div>
        <RecordsSkeleton kind={page} />
      </>
    )
  else if (page === "jobseekers")
    content = (
      <>
        <div aria-hidden="true" className="mb-6">
          <Bar className="h-12 w-full max-w-xl" />
        </div>
        <RegistrySkeleton />
      </>
    )
  else if (page === "events") content = <EventsSkeleton />
  else if (page === "labor-market")
    content = (
      <LaborMarketSkeleton staff={["admin", "peso_staff"].includes(role)} />
    )
  else if (page === "users")
    content = <TableSkeleton kind="access" columns={4} />
  else if (page === "audit")
    content = <TableSkeleton kind="audit" columns={5} />
  else if (page === "profile")
    content = (
      <>
        <ResumeSkeleton />
        <ProfileSkeleton />
      </>
    )
  else
    content = (
      <Frame kind="page">
        <Lines count={4} />
      </Frame>
    )

  return (
    <div data-route-skeleton="true">
      <div aria-hidden="true">
        <PageHeading />
      </div>
      {content}
    </div>
  )
}

function Stats({ employer = false }) {
  return (
    <div
      className={`overview-stats mb-10 grid ${
        employer ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2 xl:grid-cols-4"
      }`}
    >
      {Array.from({ length: employer ? 3 : 4 }, (_, i) => (
        <div key={i} className="bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <Bar className="h-3 w-3/5" />
            <Bar className="size-4" />
          </div>
          <Bar className="mt-4 h-9 w-12" />
        </div>
      ))}
    </div>
  )
}

function EventCards({ overview = false }) {
  return (
    <div className={overview ? "space-y-3" : "space-y-4"}>
      {[0, 1, 2].map((i) => (
        <Panel key={i} className={overview ? "p-5" : ""}>
          <Tags />
          <Bar className={`mt-4 ${overview ? "h-4" : "h-7"} w-3/4`} />
          <Bar className="mt-3 h-3 w-2/3" />
          <Bar className="mt-3 h-3 w-1/2" />
          {!overview && (
            <>
              <div className="mt-4">
                <Lines />
              </div>
              <div className="mt-5">
                <ButtonBar />
              </div>
            </>
          )}
        </Panel>
      ))}
    </div>
  )
}

export function OverviewSkeleton({ role = "jobseeker" }) {
  return (
    <Frame kind="overview">
      <PageHeading />
      <div className="overview-banner mb-8 grid overflow-hidden rounded-xl md:grid-cols-[1.4fr_1fr]">
        <div className="p-6 sm:p-8">
          <Bar className="h-9 w-full" />
          <Bar className="mt-3 h-9 w-3/5" />
          <div className="mt-4 max-w-xl">
            <Lines />
          </div>
          <div className="mt-6">
            <ButtonBar className="w-60" />
          </div>
        </div>
        <div className="overview-pathway border-t p-6 sm:p-8 md:border-l md:border-t-0">
          <Bar className="h-4 w-2/3" />
          <div className="mt-5 hidden space-y-4 md:block">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Bar className="size-6 shrink-0 rounded-full" />
                <Bar className={`h-4 ${i % 2 ? "w-4/5" : "w-2/3"}`} />
              </div>
            ))}
          </div>
          <div className="mt-4 md:hidden">
            <ButtonBar className="w-full" />
          </div>
        </div>
      </div>
      {role !== "training_provider" && <Stats employer={role === "employer"} />}
      <div className="grid gap-10 xl:grid-cols-[1.3fr_1fr]">
        <section>
          <Bar className="mb-5 h-7 w-3/5" />
          <div className="divide-y divide-border rounded-lg border border-border bg-card px-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-5 py-6">
                <div className="w-full">
                  <Bar className="h-4 w-3/5" />
                  <div className="mt-3">
                    <Lines />
                  </div>
                </div>
                <Bar className="size-5 shrink-0" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-5 flex items-center justify-between">
            <Bar className="h-7 w-1/2" />
            <Bar className="h-3 w-16" />
          </div>
          <EventCards overview />
        </section>
      </div>
    </Frame>
  )
}

export function CatalogSkeleton({ detail = false, training = false }) {
  if (detail)
    return (
      <Frame kind={training ? "training-detail" : "vacancy-detail"}>
        <Bar className="mb-6 h-5 w-36" />
        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <Panel className="sm:p-8">
            <Tags />
            <Bar className="mt-5 h-9 w-3/4" />
            <Bar className="mt-3 h-4 w-1/2" />
            {[0, 1, 2].slice(0, training ? 3 : 2).map((i) => (
              <div key={i} className="mt-8">
                <Bar className="mb-4 h-5 w-2/5" />
                <Lines count={i === 0 ? 5 : 3} />
              </div>
            ))}
          </Panel>
          <Panel className="h-fit bg-muted">
            <Bar className="h-7 w-3/4" />
            <div className="mt-6 space-y-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Bar className="h-3 w-1/3" />
                  <Bar className="mt-2 h-4 w-2/3" />
                </div>
              ))}
            </div>
            <div className="mt-7">
              <ButtonBar className="w-full" />
            </div>
          </Panel>
        </div>
      </Frame>
    )

  return (
    <Frame kind={training ? "training-catalog" : "vacancy-catalog"}>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Panel key={i}>
            <Tags />
            <Bar className="mt-5 h-7 w-4/5" />
            <Bar className="mt-2 h-4 w-3/5" />
            <Bar className="mt-4 h-3 w-1/2" />
            <div className="mt-4">
              <Lines />
            </div>
            <div className="mt-5">
              <Tags />
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Bar className="h-3 w-2/5" />
              <Bar className="h-5 w-1/3" />
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function RecordsSkeleton({ kind = "referrals" }) {
  return (
    <Frame kind={kind}>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Panel key={i}>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="w-3/5 space-y-3">
                <Bar className="h-3 w-2/5" />
                <Bar className="h-6 w-full" />
                <Bar className="h-4 w-3/4" />
              </div>
              <Bar className="h-6 w-28" />
            </div>
            <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
              {[0, 1].map((j) => (
                <div key={j}>
                  <Bar className="mb-3 h-3 w-1/3" />
                  <Lines />
                </div>
              ))}
            </div>
            {kind === "placements" && (
              <div className="mt-5">
                <Lines count={3} />
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonBar />
              <ButtonBar className="w-32" />
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function RegistrySkeleton() {
  return (
    <Frame kind="registry">
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Panel key={i} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="w-full space-y-3 sm:w-2/5">
                <Bar className="h-4 w-3/5" />
                <Bar className="h-3 w-4/5" />
              </div>
              <div className="flex items-center gap-3">
                <Bar className="h-6 w-28" />
                <ButtonBar className="w-36" />
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function TableSkeleton({ kind = "access", columns = 4 }) {
  return (
    <Frame kind={kind}>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div
          className={
            columns === 6
              ? "min-w-[820px]"
              : columns === 3
                ? "min-w-[420px]"
                : columns === 5
                  ? "min-w-[650px]"
                  : "min-w-[600px]"
          }
        >
          <div
            className="grid gap-4 bg-secondary p-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }, (_, i) => (
              <Bar key={i} className="h-3 w-2/3" />
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="grid items-center gap-4 border-t border-border p-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }, (_, j) => (
                <Bar
                  key={j}
                  className={
                    kind === "access" && j === columns - 1
                      ? "h-12 w-4/5"
                      : "h-4 w-4/5"
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function EventsSkeleton({ overview = false }) {
  return (
    <Frame kind={overview ? "overview-events" : "events"}>
      <EventCards overview={overview} />
    </Frame>
  )
}

export function StatsSkeleton({ employer = false }) {
  return (
    <Frame kind="overview-stats">
      <Stats employer={employer} />
    </Frame>
  )
}

export function MatchesSkeleton({ training = false }) {
  return (
    <Frame kind={training ? "training-matches" : "vacancy-matches"}>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Panel key={i}>
            <div className="flex justify-between gap-4">
              <div className="w-2/3">
                <Bar className="h-6 w-full" />
                <Bar className="mt-3 h-4 w-3/4" />
              </div>
              <Bar className="h-9 w-16" />
            </div>
            {!training && (
              <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                {[0, 1].map((j) => (
                  <div key={j}>
                    <Bar className="mb-3 h-3 w-1/3" />
                    <Lines />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-5">
              <Lines count={training ? 2 : 3} />
            </div>
            <div className="mt-5 flex justify-between gap-3">
              <Bar className="h-4 w-1/3" />
              <ButtonBar />
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function ProfileSkeleton() {
  return (
    <Frame kind="profile">
      <Panel className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="w-2/3">
            <Bar className="h-8 w-3/5" />
            <Bar className="mt-3 h-4 w-4/5" />
          </div>
          <Bar className="h-6 w-28" />
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Panel key={i}>
            <div className="flex justify-between gap-3">
              <Bar className="h-6 w-1/2" />
              <Bar className="h-4 w-10" />
            </div>
            <div className="mt-5 space-y-4">
              {[0, 1, 2].map((j) => (
                <div key={j}>
                  <Bar className="h-3 w-1/3" />
                  <Bar className="mt-2 h-4 w-3/4" />
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function ResumeSkeleton() {
  return (
    <Frame kind="resume">
      <Panel className="mb-7 p-5 sm:p-7">
        <div className="flex gap-3">
          <Bar className="size-6 shrink-0" />
          <div className="w-full">
            <Bar className="h-6 w-3/5" />
            <div className="mt-3">
              <Lines />
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-secondary p-4">
          <Lines count={3} />
        </div>
        <Bar className="mt-5 h-4 w-40" />
        <Bar className="mt-3 h-12 w-full" />
        <div className="mt-4">
          <ButtonBar />
        </div>
      </Panel>
    </Frame>
  )
}

export function PrivacySkeleton() {
  return (
    <Frame kind="privacy-requests">
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Panel key={i}>
            <div className="flex flex-wrap justify-between gap-3">
              <Bar className="h-5 w-2/5" />
              <Bar className="h-6 w-24" />
            </div>
            <Bar className="mt-3 h-3 w-1/3" />
            <div className="mt-4">
              <Lines />
            </div>
          </Panel>
        ))}
      </div>
    </Frame>
  )
}

export function SettingsSkeleton() {
  return (
    <Frame kind="settings">
      <PageHeading />
      <Panel className="mb-6">
        <Bar className="h-6 w-40" />
        <div className="mt-5 border-b border-border pb-5">
          <Bar className="h-5 w-32" />
          <Bar className="mt-3 h-4 w-3/4" />
          <div className="mt-4 flex gap-3">
            <ButtonBar className="w-28" />
            <ButtonBar className="w-28" />
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="mt-5 flex items-center justify-between gap-6 border-b border-border pb-5"
          >
            <div className="w-4/5">
              <Bar className="h-5 w-2/5" />
              <Bar className="mt-3 h-4 w-full" />
            </div>
            <Bar className="h-7 w-12 rounded-full" />
          </div>
        ))}
        <Bar className="mt-6 h-5 w-48" />
      </Panel>
      <div className="mb-6">
        <ButtonBar className="w-56" />
      </div>
      <Panel className="px-6 py-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-5 border-b border-border py-6"
          >
            <div className="w-full space-y-3 sm:w-3/5">
              <Bar className="h-5 w-1/2" />
              <Bar className="h-4 w-full" />
            </div>
            <ButtonBar className="w-40" />
          </div>
        ))}
      </Panel>
    </Frame>
  )
}

export function LaborMarketSkeleton({ staff = false }) {
  return (
    <Frame kind="labor-market">
      <Panel className="mb-8 p-5 sm:p-7">
        <Bar className="h-8 w-4/5" />
        <Bar className="mt-3 h-4 w-1/2" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border pt-4">
              <Bar className="h-4 w-2/3" />
              <Bar className="mt-3 h-9 w-20" />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Lines />
        </div>
      </Panel>
      <div className="rounded-lg bg-secondary p-4">
        <Lines />
      </div>
      <div className="my-7">
        <Stats />
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <Panel key={i}>
            <Bar className="h-7 w-3/4" />
            <div className="mt-5 space-y-5">
              {[0, 1, 2].map((j) => (
                <div key={j}>
                  <Bar className="h-4 w-3/4" />
                  <Bar className="mt-3 h-2 w-full" />
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      {staff && (
        <div className="mt-8">
          <Panel>
            <Bar className="mb-5 h-7 w-3/5" />
            <Lines count={4} />
          </Panel>
        </div>
      )}
    </Frame>
  )
}

function FieldBar({ wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Bar className="mb-2 h-5 w-2/5" />
      <Bar className="h-12 w-full" />
    </div>
  )
}

function ChoiceBars({ count = 2 }) {
  return (
    <div>
      <Bar className="mb-3 h-5 w-1/2" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, i) => (
          <ButtonBar key={i} className="w-24" />
        ))}
      </div>
    </div>
  )
}

function SelectorBars() {
  return (
    <div>
      <Bar className="h-5 w-1/3" />
      <Bar className="mt-2 h-3 w-3/4" />
      <Bar className="mt-2 h-12 w-full" />
      <div className="mt-2 flex max-h-48 flex-wrap gap-1.5 overflow-hidden py-1">
        {Array.from({ length: 12 }, (_, i) => (
          <Bar key={i} className="h-11 w-24" />
        ))}
      </div>
    </div>
  )
}

export function OnboardingSkeleton({ step = 1 }) {
  return (
    <>
      <CollectionNotice />
      <Frame kind={`onboarding-step-${step}`}>
        {step <= 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: step === 1 ? 10 : 6 }, (_, i) => (
              <FieldBar key={i} wide={step === 1 ? i === 6 : i === 2} />
            ))}
          </div>
        )}
        {step === 3 && (
          <>
            <ResumeSkeleton />
            <div className="space-y-6">
              <SelectorBars />
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6"
                >
                  <div className="space-y-2">
                    <Bar className="h-5 w-40" />
                    <Bar className="h-3 w-52" />
                  </div>
                  <ButtonBar className="w-40" />
                </div>
              ))}
            </div>
          </>
        )}
        {step === 4 && <ChoiceBars />}
        {step === 5 && (
          <div className="space-y-6">
            <SelectorBars />
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldBar />
              <FieldBar />
            </div>
            <ChoiceBars count={4} />
            <ChoiceBars count={3} />
            <ChoiceBars />
          </div>
        )}
        <div className="mt-6 flex justify-between gap-4 border-t border-border pt-5">
          <ButtonBar className="w-28" />
          <ButtonBar />
        </div>
      </Frame>
    </>
  )
}
