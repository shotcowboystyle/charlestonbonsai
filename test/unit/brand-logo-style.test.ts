import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileStyle } from 'vue/compiler-sfc'

// Vue scoped `:global(X) .rest` compiles to bare `X`, so the dark-mode swap
// once landed on <html> and the ink logo stayed visible on dark backgrounds.
describe('brandLogo scoped style', () => {
  const sfc = readFileSync(resolve(__dirname, '../../components/ui/BrandLogo.vue'), 'utf8')
  const source = sfc.match(/<style scoped>([\s\S]*?)<\/style>/)![1]!
  const { code } = compileStyle({ source, id: 'data-v-test', scoped: true, filename: 'BrandLogo.vue' })

  it('swaps the logo images in dark mode, not the root element', () => {
    expect(code).not.toMatch(/\[data-theme='dark'\]\s*\{/)
    expect(code).toContain('[data-theme=\'dark\'] .brand-logo:not(.brand-logo--fixed) .brand-logo__img--ink[data-v-test]')
    expect(code).toContain('[data-theme=\'dark\'] .brand-logo:not(.brand-logo--fixed) .brand-logo__img--bone[data-v-test]')
  })
})
