/**
 * The four atmospheres. Each is one complete look — key light in spherical
 * coordinates, light colours, fog, sky ramp, glow, stars, precipitation and
 * the chrome palette — crossfaded as one unit by crossfade.ts.
 *
 * Intensities are r155+ physically based units, tuned by eye under ACES.
 */
import type { Look, RGB } from './crossfade'
import { hexToLinear } from './crossfade'

export type AtmoId = 'asagiri' | 'yuki' | 'tsukiyo' | 'kosame'

export interface AtmospherePreset {
  id: AtmoId
  jp: string
  romaji: string
  en: string
  /** Key light: the sun, or the moon at night. Degrees. */
  key: { az: number, el: number, color: string, intensity: number }
  /** Disk drawn in the sky along the key direction. */
  disk: { color: string, size: number, halo: number, visible: number }
  hemi: { sky: string, ground: string, intensity: number }
  fill: { color: string, intensity: number }
  rim: { color: string, intensity: number }
  fog: { color: string, density: number }
  /** Six stops, zenith to below the horizon. */
  sky: [string, string, string, string, string, string]
  stars: number
  /** Lantern, brazier and window emission. */
  glow: number
  rays: number
  mist: number
  exposure: number
  /** Foliage sheen from dew or rain. */
  dew: number
  rain: number
  snow: number
  /** Chrome palette. Every pair is checked for contrast in the unit tests. */
  css: { paper: string, ink: string, inkSoft: string, line: string, accent: string, scrim: string }
}

export const ATMOSPHERES: readonly AtmospherePreset[] = [
  {
    id: 'asagiri',
    jp: '朝霧',
    romaji: 'Asagiri',
    en: 'Morning mist',
    key: { az: 64, el: 11, color: '#ffe2bd', intensity: 2.6 },
    disk: { color: '#fff1d6', size: 0.035, halo: 0.55, visible: 0.85 },
    hemi: { sky: '#cdd6d8', ground: '#6e6a54', intensity: 0.9 },
    fill: { color: '#b9c6cf', intensity: 0.32 },
    rim: { color: '#ffd8a6', intensity: 0.9 },
    fog: { color: '#d9dcd4', density: 0.042 },
    sky: ['#93a9b4', '#b3c2c4', '#d0d5cb', '#e4dfcd', '#ece2ca', '#ddd7c6'],
    stars: 0,
    glow: 0.18,
    rays: 1,
    mist: 1,
    exposure: 1.0,
    dew: 1,
    rain: 0,
    snow: 0,
    css: { paper: '#ece8dc', ink: '#1d211c', inkSoft: '#4a4e45', line: '#1d211c33', accent: '#46623f', scrim: '#ece8dccc' },
  },
  {
    id: 'yuki',
    jp: '雪',
    romaji: 'Yuki',
    en: 'Red sunrise, snow',
    key: { az: 98, el: 5, color: '#ff6a45', intensity: 2.1 },
    disk: { color: '#ff3d24', size: 0.05, halo: 0.75, visible: 1 },
    hemi: { sky: '#b4bed2', ground: '#dfe1e8', intensity: 1.05 },
    fill: { color: '#9cb0d2', intensity: 0.5 },
    rim: { color: '#ff7f61', intensity: 0.7 },
    fog: { color: '#c8c2c8', density: 0.03 },
    sky: ['#3f4a66', '#6b7290', '#a8909c', '#d99a86', '#ee6f50', '#bdaeb0'],
    stars: 0.04,
    glow: 0.45,
    rays: 0.55,
    mist: 0.3,
    exposure: 1.05,
    dew: 0,
    rain: 0,
    snow: 1,
    css: { paper: '#efecee', ink: '#1f1c22', inkSoft: '#4c4652', line: '#1f1c2233', accent: '#a33a24', scrim: '#efeceecc' },
  },
  {
    id: 'tsukiyo',
    jp: '月夜',
    romaji: 'Tsukiyo',
    en: 'Yellow moon',
    key: { az: 214, el: 12, color: '#a9bde0', intensity: 0.55 },
    disk: { color: '#f6d27a', size: 0.05, halo: 0.45, visible: 1 },
    hemi: { sky: '#1b2438', ground: '#0a0b0e', intensity: 0.32 },
    fill: { color: '#283452', intensity: 0.12 },
    rim: { color: '#7085b8', intensity: 0.4 },
    fog: { color: '#06070b', density: 0.022 },
    sky: ['#010204', '#020308', '#04060c', '#070a12', '#0b0f18', '#05060a'],
    stars: 1,
    glow: 1.7,
    rays: 0,
    mist: 0.12,
    exposure: 1.2,
    dew: 0.3,
    rain: 0,
    snow: 0,
    css: { paper: '#0d0f14', ink: '#ece6d2', inkSoft: '#b9b29c', line: '#ece6d233', accent: '#f0c86a', scrim: '#0d0f14d9' },
  },
  {
    id: 'kosame',
    jp: '小雨',
    romaji: 'Kosame',
    en: 'Slow rain',
    key: { az: 150, el: 42, color: '#c4cbd0', intensity: 0.75 },
    disk: { color: '#d8dcde', size: 0.02, halo: 0.2, visible: 0 },
    hemi: { sky: '#a7b1b6', ground: '#454a44', intensity: 1.3 },
    fill: { color: '#9aa6ac', intensity: 0.3 },
    rim: { color: '#c9d2d6', intensity: 0.25 },
    fog: { color: '#9aa3a5', density: 0.04 },
    sky: ['#6f7a80', '#88939a', '#9fa9ad', '#adb5b6', '#b2b8b7', '#a3aaa9'],
    stars: 0,
    glow: 0.6,
    rays: 0,
    mist: 0.5,
    exposure: 1.0,
    dew: 1,
    rain: 1,
    snow: 0,
    css: { paper: '#e3e5e3', ink: '#1b1f20', inkSoft: '#454c4e', line: '#1b1f2033', accent: '#3f5d55', scrim: '#e3e5e3cc' },
  },
]

