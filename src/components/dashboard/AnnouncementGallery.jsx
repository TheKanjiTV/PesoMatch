import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "../common/UI.jsx"

export function AnnouncementGallery({
  post,
  open,
  index,
  onIndex,
  onClose,
  saved,
  onSave,
}) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!open) {
      dialog.close()
      return
    }
    dialog.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = previous
    }
  }, [open])
  const move = (direction) =>
    onIndex((index + direction + post.posters.length) % post.posters.length)
  return (
    <dialog
      ref={ref}
      aria-label="Announcement photos"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.target.tagName === "BUTTON" && event.key === "Enter") return
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault()
          move(event.key === "ArrowLeft" ? -1 : 1)
        }
      }}
      className="m-auto max-h-[94dvh] w-[calc(100vw-24px)] max-w-[1400px] overflow-auto rounded-xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-black/70"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative flex h-[60dvh] min-w-0 items-center justify-center bg-[#16181d] px-12 lg:h-[90dvh]">
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close announcement photos"
            className="absolute left-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X size={22} />
          </button>
          <img
            src={post.posters[index].src}
            alt={post.posters[index].heading}
            className="h-full w-full object-contain"
          />
          {post.posters.length > 1 && (
            <>
              <button
                onClick={() => move(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-[#242731] hover:bg-[#eef1fb]"
              >
                <ChevronLeft size={25} />
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-[#242731] hover:bg-[#eef1fb]"
              >
                <ChevronRight size={25} />
              </button>
            </>
          )}
        </div>
        <aside
          aria-label="Announcement details"
          className="min-w-0 space-y-4 p-5 lg:max-h-[90dvh] lg:overflow-y-auto"
        >
          <h2 className="text-base font-semibold">{post.organization}</h2>
          <p className="text-xs text-muted-foreground">{post.date}</p>
          <h3 className="text-lg font-semibold">{post.title}</h3>
          <p className="text-sm leading-7">{post.description}</p>
          <p className="whitespace-pre-wrap text-sm leading-7">
            {post.details}
          </p>
          <p
            aria-live="polite"
            className="border-t border-border pt-4 text-sm font-medium"
          >
            {post.posters[index].heading}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" aria-pressed={saved} onClick={onSave}>
              {saved ? "Saved" : "Save"}
            </Button>
            <Button to={post.to} className="text-xs">
              {post.cta}
            </Button>
          </div>
        </aside>
      </div>
    </dialog>
  )
}
