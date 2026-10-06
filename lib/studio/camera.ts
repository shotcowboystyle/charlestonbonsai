/**
 * Damped orbit camera (content.md §3) with a per-frame FOV fit (§11).
 *
 * Scale. Everything is in real metres, from a 5.5 cm Keshitsubo to a 1.8 m
 * Imperial. The frame is solved from the subject — tree, pot and the top of
 * its display — plus a context margin that is part absolute (12 cm) and part
 * relative (35%). The absolute part is what makes a tiny tree read as tiny:
 * at Keshitsubo size the margin is bigger than the tree, so the stand, the
 * tatami weave and nearby gravel grains fill the frame at their true size;
 * at Imperial size the same 12 cm vanishes and the tree dominates. The orbit
 * radius follows the frame (nominal 32° lens), and near/far planes follow the
 * radius so the far/near ratio stays near 2,000-20,000 (no z-fighting at
 * either end). Interiors clamp the radius to the room and let the FOV solve
 * widen the lens instead, so the camera never passes through a wall.
 */
import type { Box3, PerspectiveCamera } from 'three'
import { MathUtils, Vector3 } from 'three'

export interface Framing {
  target: Vector3
  height: number
  width: number
  radius: number
  floorY: number
  ceilY: number
}

export interface Viewport {
  width: number
  height: number
  /** Measured chrome heights: the subject is fitted into the band between. */
  top: number
  bottom: number
}

const NOMINAL_FOV = 32
export const REST_AZ = 0.42
export const REST_EL = 0.1

/** Solve the frame for a subject box. `room` clamps the radius indoors. */
export function computeFraming(subject: Box3, room?: { radius: number, ceil: number }, groundY = 0): Framing {
  const size = new Vector3()
  subject.getSize(size)
  const span = Math.max(size.y, 0.001)
  // Context margin: never less than half a metre, so the setting stays legible around a small tree.
  const margin = Math.max(0.12 + span * 0.35, 0.5)
  const height = span + margin
  const width = Math.max(size.x, size.z) * 1.08 + margin
  const target = new Vector3()
  subject.getCenter(target)
  target.y = subject.min.y + span * 0.5 - margin * 0.12
  let radius = (height / 2) / Math.tan(MathUtils.degToRad(NOMINAL_FOV / 2))
  if (room)
    radius = Math.min(radius, room.radius)
  const floorY = groundY + Math.max(0.03, Math.min(target.y - groundY - radius * 0.2, 0.02 + radius * 0.06))
  return { target, height, width, radius, floorY, ceilY: room ? room.ceil - 0.25 : 1e4 }
}

const damp = (cur: number, target: number, k: number, dt: number) => cur + (target - cur) * (1 - k ** dt)

export class OrbitRig {
  orbAz = REST_AZ
  orbEl = REST_EL
  hovAz = 0
  hovEl = 0
  curAz = REST_AZ
  curEl = REST_EL
  zoom = 1
  zoomT = 1
  framing: Framing | null = null
  restAz = REST_AZ
  restEl = REST_EL
  private cur = { tx: 0, ty: 0, tz: 0, r: 1, h: 1, w: 1 }
  private pointers = new Map<number, { x: number, y: number }>()
  private pinch: { d: number, z: number } | null = null
  private lastTap = 0
  private cleanup: (() => void)[] = []

  constructor(private camera: PerspectiveCamera, private el: HTMLElement, private opts: { reducedMotion: boolean, onInteract?: () => void }) {}

  setFraming(f: Framing, instant: boolean): void {
    this.framing = f
    if (instant)
      this.cur = { tx: f.target.x, ty: f.target.y, tz: f.target.z, r: f.radius, h: f.height, w: f.width }
  }

  reset(): void {
    this.orbAz = this.restAz
    this.orbEl = this.restEl
    this.zoomT = 1
  }

  /** A landscape may prefer a different resting view (e.g. looking down to the sea). */
  setRest(az: number, el: number): void {
    this.restAz = az
    this.restEl = el
    this.reset()
  }

  set(az: number, el: number, zoom?: number, instant = false): void {
    this.orbAz = az
    this.orbEl = el
    if (zoom !== undefined)
      this.zoomT = MathUtils.clamp(zoom, 0.6, 2.4)
    if (instant) {
      this.curAz = az
      this.curEl = el
      this.zoom = this.zoomT
    }
  }

  nudge(dAz: number, dEl: number): void {
    this.orbAz += dAz
    this.orbEl = MathUtils.clamp(this.orbEl + dEl, -0.5, 0.9)
  }

  zoomBy(f: number): void {
    this.zoomT = MathUtils.clamp(this.zoomT * f, 0.6, 2.4)
  }

  elevationLimits(): [number, number] {
    const f = this.framing
    if (!f)
      return [-0.2, 0.7]
    const lo = Math.asin(MathUtils.clamp((f.floorY - f.target.y) / f.radius, -0.95, 0.95))
    const hi = Math.asin(MathUtils.clamp((f.ceilY - f.target.y) / f.radius, -0.95, 0.95))
    return [lo, Math.min(0.78, hi)]
  }

