import { useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  X,
} from "lucide-react"
import { adminGuide } from "../../data/adminGuide.js"

const control =
  "grid size-11 shrink-0 place-items-center rounded-full border border-border bg-white text-foreground hover:bg-secondary"

export function TutorialPicture({ slide, animated = false, className = "" }) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-lg border border-border bg-white ${className}`}
    >
      <img
        src={slide.image}
        alt={slide.alt}
        width="1280"
        height="820"
        className="block h-auto w-full"
      />
      {animated && (
        <div
          key={slide.id}
          className="guide-focus absolute rounded-md border-2 border-primary bg-primary/5"
          style={slide.focus}
          aria-hidden="true"
        >
          <MousePointer2
            size={28}
            fill="white"
            className="guide-pointer absolute -bottom-4 -right-4 text-primary drop-shadow-md"
          />
        </div>
      )}
    </div>
  )
}

export function TutorialViewer({ index, onIndex, onClose }) {
  const dialog = useRef(null)
  const returnFocus = useRef(document.activeElement)
  const slide = adminGuide[index]
  const move = (direction) =>
    onIndex((index + direction + adminGuide.length) % adminGuide.length)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      element.close()
      document.body.style.overflow = previous
      if (returnFocus.current?.isConnected)
        returnFocus.current.focus({ preventScroll: true })
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-label="Staff Portal picture guide"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault()
          move(e.key === "ArrowLeft" ? -1 : 1)
        }
      }}
      className="m-auto max-h-[94dvh] w-[min(1200px,96vw)] max-w-none overflow-y-auto rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-[#18203c]/75"
    >
      <header className="flex items-center justify-between gap-4 p-4 sm:px-6">
        <div>
          <p className="text-xs font-medium text-primary">
            Picture guide · Step {index + 1}
          </p>
          <h2 className="mt-1 text-base font-semibold sm:text-lg">
            {slide.title}
          </h2>
        </div>
        <button
          autoFocus
          className={control}
          onClick={onClose}
          aria-label="Close picture guide"
        >
          <X size={20} />
        </button>
      </header>
      <div className="bg-secondary p-2 sm:px-6 sm:py-4">
        <TutorialPicture slide={slide} />
      </div>
      <footer className="flex items-center gap-3 p-4 sm:px-6">
        <button
          className={control}
          onClick={() => move(-1)}
          aria-label="Previous guide picture"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="flex-1 text-sm leading-6">{slide.instruction}</p>
        <button
          className={control}
          onClick={() => move(1)}
          aria-label="Next guide picture"
        >
          <ChevronRight size={20} />
        </button>
      </footer>
    </dialog>
  )
}

export function AdminTutorial({ onExpand }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const [held, setHeld] = useState(false)
  const [visible, setVisible] = useState(true)
  const ref = useRef(null)
  const slide = adminGuide[index]
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const change = () => {
      if (media.matches) setPlaying(false)
    }
    media.addEventListener("change", change)
    return () => media.removeEventListener("change", change)
  }, [])
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!playing || held || !visible) return
    const timer = setInterval(() => {
      if (!document.hidden)
        setIndex((current) => (current + 1) % adminGuide.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [playing, held, visible, index])
  const select = (next) => {
    setIndex((next + adminGuide.length) % adminGuide.length)
    setPlaying(false)
  }
  return (
    <section
      ref={ref}
      aria-label="Animated Staff Portal tutorial"
      aria-roledescription="carousel"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false)
      }}
      className="min-w-0 rounded-xl bg-white p-3 shadow-[0_18px_60px_-25px_#26365055] sm:p-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2 text-xs">
        <p className="font-medium">The PESO workflow, in pictures</p>
        <span className="font-semibold text-primary">0{index + 1} / 04</span>
      </header>
      <button
        onClick={() => {
          setPlaying(false)
          onExpand(index)
        }}
        aria-label={`Enlarge tutorial picture: ${slide.title}`}
        className="group relative block w-full rounded-lg text-left"
      >
        <TutorialPicture slide={slide} animated={playing && !held && visible} />
        <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-white text-primary shadow-md">
          <Maximize2 size={17} />
        </span>
      </button>
      <div className="px-1 pb-1 pt-4">
        <div aria-live={playing ? "off" : "polite"}>
          <h2 className="text-base font-semibold">{slide.title}</h2>
          <p className="mt-2 min-h-12 text-xs leading-6 text-muted-foreground">
            {slide.instruction}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {adminGuide.map((item, i) => (
              <button
                key={item.id}
                onClick={() => select(i)}
                aria-label={`Show tutorial step ${i + 1}: ${item.label}`}
                aria-pressed={index === i}
                className="grid size-9 place-items-center rounded-full hover:bg-secondary"
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    index === i ? "w-5 bg-primary" : "w-2 bg-[#8993ae]"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              className={control}
              onClick={() => select(index - 1)}
              aria-label="Previous tutorial slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className={control}
              onClick={() => {
                setPlaying((value) => !value)
                // An explicit Play request can resume while this control has focus.
                setHeld(false)
              }}
              aria-label={
                playing ? "Pause tutorial slideshow" : "Play tutorial slideshow"
              }
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button
              className={control}
              onClick={() => select(index + 1)}
              aria-label="Next tutorial slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AdminFeatures({ onExpand }) {
  const [index, setIndex] = useState(0)
  const slide = adminGuide[index]
  const Icon = slide.icon
  function arrowTab(event, i) {
    const key = event.key
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return
    event.preventDefault()
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? adminGuide.length - 1
          : (i + (key === "ArrowRight" ? 1 : -1) + adminGuide.length) %
            adminGuide.length
    setIndex(next)
    document.getElementById(`guide-tab-${next}`)?.focus()
  }
  return (
    <section
      id="workflow-guide"
      className="scroll-mt-8 bg-white py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <p className="text-center text-sm font-medium text-primary">
          See how it works
        </p>
        <h2 className="mt-3 text-center text-3xl font-medium sm:text-4xl">
          One request. A clear path forward.
        </h2>
        <div
          role="tablist"
          aria-label="Staff workflow features"
          className="mt-9 grid grid-cols-2 border-l border-t border-border md:grid-cols-4"
        >
          {adminGuide.map((item, i) => (
            <button
              id={`guide-tab-${i}`}
              key={item.id}
              role="tab"
              aria-selected={index === i}
              aria-controls="guide-feature-panel"
              tabIndex={index === i ? 0 : -1}
              onKeyDown={(e) => arrowTab(e, i)}
              onClick={() => setIndex(i)}
              className={`flex min-h-20 items-center justify-between gap-3 border-b border-r px-4 py-4 text-left text-sm font-medium sm:px-5 ${
                index === i
                  ? "border-b-primary bg-secondary text-primary shadow-[inset_0_-3px_0_#354bff]"
                  : "border-border hover:bg-muted"
              }`}
            >
              {item.label}
              <ArrowUpRight size={17} className="shrink-0" />
            </button>
          ))}
        </div>
        <div
          id="guide-feature-panel"
          role="tabpanel"
          aria-labelledby={`guide-tab-${index}`}
          tabIndex={0}
          className="mt-10 grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14"
        >
          <div>
            <Icon size={30} className="text-primary" />
            <h3 className="mt-5 max-w-sm text-2xl font-medium sm:text-3xl">
              {slide.title}
            </h3>
            <p className="mt-5 max-w-md text-sm leading-8 text-muted-foreground">
              {slide.description}
            </p>
            <button
              onClick={() => onExpand(index)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open this picture guide <Maximize2 size={16} />
            </button>
          </div>
          <button
            onClick={() => onExpand(index)}
            aria-label={`Enlarge feature picture: ${slide.label}`}
            className="rounded-xl bg-secondary p-3 text-left sm:p-5"
          >
            <TutorialPicture slide={slide} />
          </button>
        </div>
      </div>
    </section>
  )
}
