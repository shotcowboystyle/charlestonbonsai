/**
 * Software rasterisers (SwiftShader, llvmpipe) draw the full studio at a
 * frame every few seconds and lock the page. Detect them so the engine can
 * drop to its lightest profile: low quality, no shadows, 1x pixels and a
 * capped frame rate. Headless CI browsers land here too.
 */
import type { WebGLRenderer } from 'three'

export function isSoftwareRenderer(renderer: WebGLRenderer): boolean {
  const gl = renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
}
