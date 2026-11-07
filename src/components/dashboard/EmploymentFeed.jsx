import { useEffect, useRef, useState } from "react"

import { Bookmark, Code, Flag, Globe, MoreHorizontal, X } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "../common/Feedback.jsx"

import { Avatar, Button, Modal, panel } from "../common/UI.jsx"

import { MotionPresence } from "../common/MotionPresence.jsx"

import { AnnouncementGallery } from "./AnnouncementGallery.jsx"

export function FeedPost({ post, detailed = false }) {
  const {
    savedAnnouncements,

    setSavedAnnouncements,

    feedPreferences,

    setFeedPreferences,
  } = useDashboard()

  const { notify } = useFeedback()

  const [expanded, setExpanded] = useState(detailed),
    [menu, setMenu] = useState(false),
    [dialog, setDialog] = useState(null),
    [posterIndex, setPosterIndex] = useState(0),
    [reason, setReason] = useState(""),
    [reportSaved, setReportSaved] = useState(false)

  const menuRoot = useRef(null)

  useEffect(() => {
    const outside = (e) => {
      if (!menuRoot.current?.contains(e.target)) setMenu(false)
    }

    const escape = (e) => {
      if (e.key === "Escape") setMenu(false)
    }

    document.addEventListener("pointerdown", outside)

    document.addEventListener("keydown", escape)

    return () => {
      document.removeEventListener("pointerdown", outside)

      document.removeEventListener("keydown", escape)
    }
  }, [])

  const saved = savedAnnouncements.includes(post.id),
    hidden = feedPreferences.hidden.includes(post.id),
    unfollowed = feedPreferences.unfollowed.includes(post.organization),
    followed = feedPreferences.followed.includes(post.organization)

  const restore = () =>
    setFeedPreferences((before) => ({
      ...before,

      hidden: before.hidden.filter((id) => id !== post.id),

      unfollowed: before.unfollowed.filter((org) => org !== post.organization),
    }))

  const hide = (unfollow = false) => {
    setMenu(false)

    setFeedPreferences((before) => ({
      ...before,

      hidden: [...new Set([...before.hidden, post.id])],

      unfollowed: unfollow
        ? [...new Set([...before.unfollowed, post.organization])]
        : before.unfollowed,
    }))
  }

  const toggleSave = () => {
    setSavedAnnouncements((values) =>
      saved ? values.filter((id) => id !== post.id) : [...values, post.id],
    )

    notify(saved ? "Announcement removed from saved." : "Announcement saved.", {
      undo: () =>
        setSavedAnnouncements((values) =>
          saved
            ? [...new Set([...values, post.id])]
            : values.filter((id) => id !== post.id),
        ),
    })
  }

  const openReport = () => {
    setMenu(false)

    setReason("")

    setReportSaved(false)

    setDialog("report")
  }

  const embed = `<iframe src="${window.location.origin}/feed/${post.id}" title="${post.title}" width="600" height="600"></iframe>`

  return (
    <>
      {(hidden || unfollowed) && !detailed ? (
        <article
          className={`${panel} p-4`}
          aria-label={`Hidden post: ${post.title}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold">
                {unfollowed
                  ? `You unfollowed ${post.organization}.`
                  : "Post hidden in your feed."}
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {unfollowed
                  ? "You can restore this post with Undo."
                  : "Thank you for your feedback. You can restore this post."}
              </p>
            </div>
            <button
              onClick={restore}
              className="min-h-10 shrink-0 text-xs font-semibold text-primary"
            >
              Undo
            </button>
          </div>
          <div className="mt-3 border-t border-border pt-2">
            {!unfollowed && (
              <Button
                variant="text"
                onClick={() => hide(true)}
                className="text-xs"
              >
                Unfollow {post.organization}
              </Button>
            )}
            <Button
              variant="text"
              className="text-xs"
              onClick={() => {
                setReason("Concern about AI-generated content")

                setReportSaved(false)

                setDialog("report")
              }}
            >
              Concern about AI-generated content
            </Button>
            <Button variant="text" onClick={openReport} className="text-xs">
              <Flag size={14} />
              Report post
            </Button>
          </div>
        </article>
      ) : (
        <article
          className={`${panel} overflow-visible`}
          aria-label={post.title}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
            <p className="text-[10px] text-muted-foreground">Suggested</p>
            <div className="flex items-center">
              <div ref={menuRoot} className="relative">
                <button
                  aria-label={`Post options: ${post.title}`}
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                  className="grid size-10 place-items-center rounded-lg hover:bg-muted"
                >
                  <MoreHorizontal size={19} />
                </button>
                <MotionPresence open={menu}>
                  <div className="absolute right-0 top-full z-20 w-56 rounded-lg border border-border bg-white p-2 shadow-xl">
                    {[
                      [
                        "Embed this post",

                        () => {
                          setMenu(false)

                          setDialog("embed")
                        },
                      ],

                      ["Hide post", () => hide()],

                      ["Not interested", () => hide(true)],

                      ["Report post", openReport],
                    ].map(([label, action]) => (
                      <button
                        key={label}
                        onClick={action}
                        className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-xs hover:bg-muted"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </MotionPresence>
              </div>
              <button
                aria-label={`Hide post: ${post.title}`}
                onClick={() => hide()}
                className="grid size-10 place-items-center rounded-lg hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Avatar name={post.organization} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xs font-semibold leading-6">
                  {post.organization}
                </h2>
                <p className="flex items-center gap-1 text-[10px] leading-5 text-muted-foreground">
                  {post.date}
                  <Globe size={11} />
                </p>
              </div>
              <button
                aria-pressed={followed}
                onClick={() =>
                  setFeedPreferences((before) => ({
                    ...before,

                    followed: followed
                      ? before.followed.filter(
                          (org) => org !== post.organization,
                        )
                      : [...before.followed, post.organization],

                    unfollowed: before.unfollowed.filter(
                      (org) => org !== post.organization,
                    ),
                  }))
                }
                className="min-h-10 shrink-0 text-xs font-semibold text-primary"
              >
                {followed ? "Following" : "+ Follow"}
              </button>
            </div>
            <h3 className="mt-4 text-sm font-semibold">{post.title}</h3>
            <p className="mt-2 text-xs leading-7">{post.description}</p>
            {expanded && (
              <p className="mt-3 whitespace-pre-wrap text-xs leading-7">
                {post.details}
              </p>
            )}
            <button
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
              className="min-h-9 text-xs font-semibold text-primary"
            >
              {expanded ? "See less" : "See more"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden border-y border-border bg-border">
            {post.posters.slice(0, 3).map((poster, index) => (
              <button
                key={poster.src}
                onClick={() => {
                  setPosterIndex(index)

                  setDialog("gallery")
                }}
                aria-label={`Open announcement photo ${index + 1}: ${poster.heading}`}
                className={`relative text-left ${
                  index === 0 ? "col-span-2" : ""
                }`}
              >
                <img
                  src={poster.src}
                  alt={poster.heading}
                  loading="lazy"
                  className={`w-full bg-muted ${
                    index === 0
                      ? "max-h-[560px] object-contain"
                      : "h-48 object-cover object-top"
                  }`}
                />
                {index === 2 && post.posters.length > 3 && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-primary">
                    +{post.posters.length - 3} more
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="px-4 pt-3 text-[10px] text-muted-foreground">
            User-provided example · Source: {post.organization}
          </p>
          <div className="flex flex-wrap items-center gap-2 p-4">
            <Button
              to={`/feed/${post.id}`}
              variant="secondary"
              className="text-xs"
            >
              View Details
            </Button>
            <Button
              variant="text"
              onClick={toggleSave}
              aria-pressed={saved}
              className="text-xs"
            >
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button to={post.to} variant="text" className="text-xs">
              {post.cta}
            </Button>
          </div>
        </article>
      )}
      <AnnouncementGallery
        post={post}
        open={dialog === "gallery"}
        index={posterIndex}
        onIndex={setPosterIndex}
        onClose={() => setDialog(null)}
        saved={saved}
        onSave={toggleSave}
      />
      <Modal
        open={dialog === "report" || dialog === "embed"}
        onClose={() => setDialog(null)}
        title={
          dialog === "report"
            ? "Report post"
            : dialog === "embed"
              ? "Embed this post"
              : "Announcement panels"
        }
      >
        {dialog === "embed" && (
          <>
            <p className="text-xs leading-6">
              This embeds the account-only announcement preview. Visitors must
              sign in to PesoMatch.
            </p>
            <label className="mt-4 block text-xs">
              Embed code
              <textarea
                readOnly
                value={embed}
                className="mt-2 min-h-28 w-full rounded-lg border border-border p-3 text-xs"
              />
            </label>
            <Button
              className="mt-4"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(embed)

                  notify("Embed code copied.")
                } catch {
                  notify("Copy the selected embed code manually.", {
                    type: "info",
                  })
                }
              }}
            >
              <Code size={15} />
              Copy code
            </Button>
          </>
        )}
        {dialog === "report" &&
          (reportSaved ? (
            <>
              <p role="status" className="text-sm font-semibold">
                Report saved in this preview.
              </p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                No moderation service is connected. This report has not been
                sent to PESO or the organization.
              </p>
              <Button className="mt-4" onClick={() => setDialog(null)}>
                Done
              </Button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()

                setFeedPreferences((before) => ({
                  ...before,

                  reports: [
                    ...before.reports,

                    { postId: post.id, reason, date: new Date().toISOString() },
                  ],
                }))

                setReportSaved(true)
              }}
            >
              <label className="block text-xs font-medium">
                Reason
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-border px-3"
                >
                  <option value="" disabled hidden>Choose a reason</option>
                  {[
                    "Misleading vacancy information",

                    "Scam or suspicious request",

                    "Inappropriate content",

                    "Concern about AI-generated content",

                    "Other",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                Reports are stored only in this local preview.
              </p>
              <Button type="submit" className="mt-4">
                Save report
              </Button>
            </form>
          ))}
      </Modal>
    </>
  )
}
