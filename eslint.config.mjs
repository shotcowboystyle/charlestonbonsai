import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.output/**',
    '**/.nuxt/**',
    '**/.git/**',
    '**/*.md',
  ],
  rules: {
    // Nuxt uses process.env convention
    'node/prefer-global/process': 'off',
    // Allow unused refs that may be used in templates
    'vue/no-unused-refs': 'off',
    // Allow unused vars that start with underscore
    'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Vue refs are often used in onMounted before declaration
    'ts/no-use-before-define': 'off',
  },
})
