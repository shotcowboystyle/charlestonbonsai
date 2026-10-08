/**
 * The peak: a drop of ink blooms across the paper, the bloom becomes a painted
 * tree, and the painting bleeds through into a photograph of a real specimen.
 *
 * One fragment shader over one quad. The bloom front is a threshold sweeping an
 * "arrival time" field built from a real ink-bleed image mixed with radial
 * distance, so the edge grows with the paper fibres instead of as a circle.
 * Outside the bloom the canvas is transparent, so the world shows through and
 * there is never a rectangle on the page: the shader only ever lays down ink
 * and photograph, never paper.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vUv.y = 1.0 - vUv.y;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTree;
uniform sampler2D uBloom;
uniform sampler2D uPhoto;
uniform float uP1;
uniform float uP2;
uniform float uWet;
uniform float uHasPhoto;
uniform vec2 uPhotoScale;
uniform float uAspect;
uniform vec3 uInk;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int k = 0; k < 5; k++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// When the ink arrives at this point. Distance from the drop, pushed into
// lobes by low-frequency noise and into feathers by the real bleed image.
float field(vec2 uv) {
  vec2 c = uv - 0.5;
  c.x *= uAspect;
  float r = length(c) / 0.5;
  float b = texture2D(uBloom, uv).r;
  float lobes = fbm(uv * 3.2 + 7.3) - 0.5;
  float fibre = fbm(vec2(uv.x * 34.0, uv.y * 5.0)) - 0.5;
  // The drop itself is round; the paper only gets a say once the ink is moving.
  float away = smoothstep(0.0, 0.45, r);
  return r * 0.66 + (b * 0.22 + lobes * 0.42 + fibre * 0.06) * away;
}

void main() {
  float a = field(vUv);
  // Nothing may touch the canvas edge, or the canvas shows as a rectangle.
  vec2 e = min(vUv, 1.0 - vUv);
  float edge = smoothstep(0.0, 0.14, min(e.x * uAspect, e.y));
  float bl = texture2D(uBloom, vUv).r;
  float live = step(0.0005, uP1);

  // The bloom front sweeps past the canvas edge; the wash it leaves dies out
  // inside it, so the stain has an organic edge and a darker tide line.
  float f1 = uP1 * 1.4 - 0.03;
  float covered = live * smoothstep(f1 + 0.015, f1 - 0.04, a);
  float soft = 0.014 + 0.03 * uWet;
  float front = live * exp(-pow((a - f1) / soft, 2.0)) * (1.0 - smoothstep(0.55, 1.05, f1));
  float wash = covered * (0.07 + 0.13 * (1.0 - bl)) * (1.0 - smoothstep(0.25, 0.72, a));
  float tide = covered * 0.14 * exp(-pow((a - 0.7) / 0.03, 2.0));
  float core = live * smoothstep(0.06, 0.035, a) * 0.92 * (1.0 - smoothstep(0.25, 0.6, uP1));

  // The painted tree develops just behind the front, then gives way to the photograph.
  float tree = clamp(((1.0 - texture2D(uTree, vUv).r) - 0.06) / 0.88, 0.0, 1.0);
  tree *= smoothstep(f1 - 0.02, f1 - 0.2, a);
  float leave = 1.0 - smoothstep(0.15, 0.95, uP2);
  float settle = 1.0 - 0.75 * smoothstep(0.0, 1.0, uP2);

  float f2 = uP2 * 1.5 - 0.02;
  float photoLive = uHasPhoto * step(0.0005, uP2);
  float hole = photoLive * smoothstep(f2 + 0.01, f2 - 0.035, a) * edge;
  float ring = photoLive * 0.7 * exp(-pow((a - f2) / 0.018, 2.0)) * edge;

  float k = max(max(max(wash, tide) * settle, tree * leave), max(max(front * (0.45 + 0.3 * uWet), core), ring));
  k = clamp(k * edge, 0.0, 1.0);

  vec2 puv = (vUv - 0.5) * uPhotoScale + 0.5;
  vec3 photo = texture2D(uPhoto, puv).rgb;

  // Ink over photograph over nothing, premultiplied.
  vec3 col = uInk * k + photo * hole * (1.0 - k);
  float alpha = k + hole * (1.0 - k);
  gl_FragColor = vec4(col, alpha);
}`

export interface BloomState { p1: number, p2: number, wet: number }

export interface Bloom {
  render: (s: BloomState) => void
  setPhoto: (url: string) => Promise<void>
  setInk: (ink: [number, number, number]) => void
  resize: () => void
  destroy: () => void
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Catalog photos live on Vercel Blob, which sends access-control-allow-origin: *.
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`image failed: ${url}`))
    img.src = url
  })
}

/** Catalog uploads are full phone photos (3-5MB, 4032px). Never hand one to the GPU at that size. */
function downscale(img: HTMLImageElement, max = 1280): HTMLCanvasElement {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k)
  c.height = Math.round(img.naturalHeight * k)
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
  return c
}

export async function createBloom(canvas: HTMLCanvasElement, treeUrl: string, bloomUrl: string): Promise<Bloom | null> {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl)
    return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) ?? 'shader compile failed')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) ?? 'program link failed')
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl.getUniformLocation(prog, name)
  const texture = (unit: number, source: TexImageSource) => {
    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    return tex
  }

  const [tree, bloom] = await Promise.all([loadImage(treeUrl), loadImage(bloomUrl)])
  const textures = [texture(0, tree), texture(1, bloom)]
  // A 1px placeholder so the photo sampler is always bound.
  const blank = document.createElement('canvas')
  blank.width = blank.height = 1
  let photoTex = texture(2, blank)
  let photoAspect = 1
  gl.uniform1i(u('uTree'), 0)
  gl.uniform1i(u('uBloom'), 1)
  gl.uniform1i(u('uPhoto'), 2)
  gl.uniform1f(u('uHasPhoto'), 0)

  const canvasAspect = () => canvas.width / Math.max(canvas.height, 1)
  const coverScale = () => {
    // object-fit: cover, in UV space
    const ca = canvasAspect()
    gl.uniform2f(u('uPhotoScale'), photoAspect > ca ? ca / photoAspect : 1, photoAspect > ca ? 1 : photoAspect / ca)
  }

  const api: Bloom = {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(canvas.clientWidth * dpr)
      const h = Math.round(canvas.clientHeight * dpr)
      if (w === canvas.width && h === canvas.height)
        return
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform1f(u('uAspect'), canvasAspect())
      coverScale()
    },
    setInk(ink) {
      gl.uniform3f(u('uInk'), ...ink)
    },
    async setPhoto(url) {
      const img = await loadImage(url)
      photoAspect = img.naturalWidth / img.naturalHeight
      gl.deleteTexture(photoTex)
      photoTex = texture(2, downscale(img))
      gl.uniform1f(u('uHasPhoto'), 1)
      coverScale()
    },
    render({ p1, p2, wet }) {
      gl.uniform1f(u('uP1'), p1)
      gl.uniform1f(u('uP2'), p2)
      gl.uniform1f(u('uWet'), wet)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    destroy() {
      textures.forEach(t => gl.deleteTexture(t))
      gl.deleteTexture(photoTex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    },
  }
  api.resize()
  return api
}
