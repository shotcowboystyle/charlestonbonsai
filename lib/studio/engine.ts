/**
 * The studio engine: one WebGLRenderer, one loop, one authoritative
 * `applyTime(t)`. Every control — playback, scrubber, keyboard, deep link,
 * automation hook — routes through the same calls here, so the scene and
 * the chrome can never disagree.
 */
import type { Viewport } from './camera'
import type { Selection } from './state'
import type { TimelineState } from './timeline'
import { ACESFilmicToneMapping, Color, DirectionalLight, FogExp2, HemisphereLight, PCFShadowMap, PerspectiveCamera, PointLight, Scene, Vector3, WebGLRenderer } from 'three'
import { OrbitRig, plaqueAnchor, REST_AZ, REST_EL } from './camera'
import { isSoftwareRenderer } from './gpu'
import { LookController } from './look'
import { AdaptiveRatio, median } from './resolution'
import { createSky } from './sky'
import { createSystems } from './systems'
import { DUR, stageIndexAt, timelineState } from './timeline'
import { resetWeatherUniforms, weatherUniforms } from './weather/cover'
import { World } from './world'

export interface EngineCallbacks {
  onTime: (s: TimelineState, playing: boolean) => void
  onStage: (stage: number) => void
  onPlaque: (x: number, y: number, az: number) => void
  measure: () => Viewport
}

export interface EngineOptions extends EngineCallbacks {
  canvas: HTMLCanvasElement
  selection: Selection
  reducedMotion: boolean
  mobile: boolean
}

export type Engine = ReturnType<typeof createEngine>

