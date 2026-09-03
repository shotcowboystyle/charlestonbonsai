import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const rootDir = dirname(fileURLToPath(import.meta.url))

// Nuxt only injects its `~`/`@` aliases inside the `nuxt` environment, so the
// two node-environment projects have to declare them.
const alias = {
  '~': rootDir,
  '@': rootDir,
  '~~': rootDir,
  '@@': rootDir,
}

export default defineConfig({
  test: {
    // Vitest owns `*.test.ts`; Playwright owns `test/e2e/*.spec.ts`.
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'server',
          environment: 'node',
          include: ['test/server/**/*.test.ts'],
          setupFiles: ['./test/setup/nitro-globals.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          // Booting Nuxt for the first test file is slow on a cold cache.
          testTimeout: 30_000,
          hookTimeout: 120_000,
          environmentOptions: {
            nuxt: {
              rootDir,
              domEnvironment: 'happy-dom',
              overrides: {
                // `pnpm typecheck` already covers types; running vue-tsc inside
                // the test build only doubles nuxt-env startup time.
                typescript: { typeCheck: false },
                devtools: { enabled: false },
              },
            },
          },
        },
      }),
    ],
    // Coverage is a root-level option in Vitest 4; it cannot be set per project.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'server/utils/**/*.ts',
        'server/api/**/*.ts',
        'composables/**/*.ts',
        'utils/**/*.ts',
      ],
      exclude: ['**/*.d.ts'],
    },
  },
})
