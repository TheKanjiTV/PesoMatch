import { useState } from "react"

import { useSearchParams } from "react-router"

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Eye,
  LockKeyhole,
  Shield,
  UserRound,
} from "lucide-react"

import { useAuth } from "../../context/AuthContext.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "../../components/common/Feedback.jsx"

import { Button, Field, panel } from "../../components/common/UI.jsx"

import { JourneyLink } from "../../components/common/JourneyLink.jsx"

import { SettingsPage as AccountForms } from "./AccountSettingsPage.jsx"

import { mockFeed } from "../../data/mockFeed.js"

const categories = [
  ["account", "Account preferences", UserRound],
  ["security", "Sign in & security", LockKeyhole],
  ["visibility", "Visibility", Eye],
  ["privacy", "Data privacy", Shield],
  ["notifications", "Notifications", Bell],
]

const groups = {
  account: [
    [
      "Profile information",
      [
        ["Name, location and industry", "profile"],
        ["Personal information", "profile"],
        ["Verifications", "verification"],
      ],
    ],
    [
      "General preferences",
      [
        ["Language", "language"],
        ["Content language", "content-language"],
        ["Preferred feed view", "feed-view"],
      ],
    ],
  ],

  security: [
    [
      "Account access",
      [
        ["Email addresses", "account"],
        ["Change password", "password"],
        ["Where you're signed in", "sessions"],
        ["Two-factor authentication", "two-factor"],
      ],
    ],
  ],

  visibility: [
    [
      "Visibility of your profile",
      [
        ["Public profile settings", "public-profile"],
        ["Email visibility", "email-visibility"],
        ["Discoverability", "discoverability"],
      ],
    ],
  ],

  privacy: [
    [
      "How PesoMatch uses your data",
      [
        ["Manage data permissions", "data-permissions"],
        ["Download your data", "download"],
        ["Clear search history", "search-history"],
        ["Delete account", "delete"],
      ],
    ],
    [
      "Your feed",
      [
        ["Hidden posts", "hidden"],
        ["Reports in this preview", "reports"],
      ],
    ],
  ],

  notifications: [
    [
      "Notifications you receive",
      [
        ["Searching for a job", "jobUpdates"],
        ["Training opportunities", "trainingUpdates"],
        ["PESO assistance", "referralUpdates"],
      ],
    ],
  ],
}

const detailTitles = {
  language: "Language",
  "content-language": "Content language",
  "feed-view": "Preferred feed view",
  unfollowed: "People you unfollowed",
  hidden: "Hidden posts",
  reports: "Reports in this preview",
  verification: "Email verification",
  account: "Account access",
  password: "Change password",
  delete: "Delete account",
  sessions: "Where you're signed in",
  "two-factor": "Two-factor authentication",
  "public-profile": "Public profile settings",
  "email-visibility": "Email visibility",
  discoverability: "Discoverability",
  "data-permissions": "Manage data permissions",
  download: "Download your data",
  "search-history": "Search history",
  jobUpdates: "Job updates",
  trainingUpdates: "Training updates",
  referralUpdates: "PESO updates",
}

