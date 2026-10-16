import { useEffect, useState } from "react"

import { MessageSquare, Send, UserRound } from "lucide-react"

import { useDashboard } from "../../context/DashboardContext.jsx"

import { useFeedback } from "../../components/common/Feedback.jsx"

import {
  PageHeading,
  Button,
  Field,
  Badge,
  EmptyState,
  Modal,
  panel,
} from "../../components/common/UI.jsx"

export default function MessagesPage() {
  const { messages, setMessages, drafts, setDrafts } = useDashboard()

  const { notify } = useFeedback()

  const [selected, setSelected] = useState(messages[0]?.id),
    [unread, setUnread] = useState(false),
    [confirm, setConfirm] = useState(false)

  useEffect(() => {
    setMessages((old) =>
      old.map((message) =>
        message.id === selected ? { ...message, read: true } : message,
      ),
    )
  }, [selected, setMessages])

  const visible = messages.filter((m) => !unread || !m.read)

  const current = messages.find((m) => m.id === selected)

  const draft = drafts[selected] || ""

  const setDraft = (value) =>
    setDrafts((old) => ({ ...old, [selected]: value }))

  function send(e) {
    e.preventDefault()

    if (!draft.trim()) {
      notify("Write a message before sending.", { type: "error" })

      return
    }

    const text = draft.trim(),
      id = Date.now(),
      thread = selected

    setMessages((old) =>
      old.map((m) =>
        m.id === thread
          ? {
              ...m,

              read: true,

              messages: [...m.messages, { id, outgoing: true, text }],
            }
          : m,
      ),
    )

    setDraft("")

    notify("Message added to this demo. Nothing was sent.", {
      undo: () => {
        setMessages((old) =>
          old.map((m) =>
            m.id === thread
              ? { ...m, messages: m.messages.filter((x) => x.id !== id) }
              : m,
          ),
        )

        setDrafts((old) => ({ ...old, [thread]: text }))
      },
    })
  }

  return (
    <>
      <PageHeading
        title="Messages"
        description="Sample conversations with PESO. Messages stay in this demo and are never delivered."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className={`${panel} overflow-hidden p-3`} aria-label="Inbox">
          <div className="mb-3 flex gap-2 border-b border-border pb-3">
            <Button
              variant={unread ? "secondary" : "primary"}
              aria-pressed={!unread}
              onClick={() => setUnread(false)}
            >
              All
            </Button>
            <Button
              variant={unread ? "primary" : "secondary"}
              aria-pressed={unread}
              onClick={() => setUnread(true)}
            >
              Unread
            </Button>
          </div>
          {visible.length ? (
            visible.map((m) => (
              <button
                key={m.id}
                aria-pressed={selected === m.id}
                onClick={() => {
                  setSelected(m.id)

                  setMessages((old) =>
                    old.map((x) => (x.id === m.id ? { ...x, read: true } : x)),
                  )
                }}
                className={`mb-2 w-full rounded-lg border p-4 text-left ${
                  selected === m.id
                    ? "border-transparent bg-secondary"
                    : "border-transparent hover:bg-background"
                }`}
              >
                <span className="block text-sm font-semibold">{m.sender}</span>
                <span className="mt-2 block text-sm leading-6">
                  {m.subject}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {m.read ? "Read" : "Unread"} · Sample
                </span>
              </button>
            ))
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="No unread messages"
              description="You're up to date with this sample inbox."
              action={
                <Button variant="text" onClick={() => setUnread(false)}>
                  Show all messages
                </Button>
              }
            />
          )}
        </section>
        {current && (
          <section
            className={`${panel} min-w-0 overflow-hidden`}
            aria-label="Conversation"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                {current.subject}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                {current.sender} · {current.time}
              </p>
            </div>
            <div
              className="max-h-[480px] space-y-4 overflow-y-auto bg-background/60 p-5"
              aria-live="polite"
            >
              {current.messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl p-4 ${
                    m.outgoing
                      ? "ml-auto rounded-br-sm bg-secondary"
                      : "rounded-bl-sm border border-border bg-white"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold text-primary">
                    {m.outgoing ? "You · Demo message" : current.sender}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>
            <form
              onSubmit={send}
              className="space-y-3 border-t border-border p-5"
            >
              <Field
                textarea
                label="Your message"
                placeholder="Write a sample reply…"
                maxLength={1000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {draft.length}/1000 · Draft preserved while you use this
                workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!draft.trim()}>
                  <Send size={16} />
                  Send Demo Message
                </Button>
                <Button
                  variant="secondary"
                  disabled={!draft}
                  onClick={() => setConfirm(true)}
                >
                  Discard Draft
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Discard this draft?"
      >
        <p className="text-sm leading-7">
          Your unsent message will be cleared. You can undo this action from the
          notification.
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            onClick={() => {
              const previous = draft,
                thread = selected

              setDraft("")

              setConfirm(false)

              notify("Draft discarded.", {
                type: "info",

                undo: () =>
                  setDrafts((old) => ({ ...old, [thread]: previous })),
              })
            }}
          >
            Discard Draft
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Keep Editing
          </Button>
        </div>
      </Modal>
    </>
  )
}
