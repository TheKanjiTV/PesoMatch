import { useEffect, useRef, useState } from "react"
import { reducedMotion } from "./motionPreference.js"

import { Pause, Play, RotateCcw } from "lucide-react"

import * as THREE from "three"

import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"

const stages = [
  [
    "Connect",

    "Your PESO service center",

    "Register your profile and get employment guidance.",
  ],

  [
    "Build skills",

    "Your training pathway",

    "Explore programs and track provider-confirmed enrollment.",
  ],

  [
    "Move forward",

    "Your next workplace",

    "Follow referrals, placement and employment outcomes.",
  ],
]

// A tactile case folder: one profile stays connected to skills and employment.

function createWorld(host, onReady, onFailure, onStage) {
  let renderer

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,

      alpha: true,

      powerPreference: "low-power",
    })
  } catch {
    onFailure()

    return () => {}
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))

  renderer.shadowMap.enabled = true

  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  renderer.outputColorSpace = THREE.SRGBColorSpace

  renderer.toneMapping = THREE.ACESFilmicToneMapping

  renderer.toneMappingExposure = 1.15

  renderer.domElement.setAttribute("aria-hidden", "true")

  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene(),
    folio = new THREE.Group()

  scene.add(folio)

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60)

  camera.position.set(0, 2.7, 13.8)

  camera.lookAt(0, 0.25, 0)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7965, 2.2))

  const key = new THREE.DirectionalLight(0xfff2d8, 3.2)

  key.position.set(-4, 7, 6)

  key.castShadow = true

  key.shadow.mapSize.set(1024, 1024)

  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })

  key.shadow.radius = 4

  key.shadow.bias = -0.0005

  key.shadow.normalBias = 0.025

  scene.add(key)

  const fill = new THREE.DirectionalLight(0xd8ece4, 1.2)

  fill.position.set(5, 1, 3)

  scene.add(fill)

  const material = (color, roughness = 0.85, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness })

  function slab(parent, w, h, d, color, x = 0, y = 0, z = 0, radius = 0.04) {
    const m = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 3, radius),

      material(color),
    )

    m.position.set(x, y, z)

    m.castShadow = true

    m.receiveShadow = true

    parent.add(m)

    return m
  }

  // Forest-green linen cover, an offset tab and slim brass binding.

  slab(folio, 5.6, 4.1, 0.13, 0x214e40, 0, -0.45, -0.55, 0.1)

  slab(folio, 1.45, 0.5, 0.12, 0x214e40, -1.9, 1.7, -0.55, 0.07)

  slab(folio, 0.065, 3.9, 0.08, 0xb1975d, -2.48, -0.45, -0.42, 0.025)

  for (const y of [-1.6, 0.9]) {
    const rivet = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 16, 12),

      material(0xbca36a, 0.3, 0.7),
    )

    rivet.position.set(-2.48, y, -0.34)

    folio.add(rivet)
  }

  const paper = [
    [
      "PROFILE",

      "Your starting point",

      "Skills. Experience. Ambition.",

      "PESO employment services",
    ],

    [
      "SKILLS",

      "Room to grow",

      "Training & development",

      "Enrollment and progress",
    ],

    [
      "EMPLOYMENT",

      "Your next chapter",

      "Referral & placement",

      "Continued employment support",
    ],
  ]

  function paperTexture(i) {
    const c = document.createElement("canvas")

    c.width = 840

    c.height = 1140

    const ctx = c.getContext("2d")

    ctx.fillStyle = ["#faf9ef", "#f3edda", "#e8eee3"][i]

    ctx.fillRect(0, 0, 840, 1140)

    ctx.strokeStyle = "#bdc8b7"

    ctx.lineWidth = 2

    ctx.strokeRect(45, 45, 750, 1050)

    ctx.fillStyle = "#244e3e"

    ctx.font = "500 42px 'Public Sans', sans-serif"

    ctx.fillText("P", 85, 130)

    ctx.font = "600 25px 'Public Sans', sans-serif"

    ctx.fillText(paper[i][0], 85, 220)

    ctx.font = "500 49px 'Lora', serif"

    ctx.fillText(paper[i][1], 85, 305)

    ctx.font = "400 25px 'Public Sans', sans-serif"

    ctx.fillText(paper[i][2], 85, 368)

    ctx.strokeStyle = "#244e3e"

    ctx.lineWidth = 8

    ctx.lineCap = "round"

    if (i === 0) {
      ctx.beginPath()

      ctx.arc(185, 545, 53, 0, Math.PI * 2)

      ctx.stroke()

      ctx.beginPath()

      ctx.arc(185, 715, 98, Math.PI, Math.PI * 2)

      ctx.stroke()

      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = "#aab8a5"

        ctx.fillRect(345, 510 + j * 60, 300 - j * 40, 12)
      }
    } else if (i === 1) {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = ["#b0bba3", "#6b8970", "#244e3e"][j]

        ctx.fillRect(115 + j * 205, 705 - j * 90, 145, 95 + j * 90)
      }
    } else {
      ctx.strokeRect(145, 530, 550, 250)

      ctx.strokeRect(315, 475, 210, 55)

      ctx.beginPath()

      ctx.moveTo(145, 615)

      ctx.lineTo(695, 615)

      ctx.stroke()

      ctx.beginPath()

      ctx.moveTo(350, 690)

      ctx.lineTo(400, 735)

      ctx.lineTo(505, 640)

      ctx.stroke()
    }

    ctx.fillStyle = "#54644f"

    ctx.font = "400 24px 'Public Sans', sans-serif"

    ctx.fillText(paper[i][3], 85, 940)

    ctx.fillStyle = "#b1975d"

    ctx.fillRect(85, 1000, 115, 5)

    const texture = new THREE.CanvasTexture(c)

    texture.colorSpace = THREE.SRGBColorSpace

    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())

    return texture
  }

  const cards = paper.map((_, i) => {
    const g = new THREE.Group()

    folio.add(g)

    slab(g, 2.9, 3.94, 0.045, [0xfaf9ef, 0xf3edda, 0xe8eee3][i])

    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(2.88, 3.92),

      new THREE.MeshBasicMaterial({ map: paperTexture(i), toneMapped: false }),
    )

    face.position.z = 0.026

    g.add(face)

    return g
  })

  // Ground receives soft, directional contact shadows; no floating islands.

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),

    new THREE.ShadowMaterial({ opacity: 0.14 }),
  )

  ground.position.z = -0.8

  ground.receiveShadow = true

  scene.add(ground)

  folio.rotation.set(-0.12, -0.15, -0.12)

  folio.scale.setScalar(1.2)

  let stage = 0,
    running = true,
    visible = true,
    disposed = false,
    frame = 0,
    last = 0,
    elapsed = 0,
    lastAdvance = 0

  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)")

  let reduced = reducedMotion(),
    progress = 1,
    from = [],
    target = []

  function poses(n) {
    return cards.map((_, i) => {
      const order = (i - n + 3) % 3

      return order === 0
        ? { x: 0.25, y: 0.25, z: 0.65, r: 0.07 }
        : order === 1
          ? { x: -1.35, y: 0.05, z: -0.15, r: 0.22 }
          : { x: 1.4, y: 0.15, z: 0.05, r: -0.13 }
    })
  }

  function setStage(n, immediate = false, requestFrame = true) {
    stage = n

    lastAdvance = elapsed

    from = cards.map((g) => ({
      x: g.position.x,

      y: g.position.y,

      z: g.position.z,

      r: g.rotation.z,
    }))

    target = poses(n)

    progress = immediate || reduced ? 1 : 0

    if (requestFrame) schedule()
  }

  function render() {
    if (!disposed) renderer.render(scene, camera)
  }

  function tick(time) {
    frame = 0

    if (disposed || !visible || document.hidden) return

    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0

    last = time

    if (running && !reduced) elapsed += dt

    if (running && !reduced && elapsed - lastAdvance > 8) {
      setStage((stage + 1) % 3, false, false)

      onStage(stage)
    }

    progress = Math.min(1, progress + dt / 0.65)

    const ease = 1 - Math.pow(1 - progress, 4)

    cards.forEach((g, i) => {
      const a = from[i],
        b = target[i]

      g.position.set(
        a.x + (b.x - a.x) * ease,

        a.y + (b.y - a.y) * ease,

        a.z + (b.z - a.z) * ease,
      )

      g.rotation.z = a.r + (b.r - a.r) * ease
    })

    // Small hinge movement reads as handling paper, without an endless rotation.

    folio.rotation.y =
      -0.15 + (running && !reduced ? Math.sin(elapsed * 0.55) * 0.035 : 0)

    render()

    if ((running && !reduced) || progress < 1)
      frame = requestAnimationFrame(tick)
  }

  function schedule() {
    last = 0

    if (!frame && !disposed) frame = requestAnimationFrame(tick)
  }

  function resize() {
    const { width, height } = host.getBoundingClientRect()

    if (!width || !height) return

    renderer.setSize(width, height, false)

    camera.aspect = width / height

    camera.position.z = camera.aspect < 0.8 ? 17 : 13.2

    camera.updateProjectionMatrix()

    render()
  }

  const ro = new ResizeObserver(resize)

  ro.observe(host)

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting

      if (visible) schedule()
      else {
        cancelAnimationFrame(frame)

        frame = 0
      }
    },

    { threshold: 0.05 },
  )

  io.observe(host)

  const visibility = () => {
    if (!document.hidden) schedule()
    else {
      cancelAnimationFrame(frame)

      frame = 0
    }
  }

  const motion = () => {
    reduced = reducedMotion()

    if (reduced) progress = 1

    schedule()
  }

  const lost = (e) => {
    e.preventDefault()

    cancelAnimationFrame(frame)

    onFailure()
  }

  document.addEventListener("visibilitychange", visibility)

  motionQuery.addEventListener("change", motion)
  window.addEventListener("peso:motion-change", motion)

  renderer.domElement.addEventListener("webglcontextlost", lost)

  setStage(0, true)

  resize()

  onReady({
    stage: (n) => setStage(n),

    pause: (value) => {
      running = !value

      schedule()
    },

    reset: () => {
      ;(elapsed = 0), (lastAdvance = 0)

      setStage(stage, true)
    },
  })

  return () => {
    disposed = true

    cancelAnimationFrame(frame)

    ro.disconnect()

    io.disconnect()

    document.removeEventListener("visibilitychange", visibility)

    motionQuery.removeEventListener("change", motion)
    window.removeEventListener("peso:motion-change", motion)

    renderer.domElement.removeEventListener("webglcontextlost", lost)

    scene.traverse((o) => {
      o.geometry?.dispose()

      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material]

        ms.forEach((m) => {
          m.map?.dispose()

          m.dispose()
        })
      }
    })

    renderer.dispose()

    renderer.domElement.remove()
  }
}

