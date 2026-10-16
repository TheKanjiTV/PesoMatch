import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import { reducedMotion } from "./motionPreference.js"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"

// The only moving object is the phone. Its screen is an illustrative interface.
function makePhone(host, ready, fail) {
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    })
  } catch {
    fail()
    return () => {}
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)
  renderer.domElement.setAttribute("aria-hidden", "true")
  const scene = new THREE.Scene(),
    phone = new THREE.Group()
  scene.add(phone, new THREE.HemisphereLight(0xffffff, 0x284c42, 3))
  const light = new THREE.DirectionalLight(0xfff6e8, 4)
  light.position.set(-3, 5, 7)
  scene.add(light)
  const rim = new THREE.DirectionalLight(0xc9e8db, 3)
  rim.position.set(5, 1, -3)
  scene.add(rim)
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40)
  camera.position.set(0, 0, 12)
  const slab = (w, h, d, color, x, y, z, r = 0.08, metalness = 0) => {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 5, r),
      new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.34 }),
    )
    mesh.position.set(x, y, z)
    phone.add(mesh)
    return mesh
  }
  slab(2.52, 5.05, 0.28, 0x183c33, 0, 0, 0, 0.18, 0.65)
  slab(2.46, 4.99, 0.29, 0x092820, 0, 0, 0.015, 0.17, 0.2)
  // Rounded screen geometry with normalized texture coordinates.
  const width = 2.32,
    height = 4.81,
    r = 0.22,
    shape = new THREE.Shape()
  shape.moveTo(-width / 2 + r, -height / 2)
  shape.lineTo(width / 2 - r, -height / 2)
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + r)
  shape.lineTo(width / 2, height / 2 - r)
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - r, height / 2)
  shape.lineTo(-width / 2 + r, height / 2)
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - r)
  shape.lineTo(-width / 2, -height / 2 + r)
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + r, -height / 2)
  const geometry = new THREE.ShapeGeometry(shape),
    positions = geometry.attributes.position,
    uv = geometry.attributes.uv
  for (let i = 0; i < positions.count; i++)
    uv.setXY(
      i,
      (positions.getX(i) + width / 2) / width,
      (positions.getY(i) + height / 2) / height,
    )
  const canvas = document.createElement("canvas")
  canvas.width = 696
  canvas.height = 1443
  const c = canvas.getContext("2d")
  const rect = (x, y, w, h, color, radius = 20) => {
    c.fillStyle = color
    c.beginPath()
    c.roundRect(x, y, w, h, radius)
    c.fill()
  }
  const text = (value, x, y, size = 32, color = "#123d35", weight = 500) => {
    c.fillStyle = color
    c.font = `${weight} ${size}px Arial`
    c.fillText(value, x, y)
  }
  rect(0, 0, 696, 1443, "#f7f8f1", 0)
  // Plain P mark, consistent with the website navigation.
  c.strokeStyle = "#123d35"
  c.lineWidth = 9
  c.lineCap = "round"
  c.lineJoin = "round"
  c.beginPath()
  c.moveTo(56, 180)
  c.lineTo(56, 118)
  c.lineTo(81, 118)
  c.bezierCurveTo(116, 118, 116, 157, 81, 157)
  c.lineTo(74, 157)
  c.stroke()
  text("PESO", 142, 170, 57, "#123d35", 700)
  text("Your workspace", 48, 270, 29)
  text("Make your", 48, 351, 66, "#123d35", 700)
  text("next move.", 48, 425, 66, "#123d35", 700)
  rect(48, 481, 600, 100, "#e5ebdc")
  text("Profile", 77, 543, 29)
  text("Skills", 286, 543, 29)
  text("Work", 491, 543, 29)
  rect(48, 620, 600, 164, "#123d35")
  text("One profile.", 80, 685, 35, "#f7f8f1", 700)
  text("Connected services.", 80, 738, 33, "#f7f8f1")
  ;["Explore vacancies", "Training enrollment", "Employment outcomes"].forEach(
    (label, i) => {
      const y = 830 + i * 124
      rect(48, y, 600, 98, "#b8cbbd")
      rect(50, y + 2, 596, 94, "#ffffff")
      text(label, 78, y + 61, 32, "#123d35", 600)
      c.strokeStyle = "#123d35"
      c.lineWidth = 4
      c.beginPath()
      c.moveTo(591, y + 40)
      c.lineTo(601, y + 50)
      c.lineTo(591, y + 60)
      c.stroke()
    },
  )
  text("Interface preview", 48, 1264, 24, "#38594e")
  rect(225, 1378, 246, 11, "#123d35", 6)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  const screen = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture }),
  )
  screen.position.z = 0.168
  phone.add(screen)
  slab(0.94, 0.15, 0.04, 0x092820, 0, 2.34, 0.19, 0.06)
  slab(0.37, 0.024, 0.02, 0x395349, 0, 2.33, 0.216, 0.009)
  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.029, 16, 12),
    new THREE.MeshStandardMaterial({
      color: 0x132833,
      metalness: 0.5,
      roughness: 0.2,
    }),
  )
  lens.position.set(0.3, 2.33, 0.22)
  phone.add(lens)
  slab(0.035, 0.48, 0.09, 0x2d594b, 1.27, 0.75, 0, 0.015, 0.7)
  for (const y of [0.8, 1.4])
    slab(0.035, 0.28, 0.09, 0x2d594b, -1.27, y, 0, 0.012, 0.7)
  let frame = 0,
    last = 0,
    elapsed = 0,
    visible = true,
    paused = false,
    disposed = false
  const query = matchMedia("(prefers-reduced-motion: reduce)")
  const draw = () => renderer.render(scene, camera)
  function tick(t) {
    frame = 0
    if (disposed || !visible || document.hidden) return
    if (last && !paused && !reducedMotion())
      elapsed += Math.min((t - last) / 1000, 0.05)
    last = t
    phone.rotation.set(
      -0.055 + Math.sin(elapsed * 0.5) * 0.025,
      -0.16 + Math.sin(elapsed * 0.45) * 0.17,
      -0.035 + Math.sin(elapsed * 0.35) * 0.025,
    )
    phone.position.y = Math.sin(elapsed * 0.7) * 0.065
    draw()
    if (!paused && !reducedMotion()) frame = requestAnimationFrame(tick)
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
    camera.updateProjectionMatrix()
    draw()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting
      if (visible) schedule()
      else {
        cancelAnimationFrame(frame)
        frame = 0
      }
    },
    { threshold: 0.05 },
  )
  io.observe(host)
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else schedule()
  }
  function lost(e) {
    e.preventDefault()
    cancelAnimationFrame(frame)
    fail()
  }
  document.addEventListener("visibilitychange", visibility)
  query.addEventListener("change", schedule)
  window.addEventListener("peso:motion-change", schedule)
  renderer.domElement.addEventListener("webglcontextlost", lost)
  resize()
  schedule()
  ready((value) => {
    paused = value
    schedule()
  })
  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    ro.disconnect()
    io.disconnect()
    document.removeEventListener("visibilitychange", visibility)
    query.removeEventListener("change", schedule)
    window.removeEventListener("peso:motion-change", schedule)
    renderer.domElement.removeEventListener("webglcontextlost", lost)
    scene.traverse((o) => {
      o.geometry?.dispose()
      if (o.material) {
        o.material.map?.dispose()
        o.material.dispose()
      }
    })
    renderer.dispose()
    renderer.domElement.remove()
  }
}
export default function PhoneScene() {
  const host = useRef(null),
    control = useRef(null),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [paused, setPaused] = useState(false)
  useEffect(
    () =>
      makePhone(
        host.current,
        (pause) => {
          control.current = pause
          setReady(true)
        },
        () => setFailed(true),
      ),
    [],
  )
  return (
    <div
      className="phone-stage"
      role="group"
      aria-label="3D phone interface preview"
    >
      <div
        ref={host}
        className="phone-canvas"
        data-rendered={ready && !failed}
      />
      {(!ready || failed) && (
        <div className="phone-silhouette" aria-hidden="true">
          <span>P</span>
        </div>
      )}
      {ready && !failed && (
        <button
          className="phone-pause"
          aria-label={paused ? "Play phone animation" : "Pause phone animation"}
          aria-pressed={paused}
          onClick={() => {
            control.current?.(!paused)
            setPaused(!paused)
          }}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      )}
    </div>
  )
}