  /** Frame-rate independent damping; then place the camera and solve the FOV. */
  update(dt: number, vp: Viewport, instant = false): void {
    const f = this.framing
    if (!f)
      return
    const k = instant ? 0 : 0.0016
    const [lo, hi] = this.elevationLimits()
    const tAz = this.orbAz + this.hovAz
    const tEl = MathUtils.clamp(this.orbEl + this.hovEl, lo, hi)
    this.curAz = instant ? tAz : damp(this.curAz, tAz, k, dt)
    this.curEl = instant ? tEl : damp(this.curEl, tEl, k, dt)
    this.zoom = instant ? this.zoomT : damp(this.zoom, this.zoomT, k, dt)
    const c = this.cur
    const kf = instant ? 0 : 0.02
    c.tx = damp(c.tx, f.target.x, kf, dt)
    c.ty = damp(c.ty, f.target.y, kf, dt)
    c.tz = damp(c.tz, f.target.z, kf, dt)
    c.r = damp(c.r, f.radius, kf, dt)
    c.h = damp(c.h, f.height, kf, dt)
    c.w = damp(c.w, f.width, kf, dt)
    const ce = Math.cos(this.curEl)
    const cam = this.camera
    cam.position.set(c.tx + c.r * ce * Math.sin(this.curAz), c.ty + c.r * Math.sin(this.curEl), c.tz + c.r * ce * Math.cos(this.curAz))
    cam.lookAt(c.tx, c.ty, c.tz)
    const band = Math.max(80, vp.height - vp.top - vp.bottom)
    cam.aspect = vp.width / Math.max(1, vp.height)
    const vNeed = c.h * (vp.height / band)
    const hNeed = c.w / Math.max(0.2, cam.aspect)
    cam.fov = MathUtils.clamp(MathUtils.radToDeg(2 * Math.atan(Math.max(vNeed, hNeed) / 2 / c.r / this.zoom)), 8, 80)
    cam.near = Math.max(0.004, c.r * 0.04)
    cam.far = Math.min(3000, Math.max(400, c.r * 900))
    // Centre the subject in the band between header and timeline, not in the canvas.
    cam.setViewOffset(vp.width, vp.height, 0, (vp.bottom - vp.top) / 2, vp.width, vp.height)
    cam.updateProjectionMatrix()
  }

  attach(): void {
    const el = this.el
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, o?: AddEventListenerOptions) => {
      el.addEventListener(type, fn as EventListener, o)
      this.cleanup.push(() => el.removeEventListener(type, fn as EventListener, o))
    }
    on('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId)
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.style.cursor = 'grabbing'
      this.opts.onInteract?.()
      if (this.pointers.size === 2)
        this.pinch = { d: this.pinchDist(), z: this.zoomT }
      if (e.pointerType === 'touch') {
        const now = performance.now()
        if (now - this.lastTap < 350 && this.pointers.size === 1)
          this.reset()
        this.lastTap = now
      }
    })
    on('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId)
      const rect = el.getBoundingClientRect()
      if (!p) {
        if (e.pointerType === 'mouse' && !this.opts.reducedMotion) {
          this.hovAz = (((e.clientX - rect.left) / rect.width) - 0.5) * -0.28
          this.hovEl = (((e.clientY - rect.top) / rect.height) - 0.5) * 0.14
        }
        return
      }
      if (this.pointers.size === 2 && this.pinch) {
        p.x = e.clientX
        p.y = e.clientY
        this.zoomT = MathUtils.clamp(this.pinch.z * (this.pinchDist() / Math.max(1, this.pinch.d)), 0.6, 2.4)
        return
      }
      const dx = e.clientX - p.x
      const dy = e.clientY - p.y
      p.x = e.clientX
      p.y = e.clientY
      this.orbAz -= (dx / rect.width) * 3.2
      const [lo, hi] = this.elevationLimits()
      this.orbEl = MathUtils.clamp(this.orbEl + (dy / rect.height) * 1.6, lo, hi)
    })
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId)
      if (this.pointers.size < 2)
        this.pinch = null
      if (this.pointers.size === 0)
        el.style.cursor = 'grab'
    }
    on('pointerup', end)
    on('pointercancel', end)
    on('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.hovAz = 0
        this.hovEl = 0
      }
    })
    on('dblclick', () => this.reset())
    on('wheel', (e) => {
      e.preventDefault()
      this.zoomBy(Math.exp(-e.deltaY * 0.0012))
    }, { passive: false })
    el.style.cursor = 'grab'
    el.style.touchAction = 'none'
  }

  private pinchDist(): number {
    const [a, b] = [...this.pointers.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 1
  }

  detach(): void {
    for (const c of this.cleanup) c()
    this.cleanup = []
    this.pointers.clear()
  }
}

/** World anchor for the §4 plaque: beside the pot on the camera's right, rotating with the azimuth. */
export function plaqueAnchor(b: { group: { position: Vector3 }, meta: { footprint: { w: number, d: number }, bounds: Box3, potTop: number } }, az: number): Vector3 {
  const fp = b.meta.footprint
  const bb = b.meta.bounds
  const d = Math.max(fp.w * 1.1, (bb.max.x - bb.min.x) * 0.5, (bb.max.z - bb.min.z) * 0.5)
  const y = b.group.position.y + b.meta.potTop * 0.4
  return new Vector3(Math.cos(az) * d + Math.sin(az) * fp.d * 0.5, y, -Math.sin(az) * d + Math.cos(az) * fp.d * 0.5)
}