export function PrivacySettingsPage() {
  const [params, setParams] = useSearchParams(),
    { user } = useAuth()

  const data = useDashboard(),
    { notify } = useFeedback()

  const section = groups[params.get("section")]
      ? params.get("section")
      : "account",
    detail = params.get("detail")

  const go = (nextSection, nextDetail) =>
    setParams({
      section: nextSection,
      ...(nextDetail ? { detail: nextDetail } : {}),
    })

  const preference = (key, value) => {
    data.setWorkspacePreferences((before) => ({ ...before, [key]: value }))
    notify("Preference saved on this browser.")
  }

  const title = detailTitles[detail] || "Settings detail"

  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            account: {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            },
            profile: data.serverProfile,
            browserPreferences: data.workspacePreferences,
            feedPreferences: data.feedPreferences,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    )

    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a")

    anchor.href = url
    anchor.download = "pesomatch-profile-and-browser-preferences.json"
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    notify("Profile and browser preferences downloaded.")
  }

  return (
    <div className="grid items-stretch overflow-hidden rounded-xl border border-border/60 bg-background lg:grid-cols-[265px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-white p-4 lg:border-b-0">
        <h1 className="mb-5 text-2xl font-semibold">Settings</h1>
        <nav aria-label="Settings categories" className="space-y-1">
          {categories.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-current={id === section ? "page" : undefined}
              onClick={() => go(id)}
              className={`flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                id === section
                  ? "bg-secondary font-semibold text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Icon size={19} className="shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 space-y-5 bg-background p-4 lg:border-l lg:border-border sm:p-5">
        {detail ? (
          <>
            <Button
              variant="text"
              className="!px-0 text-xs"
              onClick={() => go(section)}
            >
              <ArrowLeft size={15} />
              Back to {categories.find((item) => item[0] === section)[1]}
            </Button>
            {["account", "password", "delete"].includes(detail) ? (
              <AccountForms kind={detail} />
            ) : (
              <section className={`${panel} p-5 sm:p-6`}>
                <h2 className="text-base font-semibold">{title}</h2>
                {["language", "content-language"].includes(detail) && (
                  <>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      {detail === "language"
                        ? "Choose the language for workspace navigation. Announcements and training keep their original language."
                        : "Save your preferred language for future content recommendations."}
                    </p>
                    <div className="mt-4 max-w-sm">
                      <Field
                        label={title}
                        value={
                          data.workspacePreferences[
                            detail === "language"
                              ? "language"
                              : "contentLanguage"
                          ] || "en"
                        }
                        onChange={(e) =>
                          preference(
                            detail === "language"
                              ? "language"
                              : "contentLanguage",
                            e.target.value,
                          )
                        }
                      >
                        <option value="en">English (English)</option>
                        <option value="fil">Filipino (Filipino)</option>
                      </Field>
                    </div>
                  </>
                )}
                {detail === "feed-view" && (
                  <div className="mt-4 max-w-sm">
                    <Field
                      label="Feed order"
                      value={data.workspacePreferences.feedView}
                      onChange={(e) => preference("feedView", e.target.value)}
                    >
                      <option value="recent">Most recent</option>
                      <option value="relevant">Recommended order</option>
                    </Field>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      This preview contains only the two supplied announcements.
                      Recommended order uses a fixed example order.
                    </p>
                  </div>
                )}
                {detail === "unfollowed" && (
                  <div className="mt-4">
                    {data.feedPreferences.unfollowed.length ? (
                      data.feedPreferences.unfollowed.map((org) => (
                        <div
                          key={org}
                          className="flex items-center justify-between gap-3 border-t border-border py-3"
                        >
                          <p className="text-xs">{org}</p>
                          <Button
                            variant="secondary"
                            className="text-xs"
                            onClick={() =>
                              data.setFeedPreferences((before) => ({
                                ...before,
                                unfollowed: before.unfollowed.filter(
                                  (item) => item !== org,
                                ),
                                hidden: before.hidden.filter(
                                  (id) =>
                                    !mockFeed.some(
                                      (post) =>
                                        post.id === id &&
                                        post.organization === org,
                                    ),
                                ),
                              }))
                            }
                          >
                            Follow again
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs leading-6 text-muted-foreground">
                        You haven't unfollowed any organizations.
                      </p>
                    )}
                  </div>
                )}
                {detail === "hidden" && (
                  <div className="mt-4">
                    {data.feedPreferences.hidden.length ? (
                      data.feedPreferences.hidden.map((id) => (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-3 border-t border-border py-3"
                        >
                          <p className="text-xs">{id.replaceAll("-", " ")}</p>
                          <Button
                            variant="secondary"
                            className="text-xs"
                            onClick={() =>
                              data.setFeedPreferences((before) => ({
                                ...before,
                                hidden: before.hidden.filter(
                                  (item) => item !== id,
                                ),
                              }))
                            }
                          >
                            Restore post
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No hidden posts.
                      </p>
                    )}
                  </div>
                )}
                {detail === "reports" && (
                  <>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Local preview reports are not sent to moderators.
                    </p>
                    <ul className="mt-4 divide-y divide-border">
                      {data.feedPreferences.reports.map((report, index) => (
                        <li key={index} className="py-3 text-xs leading-6">
                          {report.reason}
                          <br />
                          <span className="text-muted-foreground">
                            {report.postId} · {report.date.slice(0, 10)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {!data.feedPreferences.reports.length && (
                      <p className="mt-4 text-xs">No reports saved.</p>
                    )}
                  </>
                )}
                {detail === "verification" && (
                  <>
                    <p className="mt-3 text-xs leading-6">
                      Email: {user.email}
                      <br />
                      {user.email_verified_at
                        ? "Verified"
                        : "Not verified. Email delivery is not configured in this local phase."}
                    </p>
                    {!user.email_verified_at && (
                      <Button
                        className="mt-4 text-xs"
                        onClick={() =>
                          notify(
                            "No verification email was sent. Email delivery is not configured yet.",
                            { type: "info" },
                          )
                        }
                      >
                        Verify Now
                      </Button>
                    )}
                  </>
                )}
                {detail === "sessions" && (
                  <>
                    <p className="mt-3 text-xs leading-6">
                      You are signed in to this browser. A list of other devices
                      is not available in this prototype.
                    </p>
                    <Button
                      to="/jobseeker/settings?section=security&detail=password"
                      className="mt-4 text-xs"
                    >
                      Change password and sign out other sessions
                    </Button>
                  </>
                )}
                {detail === "two-factor" && (
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    Two-factor authentication is not available yet. Your current
                    sign-in uses your email and password.
                  </p>
                )}
                {[
                  "public-profile",
                  "email-visibility",
                  "discoverability",
                  "data-permissions",
                ].includes(detail) && (
                  <>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Your profile is available inside your authenticated
                      workspace. Public profiles, employer discovery and
                      data-sharing controls are not connected in this phase.
                    </p>
                    <Button
                      to="/privacy"
                      variant="secondary"
                      className="mt-4 text-xs"
                    >
                      Read Privacy Policy
                    </Button>
                  </>
                )}
                {detail === "download" && (
                  <>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Download the profile loaded from your account and
                      preferences stored in this browser. This is not a complete
                      server data export.
                    </p>
                    <Button
                      disabled={data.profileLoading || !!data.profileError}
                      className="mt-4 text-xs"
                      onClick={download}
                    >
                      Download profile & preferences
                    </Button>
                  </>
                )}
                {detail === "search-history" && (
                  <>
                    <ul className="mt-4 space-y-3 text-xs">
                      {data.searchHistory.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                    {!data.searchHistory.length && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        No recent searches.
                      </p>
                    )}
                    <Button
                      className="mt-4 text-xs"
                      disabled={!data.searchHistory.length}
                      onClick={() => {
                        data.setSearchHistory([])
                        notify("Search history cleared.")
                      }}
                    >
                      Clear search history
                    </Button>
                  </>
                )}
                {["jobUpdates", "trainingUpdates", "referralUpdates"].includes(
                  detail,
                ) && (
                  <>
                    <label className="mt-4 flex min-h-12 items-center justify-between gap-4 text-xs">
                      Show preview alerts
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={data.workspacePreferences[detail] !== false}
                        onChange={(e) => preference(detail, e.target.checked)}
                      />
                    </label>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      This controls new in-app preview alerts. No email, SMS or
                      browser push is sent.
                    </p>
                  </>
                )}
              </section>
            )}
          </>
        ) : (
          <>
            {!user.email_verified_at && section === "account" && (
              <section
                className={`${panel} flex flex-wrap items-center justify-between gap-3 p-5`}
              >
                <div>
                  <h2 className="text-sm font-semibold">Verify your email</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review your account verification status.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => go(section, "verification")}
                >
                  View verification
                </Button>
              </section>
            )}
            {groups[section].map(([heading, rows]) => (
              <section key={heading} className={`${panel} overflow-hidden`}>
                <h2 className="px-5 pb-3 pt-5 text-base font-semibold">
                  {heading}
                </h2>
                {rows.map(([label, target]) =>
                  target === "profile" ? (
                    <JourneyLink
                      key={label}
                      to="/jobseeker/profile?edit=1"
                      className="flex min-h-14 items-center justify-between gap-4 border-t border-border px-5 text-xs hover:bg-muted"
                    >
                      {label}
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </JourneyLink>
                  ) : (
                    <button
                      key={label}
                      onClick={() => go(section, target)}
                      className="flex min-h-14 w-full items-center justify-between gap-4 border-t border-border px-5 text-left text-xs hover:bg-muted"
                    >
                      <span>{label}</span>
                      <span className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {target === "language"
                          ? data.workspacePreferences.language === "fil"
                            ? "Filipino"
                            : "English"
                          : target === "account" && label === "Email addresses"
                            ? user.email
                            : ""}
                        <ArrowRight size={16} className="shrink-0" />
                      </span>
                    </button>
                  ),
                )}
              </section>
            ))}
          </>
        )}
        <footer className="flex flex-wrap justify-center gap-5 py-6 text-[10px] text-muted-foreground">
          <JourneyLink to="/help">Help Center</JourneyLink>
          <JourneyLink to="/privacy">Privacy Policy</JourneyLink>
          <JourneyLink to="/terms">Terms</JourneyLink>
          <span>© PesoMatch</span>
        </footer>
      </div>
    </div>
  )
}
