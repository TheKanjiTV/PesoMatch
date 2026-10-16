import { useEffect, useRef, useState } from "react"
import { ChevronDown, MessageSquare, Send } from "lucide-react"
import { JourneyLink } from "../common/JourneyLink.jsx"
import { MotionPresence } from "../common/MotionPresence.jsx"
const shortcuts = [
  ["Profile", "/help/profile"],
  ["PESO assistance", "/help/assistance"],
  ["Account security", "/help/password"],
  ["Staff portal", "/peso/dashboard"],
]
export function SupportWidget({ initiallyOpen = false, openRequest = 0 }) {
  const [open, setOpen] = useState(initiallyOpen),
    [message, setMessage] = useState(""),
    [messages, setMessages] = useState([])
  const input = useRef(null),
    end = useRef(null)
  useEffect(() => {
    if (openRequest > 0) setOpen(true)
  }, [openRequest])
  useEffect(() => {
    if (open) {
      input.current?.focus({ preventScroll: true })
      end.current?.scrollIntoView({ block: "nearest" })
    }
  }, [open, messages])
  function send(event) {
    event.preventDefault()
    const value = message.trim()
    if (!value) return
    setMessages((previous) => [...previous, { id: Date.now(), text: value }])
    setMessage("")
  }
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[340px] max-w-[calc(100vw-32px)]">
      <MotionPresence open={open} motion="notice">
        <section
          aria-label="PesoMatch support preview"
          className="mb-2 overflow-hidden rounded-xl border border-border bg-white shadow-xl"
        >
          <header className="flex items-center justify-between bg-primary p-4 text-white">
            <div>
              <h2 className="text-sm font-semibold">PesoMatch Support</h2>
              <p className="mt-1 text-[10px]">Frontend preview</p>
            </div>
            <button
              aria-label="Minimize support"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-md hover:bg-white/15"
            >
              <ChevronDown size={18} />
            </button>
          </header>
          <div className="max-h-[min(50dvh,360px)] space-y-3 overflow-y-auto p-4">
            <p className="rounded-lg bg-muted p-3 text-xs leading-6">
              Welcome! Browse the help shortcuts below. AI replies and
              live-agent support are not connected yet.
            </p>
            {messages.map((item) => (
              <div key={item.id}>
                <p className="ml-7 break-words rounded-lg bg-secondary p-3 text-xs leading-6">
                  {item.text}
                </p>
                <p
                  role="status"
                  className="mr-7 mt-2 rounded-lg bg-muted p-3 text-[11px] leading-6"
                >
                  Message kept in this preview. No AI or support agent has
                  received it. These help topics may answer your question.
                </p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {shortcuts.map(([label, to]) => (
                <JourneyLink
                  to={to}
                  key={label}
                  className="rounded-full border border-border px-3 py-2 text-[10px] text-primary hover:bg-secondary"
                >
                  {label}
                </JourneyLink>
              ))}
            </div>
            <div ref={end} />
          </div>
          <form
            onSubmit={send}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              ref={input}
              value={message}
              maxLength={1000}
              onChange={(e) => setMessage(e.target.value)}
              aria-label="Support message"
              placeholder="Write a message..."
              className="min-h-11 min-w-0 flex-1 rounded-lg bg-muted px-3 text-xs"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              aria-label="Send support preview message"
              className="grid size-11 place-items-center rounded-lg bg-primary text-white disabled:opacity-50"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      </MotionPresence>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="ml-auto flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-lg"
      >
        <MessageSquare size={17} />
        {open ? "Minimize support" : "Contact Us Now"}
      </button>
    </div>
  )
}
