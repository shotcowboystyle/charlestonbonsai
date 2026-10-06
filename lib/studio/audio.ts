/**
 * Procedural ambience with Web Audio — no audio files. Noise sources shaped
 * into wind (band-passed, slowly swept), a low water bed, surf (amplitude
 * LFO), a broadband waterfall, rain patter and brazier crackle, each on its
 * own gain bus crossfaded over ~1.2 s with linearRampToValueAtTime. Buses
 * rest at a near-zero floor, never exactly zero. An FM temple bell marks
 * each completed growth stage.
 *
 * Off by default. The AudioContext is created only from a user gesture
 * (`setEnabled(true)` is called from a click or key handler) and closed on
 * dispose.
 */
import type { Ambience } from './landscapes/meta'

export type Layer = 'wind' | 'water' | 'surf' | 'fall' | 'rain' | 'crackle'
export type Mix = Record<Layer, number>

const FLOOR = 0.0001
const FADE = 1.2

function noiseBuffer(ctx: AudioContext, seconds: number, kind: 'white' | 'patter' | 'crackle'): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let s = 12345
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  if (kind === 'white') {
    for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1
    return buf
  }
  const rate = kind === 'patter' ? 140 : 9
  const decay = kind === 'patter' ? 0.004 : 0.012
  for (let i = 0; i < n; i++) {
    if (rnd() < rate / ctx.sampleRate) {
      const amp = (kind === 'patter' ? 0.25 : 0.8) * (0.3 + rnd() * 0.7)
      const len = Math.floor(ctx.sampleRate * decay * 6)
      for (let k = 0; k < len && i + k < n; k++) d[i + k] = (d[i + k] ?? 0) + (rnd() * 2 - 1) * amp * Math.exp(-k / (ctx.sampleRate * decay))
    }
  }
  return buf
}

export class AmbienceEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buses = new Map<Layer, GainNode>()
  private sources: AudioScheduledSourceNode[] = []
  private target: Mix = { wind: 0, water: 0, surf: 0, fall: 0, rain: 0, crackle: 0 }
  on = false

  /** Must be called from a user gesture the first time. */
  setEnabled(on: boolean): void {
    this.on = on
    if (on && !this.ctx)
      this.build()
    const ctx = this.ctx
    if (!ctx || !this.master)
      return
    if (on)
      void ctx.resume()
    const t = ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(Math.max(FLOOR, this.master.gain.value), t)
    this.master.gain.linearRampToValueAtTime(on ? 0.7 : FLOOR, t + 0.5)
    if (on)
      this.apply()
  }

  private build(): void {
    const ctx = new AudioContext()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = FLOOR
    master.connect(ctx.destination)
    this.master = master
    const white = noiseBuffer(ctx, 3, 'white')
    const src = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource()
      s.buffer = buf
      s.loop = true
      s.start()
      this.sources.push(s)
      return s
    }
    const bus = (layer: Layer) => {
      const g = ctx.createGain()
      g.gain.value = FLOOR
      g.connect(master)
      this.buses.set(layer, g)
      return g
    }
    const lfo = (freq: number, depth: number, param: AudioParam) => {
      const o = ctx.createOscillator()
      o.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = depth
      o.connect(g).connect(param)
      o.start()
      this.sources.push(o)
    }
    const filter = (type: BiquadFilterType, freq: number, q = 0.7) => {
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.value = freq
      f.Q.value = q
      return f
    }
    const wind = filter('bandpass', 420, 0.8)
    lfo(0.07, 260, wind.frequency)
    src(white).connect(wind).connect(bus('wind'))
    src(white).connect(filter('lowpass', 520)).connect(bus('water'))
    const surfAmp = ctx.createGain()
    surfAmp.gain.value = 0.6
    lfo(0.09, 0.4, surfAmp.gain)
    src(white).connect(filter('lowpass', 900)).connect(surfAmp).connect(bus('surf'))
    src(white).connect(filter('highpass', 180)).connect(filter('lowpass', 6000)).connect(bus('fall'))
    src(noiseBuffer(ctx, 4, 'patter')).connect(filter('highpass', 1800)).connect(bus('rain'))
    src(noiseBuffer(ctx, 5, 'crackle')).connect(filter('bandpass', 2200, 0.9)).connect(bus('crackle'))
  }

  /** Target mix from the landscape recipe and the atmosphere. */
  mix(amb: Ambience, rain: number, snow: number): void {
    this.target = {
      wind: 0.22 * amb.wind * (1 - snow * 0.4) + 0.03,
      water: 0.3 * amb.water,
      surf: 0.4 * amb.surf,
      fall: 0.38 * amb.fall,
      rain: 0.5 * rain,
      crackle: 0.5 * amb.crackle,
    }
    if (this.on)
      this.apply()
  }

  private apply(): void {
    const ctx = this.ctx
    if (!ctx)
      return
    const t = ctx.currentTime
    for (const [layer, g] of this.buses) {
      g.gain.cancelScheduledValues(t)
      g.gain.setValueAtTime(Math.max(FLOOR, g.gain.value), t)
      g.gain.linearRampToValueAtTime(Math.max(FLOOR, this.target[layer]), t + FADE)
    }
  }

  /** FM temple bell: inharmonic modulator ratio, long exponential decay. */
  bell(stage: number, last: boolean): void {
    const ctx = this.ctx
    if (!ctx || !this.on || !this.master)
      return
    const t = ctx.currentTime + 0.02
    const f = last ? 146.8 : 220 * 2 ** ((stage % 3) / 12)
    const car = ctx.createOscillator()
    const mod = ctx.createOscillator()
    const idx = ctx.createGain()
    const amp = ctx.createGain()
    car.frequency.value = f
    mod.frequency.value = f * 2.76
    idx.gain.setValueAtTime(f * 3.2, t)
    idx.gain.exponentialRampToValueAtTime(f * 0.2, t + 2.5)
    amp.gain.setValueAtTime(FLOOR, t)
    amp.gain.linearRampToValueAtTime(last ? 0.3 : 0.16, t + 0.01)
    amp.gain.exponentialRampToValueAtTime(FLOOR, t + (last ? 6 : 3.5))
    mod.connect(idx).connect(car.frequency)
    car.connect(amp).connect(this.master)
    car.start(t)
    mod.start(t)
    car.stop(t + 6.2)
    mod.stop(t + 6.2)
  }

  dispose(): void {
    for (const s of this.sources) {
      try {
        s.stop()
      }
      catch {
        // Safe to continue: a source that never started cannot be stopped; the context closes next.
      }
    }
    this.sources = []
    void this.ctx?.close()
    this.ctx = null
  }
}
