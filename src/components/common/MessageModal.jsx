import { useEffect, useId, useRef, useState } from "react"

import { MessageSquare, Send, X } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

export function MessageModal({ open, onClose }) {
  const { messages, setMessages, drafts, setDrafts } = useDashboard()

  const [selected, setSelected] = useState(messages[0]?.id)

  const [sent, setSent] = useState(null)

  const headingId = useId()

  const fieldId = useId()

  const dialogRef = useRef(null)

  const scrollRef = useRef(null)

  const current = messages.find((message) => message.id === selected)

  const draft = drafts[selected] || ""

  const setDraft = (text) =>
    setDrafts((previous) => ({ ...previous, [selected]: text }))

  useEffect(() => {
    const dialog = dialogRef.current

    if (!open) {
      if (dialog.open) dialog.close()
      return
    }

    const previousOverflow = document.body.style.overflow

    if (!dialog.open) dialog.showModal()

    document.body.style.overflow = "hidden"

    return () => {
      if (dialog.open) dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (open && selected)
      setMessages((previous) =>
        previous.map((message) =>
          message.id === selected ? { ...message, read: true } : message,
        ),
      )
  }, [open, selected, setMessages])

  useEffect(() => {
    if (!open || !scrollRef.current) return

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }, [open, selected, current?.messages.length])

  function send(event) {
    event.preventDefault()

    if (!draft.trim() || !current) return

    const entry = { id: Date.now(), outgoing: true, text: draft.trim() }

    const thread = selected

    setMessages((previous) =>
      previous.map((message) =>
        message.id === thread
          ? { ...message, messages: [...message.messages, entry] }
          : message,
      ),
    )

    setDraft("")

    setSent({ thread, entry })
  }

  function undo() {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === sent.thread
          ? {
              ...message,
              messages: message.messages.filter(
                (entry) => entry.id !== sent.entry.id,
              ),
            }
          : message,
      ),
    )

    setDrafts((previous) => ({
      ...previous,
      [sent.thread]: [sent.entry.text, previous[sent.thread]]
        .filter(Boolean)
        .join("\n"),
    }))

    setSent(null)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="fixed inset-0 m-auto hidden h-[min(720px,85dvh)] w-[calc(100%_-_24px)] max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-white p-0 text-foreground shadow-xl backdrop:bg-[#111a44]/45 open:flex"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div>
          <h2
            id={headingId}
            className="flex items-center gap-2 text-base font-semibold"
          >
            <MessageSquare size={18} className="text-primary" />
            Messages
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sample conversations. Nothing is delivered.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close messages"
          className="flex size-11 items-center justify-center rounded-lg hover:bg-secondary"
        >
          <X size={19} />
        </button>
      </div>
      <div className="border-b border-border p-3 sm:hidden">
        <label htmlFor={`${fieldId}-thread`} className="sr-only">
          Conversation
        </label>
        <select
          id={`${fieldId}-thread`}
          value={selected || ""}
          onChange={(event) =>
            setSelected(
              messages.find(
                (message) => String(message.id) === event.target.value,
              )?.id,
            )
          }
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {messages.map((message) => (
            <option key={message.id} value={message.id}>
              {message.sender}: {message.subject}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-h-0 flex-1">
        <div
          aria-label="Conversations"
          className="hidden w-52 shrink-0 overflow-y-auto border-r border-border sm:block"
        >
          {messages.map((message) => (
            <button
              type="button"
              key={message.id}
              aria-pressed={selected === message.id}
              onClick={() => setSelected(message.id)}
              className={`flex w-full flex-col gap-1.5 border-b border-border p-4 text-left transition-colors hover:bg-secondary ${
                selected === message.id
                  ? "border-l-2 border-l-primary bg-secondary"
                  : ""
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">
                  {message.sender}
                </span>
                {!message.read && (
                  <span className="size-2 shrink-0 rounded-full bg-primary">
                    <span className="sr-only">Unread</span>
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {message.subject}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {message.time}
              </span>
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {current ? (
            <>
              <div className="border-b border-border px-5 py-4">
                <p className="text-sm font-semibold">{current.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {current.sender}
                </p>
              </div>
              <div
                ref={scrollRef}
                aria-label="Conversation messages"
                className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-background/70 p-4 sm:p-5"
              >
                {current.messages.map((entry) => (
                  <div
                    key={entry.id}
                    className={`max-w-[92%] rounded-xl p-3 sm:max-w-[85%] ${
                      entry.outgoing
                        ? "ml-auto rounded-br-sm bg-primary text-white"
                        : "rounded-bl-sm border border-border bg-white"
                    }`}
                  >
                    <p
                      className={`mb-1.5 text-[10px] font-medium ${
                        entry.outgoing
                          ? "text-white/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {entry.outgoing ? "You / Demo message" : current.sender}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-xs leading-6">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
              {sent && (
                <div className="flex items-center justify-between gap-2 bg-secondary px-4 text-[11px]">
                  <p role="status">Added to this demo. Nothing was sent.</p>
                  <button
                    type="button"
                    onClick={undo}
                    className="min-h-11 font-semibold text-primary underline"
                  >
                    Undo
                  </button>
                </div>
              )}
              <form
                onSubmit={send}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor={fieldId} className="sr-only">
                    Your message
                  </label>
                  <textarea
                    id={fieldId}
                    rows={2}
                    value={draft}
                    maxLength={1000}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a sample reply..."
                    className="block min-h-12 w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send demo message"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-[#283bd1] disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <p className="m-auto p-8 text-center text-sm text-muted-foreground">
              No sample conversations yet.
            </p>
          )}
        </div>
      </div>
    </dialog>
  )
}