export function createEngine(o: EngineOptions) {
  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.localClippingEnabled = true
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  // Shadows are re-rendered only when something that casts or lights them changes
  // (growth, light, framing, landscape), not every frame.
  renderer.shadowMap.autoUpdate = false
  renderer.toneMapping = ACESFilmicToneMapping
  // Count the whole frame (shadow, reflections, rays), not just the last pass.
  renderer.info.autoReset = false
  const software = isSoftwareRenderer(renderer)
  const quality: 'high' | 'low' = o.mobile || software ? 'low' : 'high'
  renderer.shadowMap.enabled = !software
  const ratio = new AdaptiveRatio(software ? 1 : Math.min(window.devicePixelRatio || 1, 2))
  const dpr = () => ratio.current
  renderer.setPixelRatio(dpr())

  resetWeatherUniforms()
  const scene = new Scene()
  scene.fog = new FogExp2(new Color('#d9dcd4'), 0.03)
  const camera = new PerspectiveCamera(32, 1, 0.05, 1000)
  // Layer 2: grass and particles (kept out of reflections and the ray mask); layer 3: reflective water.
  camera.layers.enable(2)
  camera.layers.enable(3)

  const hemi = new HemisphereLight(0xFFFFFF, 0x444444, 1)
  const key = new DirectionalLight(0xFFFFFF, 2.5)
  key.castShadow = true
  key.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024)
  key.shadow.radius = 3
  const fill = new DirectionalLight(0xFFFFFF, 0.3)
  const rim = new DirectionalLight(0xFFFFFF, 0.5)
  const points = [new PointLight(0xFF8A3C, 0, 6, 2), new PointLight(0xFFB060, 0, 6, 2)]
  scene.add(hemi, key, key.target, fill, rim, ...points)

  const sky = createSky(dpr(), quality)
  scene.add(sky.group)
  const kitUniforms = { uTime: weatherUniforms.uTime, uWind: { value: 0.35 } }
  const world = new World({ scene, quality, uniforms: kitUniforms, lights: points, reducedMotion: o.reducedMotion })
  const look = new LookController({ scene, renderer, hemi, key, fill, rim, sky, points }, o.selection.atmo)
  const rig = new OrbitRig(camera, o.canvas, { reducedMotion: o.reducedMotion })
  rig.attach()
  const systems = createSystems({ scene, camera, renderer, world, look, sky, quality, reducedMotion: o.reducedMotion })

  let sel = o.selection
  let t = 0
  let playing = !o.reducedMotion
  let lastStage = -1
  let raf = 0
  let last = performance.now()
  let clock = 0
  let disposed = false
  let shadowDirty = true
  let shadowAt = 0
  let vp: Viewport = o.measure()
  const frameTimes: number[] = []
  const workTimes: number[] = []

  function leafBudget(): number {
    return quality === 'high' ? 9000 : 3200
  }

  function applyTime(tt: number): void {
    t = Math.min(DUR, Math.max(0, tt))
    const s = timelineState(t)
    world.bonsai?.applyTimeline(s)
    shadowDirty = true
    const si = stageIndexAt(t)
    if (si !== lastStage) {
      lastStage = si
      o.onStage(si)
      systems.stage(si)
    }
    o.onTime(s, playing)
  }

  function reframe(instant: boolean): void {
    const f = world.framing()
    rig.setFraming(f, instant)
    const box = world.subjectBox()
    const size = box.getSize(new Vector3())
    look.focus.copy(box.getCenter(new Vector3()))
    const room = world.land?.interior
    look.extent = room ? Math.max(room.radius * 1.2, size.length()) : Math.max(size.length() * 1.6, f.height * 1.4, 0.6)
    look.interior = Boolean(room)
    look.minSunEl = room?.minSunEl ?? -1
    look.fogScale = world.land?.fogScale ?? 1
    look.glow = world.mats?.glowAll() ?? []
    look.refresh()
    shadowDirty = true
  }

  function setTree(s: Selection): void {
    world.setTree(s.style, s.tree, s.size, leafBudget())
    lastStage = -1
    playing = !o.reducedMotion
    applyTime(o.reducedMotion ? DUR : 0)
  }

  function setSelection(next: Selection, instant = false): void {
    const prev = sel
    sel = next
    const sceneChanged = !world.land || prev.scene !== next.scene
    if (sceneChanged) {
      world.setLandscape(next.scene)
      systems.landscape()
      const v = world.land?.view
      rig.setRest(v?.az ?? REST_AZ, v?.el ?? REST_EL)
    }
    if (!world.bonsai || prev.style !== next.style || prev.tree !== next.tree || prev.size !== next.size)
      setTree(next)
    else if (sceneChanged)
      applyTime(t)
    if (sceneChanged || prev.atmo !== next.atmo || !world.bonsai)
      look.set(next.atmo, instant || o.reducedMotion)
    reframe(instant || sceneChanged)
  }

  function layout(): void {
    vp = o.measure()
    renderer.setPixelRatio(dpr())
    renderer.setSize(vp.width, vp.height, false)
    systems.resize(vp.width, vp.height)
    rig.update(0, vp, false)
  }

  function render(): void {
    // While the tree grows, shadows refresh at ~12 Hz rather than every frame.
    const now = performance.now()
    if (shadowDirty && (!playing || now - shadowAt > 80)) {
      renderer.shadowMap.needsUpdate = true
      shadowDirty = false
      shadowAt = now
    }
    const az = rig.curAz
    sky.follow(camera.position, camera.far * 0.5)
    if (world.bonsai) {
      const p = plaqueAnchor(world.bonsai, az).project(camera)
      o.onPlaque((p.x * 0.5 + 0.5) * vp.width, (-p.y * 0.5 + 0.5) * vp.height, az)
    }
    renderer.render(scene, camera)
    systems.render()
  }

  function frame(now: number): void {
    if (disposed)
      return
    raf = requestAnimationFrame(frame)
    if (software && now - last < 66)
      return
    const rawDt = (now - last) / 1000
    last = now
    const dt = Math.min(0.05, Math.max(0, rawDt))
    const w0 = performance.now()
    renderer.info.reset()
    if (!o.reducedMotion)
      clock += dt
    weatherUniforms.uTime.value = clock
    if (world.bonsai) {
      world.bonsai.uniforms.uTime.value = clock
      world.bonsai.uniforms.uSway.value = o.reducedMotion ? 0 : world.bonsai.meta.height * 0.003
    }
    if (playing) {
      const nt = t + dt
      if (nt >= DUR)
        playing = false
      applyTime(Math.min(DUR, nt))
    }
    if (look.step(o.reducedMotion ? 10 : dt))
      shadowDirty = true
    rig.update(dt, vp)
    world.land?.update?.(dt, clock)
    systems.update(dt, clock)
    sky.setTime(clock)
    render()
    frameTimes.push(rawDt * 1000)
    if (ratio.sample(rawDt * 1000) !== null)
      layout()
    workTimes.push(performance.now() - w0)
    if (frameTimes.length > 120) {
      frameTimes.shift()
      workTimes.shift()
    }
  }

  function onVisibility(): void {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    else if (!raf && !disposed) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  setSelection(sel, true)
  layout()
  rig.update(0, vp, true)
  document.addEventListener('visibilitychange', onVisibility)
  raf = requestAnimationFrame(frame)

  return {
    renderer,
    get t() { return t },
    get playing() { return playing },
    get selection() { return sel },
    setSelection,
    layout,
    seek(v: number): void {
      lastStage = -1
      playing = false
      applyTime(v)
      rig.update(0, vp, false)
      render()
    },
    play(): void {
      if (t >= DUR)
        t = 0
      playing = true
      o.onTime(timelineState(t), playing)
    },
    pause(): void {
      playing = false
      o.onTime(timelineState(t), playing)
    },
    restart(): void {
      lastStage = -1
      playing = true
      applyTime(0)
    },
    orbit(az: number, el: number, zoom?: number, instant = true): void {
      rig.set(az, el, zoom, instant)
      if (instant)
        rig.update(0, vp, true)
    },
    nudge: (daz: number, del: number) => rig.nudge(daz, del),
    project(x: number, y: number, z: number): [number, number] {
      const p = new Vector3(x, y, z).project(camera)
      return [p.x * 0.5 + 0.5, -p.y * 0.5 + 0.5]
    },
    zoomBy: (f: number) => rig.zoomBy(f),
    resetView: () => rig.reset(),
    audio: systems.audio,
    perf() {
      return { software, quality, ...renderer.info.render, memory: { ...renderer.info.memory }, programs: renderer.info.programs?.length ?? 0, medianFrameMs: median(frameTimes), medianWorkMs: median(workTimes), pixelRatio: renderer.getPixelRatio(), stats: world.bonsai?.meta.stats }
    },
    dispose(): void {
      disposed = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      rig.detach()
      systems.dispose()
      world.dispose()
      sky.dispose()
      scene.environment = null
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