export const ATMO_IDS = ATMOSPHERES.map(a => a.id)

export function isAtmoId(v: unknown): v is AtmoId {
  return typeof v === 'string' && (ATMO_IDS as readonly string[]).includes(v)
}

export function atmoById(id: AtmoId): AtmospherePreset {
  const a = ATMOSPHERES.find(x => x.id === id)
  if (!a)
    throw new RangeError(`Unknown atmosphere: ${id}`)
  return a
}

export interface AtmoLook extends Look {
  sunAz: number
  sunEl: number
  keyColor: RGB
  keyI: number
  diskColor: RGB
  diskSize: number
  halo: number
  disk: number
  hemiSky: RGB
  hemiGround: RGB
  hemiI: number
  fillColor: RGB
  fillI: number
  rimColor: RGB
  rimI: number
  fogColor: RGB
  fogDensity: number
  sky: RGB[]
  stars: number
  glow: number
  rays: number
  mist: number
  exposure: number
  dew: number
  rain: number
  snow: number
}

const rad = (d: number) => (d * Math.PI) / 180

/** Normalise once: hex to linear colour, degrees to radians. Applying never parses. */
export function atmoLook(p: AtmospherePreset): AtmoLook {
  return {
    sunAz: rad(p.key.az),
    sunEl: rad(p.key.el),
    keyColor: hexToLinear(p.key.color),
    keyI: p.key.intensity,
    diskColor: hexToLinear(p.disk.color),
    diskSize: p.disk.size,
    halo: p.disk.halo,
    disk: p.disk.visible,
    hemiSky: hexToLinear(p.hemi.sky),
    hemiGround: hexToLinear(p.hemi.ground),
    hemiI: p.hemi.intensity,
    fillColor: hexToLinear(p.fill.color),
    fillI: p.fill.intensity,
    rimColor: hexToLinear(p.rim.color),
    rimI: p.rim.intensity,
    fogColor: hexToLinear(p.fog.color),
    fogDensity: p.fog.density,
    sky: p.sky.map(hexToLinear),
    stars: p.stars,
    glow: p.glow,
    rays: p.rays,
    mist: p.mist,
    exposure: p.exposure,
    dew: p.dew,
    rain: p.rain,
    snow: p.snow,
  }
}
