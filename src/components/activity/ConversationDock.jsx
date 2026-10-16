import { useEffect, useId, useRef, useState } from "react"

import { createPortal } from "react-dom"

import { Minus, Plus, Send, X } from "lucide-react"

import { Avatar } from "../common/UI.jsx"

import { useDashboard } from "../../context/DashboardContext.jsx"

function ConversationWindow({ id, focused, focusVersion, onClose }) {
  const { messages, setMessages, drafts, setDrafts } = useDashboard()

  const current = messages.find((item) => item.id === id)

  const [minimized, setMinimized] = useState(false)

  const [sent, setSent] = useState(null)
  const [closing, setClosing] = useState(false)
  const surface = useRef(null)
  const close = () => {
    if (closing) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose()
      return
    }
    setClosing(true)
    const animation = surface.current?.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(16px)" },
      ],
      { duration: 200, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" },
    )
    if (animation) animation.finished.then(onClose).catch(() => {})
    else onClose()
  }

  const heading = useId(),
    field = useId(),
    scroll = useRef(null),
    input = useRef(null)

  const draft = drafts[id] || ""

  useEffect(() => {
    setMessages((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
  }, [id, setMessages])

  useEffect(() => {
    if (focused) setMinimized(false)
  }, [focused, focusVersion])

  useEffect(() => {
    if (focused && !minimized) input.current?.focus({ preventScroll: true })
  }, [focused, minimized, focusVersion])

  useEffect(() => {
    if (!minimized && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight
  }, [current?.messages.length, minimized])

  if (!current) return null

  const setDraft = (text) =>
    setDrafts((previous) => ({ ...previous, [id]: text }))

  const send = (event) => {
    event.preventDefault()

    if (!draft.trim()) return

    const entry = {
      id: crypto.randomUUID(),

      text: draft.trim(),

      outgoing: true,
    }

    setMessages((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, messages: [...item.messages, entry] }
          : item,
      ),
    )

    setDraft("")

    setSent(entry)

    input.current?.focus()
  }

  const undo = () => {
    setMessages((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,

              messages: item.messages.filter((entry) => entry.id !== sent.id),
            }
          : item,
      ),
    )

    setDrafts((previous) => ({
      ...previous,

      [id]: [sent.text, previous[id]].filter(Boolean).join("\n"),
    }))

    setSent(null)

    input.current?.focus()
  }

  return (
    <section
      ref={surface}
      inert={closing ? true : undefined}
      aria-labelledby={heading}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          close()
        }
      }}
      className={`conversation-enter flex w-[calc(100vw-24px)] shrink-0 flex-col overflow-hidden rounded-t-xl border border-border bg-card text-foreground shadow-[0_-4px_24px_#1720441f] sm:w-[320px] ${
        minimized ? "h-auto" : "h-[min(480px,calc(100dvh-108px))]"
      }`}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-secondary p-2">
        <Avatar name={current.sender.replace(/^Sample /, "")} />
        <div className="min-w-0 flex-1">
          <h2 id={heading} className="truncate text-xs font-semibold">
            {current.sender}
          </h2>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {current.subject}
          </p>
        </div>
        <button
          aria-label={`${
            minimized ? "Expand" : "Minimize"
          } conversation with ${current.sender}`}
          aria-expanded={!minimized}
          onClick={() => setMinimized((value) => !value)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-primary/10"
        >
          {minimized ? <Plus size={17} /> : <Minus size={17} />}
        </button>
        <button
          aria-label={`Close conversation with ${current.sender}`}
          onClick={close}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-primary/10"
        >
          <X size={17} />
        </button>
      </header>
      {!minimized && (
        <>
          <div
            ref={scroll}
            role="log"
            aria-label={`Messages with ${current.sender}`}
            aria-live="polite"
            aria-relevant="additions"
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/60 p-3"
          >
            {current.messages.map((entry) => (
              <p
                key={entry.id}
                className={`w-fit max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-xs leading-5 ${
                  entry.outgoing
                    ? "ml-auto rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm bg-secondary text-foreground"
                }`}
              >
                <span className="sr-only">
                  {entry.outgoing ? "You: " : `${current.sender}: `}
                </span>
                {entry.text}
              </p>
            ))}
          </div>
          {sent && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-secondary px-3 text-[10px]">
              <p role="status">Added to demo only.</p>
              <button
                onClick={undo}
                className="min-h-9 font-semibold text-primary underline"
              >
                Undo
              </button>
            </div>
          )}
          <form
            onSubmit={send}
            className="flex shrink-0 items-end gap-2 border-t border-border p-3"
          >
            <label htmlFor={field} className="sr-only">
              Message to {current.sender}
            </label>
            <textarea
              ref={input}
              id={field}
              rows={2}
              value={draft}
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a reply..."
              className="min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-border bg-muted px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label={`Send demo message to ${current.sender}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
            >
              <Send size={17} />
            </button>
          </form>
        </>
      )}
    </section>
  )
}

export function ConversationDock({ conversations, focusVersion, onClose }) {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const resize = () => setWidth(window.innerWidth)

    window.addEventListener("resize", resize)

    return () => window.removeEventListener("resize", resize)
  }, [])

  const limit = width >= 1120 ? 3 : width >= 760 ? 2 : 1

  const visible = conversations.slice(-limit)

  if (!visible.length) return null

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-0 right-3 z-30 flex max-w-[calc(100vw-24px)] items-end gap-3 sm:right-5"
      aria-label="Open conversations"
    >
      {visible.map((id, index) => (
        <div key={id} className="pointer-events-auto">
          <ConversationWindow
            id={id}
            focused={index === visible.length - 1}
            focusVersion={focusVersion}
            onClose={() => onClose(id)}
          />
        </div>
      ))}
    </div>,

    document.body,
  )
}