export default function PathwayScene() {
  const host = useRef(null),
    controller = useRef(null)

  const [stage, setStage] = useState(0),
    [paused, setPaused] = useState(false),
    [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false)

  useEffect(
    () =>
      createWorld(
        host.current,

        (api) => {
          controller.current = api

          setReady(true)
        },

        () => setFailed(true),

        setStage,
      ),

    [],
  )

  return (
    <section
      className="pathway-scene"
      aria-label="Interactive 3D employment pathway"
    >
      <div
        ref={host}
        className="scene-canvas"
        data-rendered={ready && !failed}
        data-stage={stage}
      >
        {(!ready || failed) && (
          <div className="scene-fallback">
            <div className="flex gap-5" aria-hidden="true">
              <span>Profile</span>
              <span>Skills</span>
              <span>Employment</span>
            </div>
            <p>
              {failed ? "Your pathway, at a glance." : "Building your pathway…"}
            </p>
          </div>
        )}
      </div>
      <div className="scene-toolbar">
        <div className="scene-playback">
          <button
            aria-label={paused ? "Play 3D animation" : "Pause 3D animation"}
            aria-pressed={paused}
            disabled={failed}
            onClick={() => {
              setPaused(!paused)

              controller.current?.pause(!paused)
            }}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            aria-label="Reset 3D view"
            disabled={failed}
            onClick={() => controller.current?.reset()}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
