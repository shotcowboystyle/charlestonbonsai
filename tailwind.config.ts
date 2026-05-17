import type { Config } from 'tailwindcss'

/**
 * Tailwind theme — Charleston Bonsai
 *
 * This config is in transition. Two systems coexist:
 *
 *   1. LEGACY palette (cream / sage / forest / bark / moss / stone / charcoal)
 *      and the Playfair+Outfit font stack. Existing components still consume
 *      these. They are scheduled to retire as components migrate.
 *
 *   2. NEW sumi-e token system. Reads from CSS variables defined in
 *      assets/css/tokens.css. Use these for any new work:
 *        - colors:    `bg-surface`, `text-text`, `border-border`,
 *                     `bg-paper-1`, `text-ink-1`, `bg-accent`
 *        - fonts:     `font-display`, `font-body`
 *        - spacing:   `p-md`, `gap-lg`, `mt-2xl` (semantic 4pt scale)
 *        - motion:    `duration-base`, `ease-out-quart`
 *        - radius:    `rounded-sm`, `rounded-md` (sharper than Tailwind defaults)
 *
 * Never mix the two namespaces inside a single component. Either it lives
 * on the legacy palette (current behavior) or it has been migrated to the
 * sumi-e system. The migration is its own follow-up pass.
 */
export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  // Theme toggle: <html data-theme="dark"> overrides system preference.
  // The light-dark() CSS function in tokens.css handles the rest.
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        /* ───────── NEW: sumi-e token system ───────── */
        // Semantic surfaces — what components should consume
        'surface': 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        'surface-sunken': 'var(--surface-sunken)',
        'text': {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        'border': {
          DEFAULT: 'var(--border)',
          hair: 'var(--border-hair)',
        },
        // Primitive ink scale (use sparingly; prefer semantic above)
        'ink': {
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        'paper': {
          1: 'var(--paper-1)',
          2: 'var(--paper-2)',
          3: 'var(--paper-3)',
        },
        // Vermillion seal — the single accent. Rare by design.
        'accent': {
          DEFAULT: 'var(--accent)',
          press: 'var(--accent-press)',
          ink: 'var(--accent-ink)',
          quiet: 'var(--accent-quiet)',
        },

        /* ───────── LEGACY palette (retiring) ───────── */
        // Brand palette
        'cream': {
          DEFAULT: '#F5F3EE',
          50: '#FEFDFB',
          100: '#F9F8F5',
          200: '#F5F3EE',
          300: '#E8E4DB',
          400: '#D4CFC2',
        },
        'sage': {
          DEFAULT: '#7A8F7D',
          50: '#E8EDE9',
          100: '#D1DBD3',
          200: '#A3B7A6',
          300: '#7A8F7D',
          400: '#5D7260',
          500: '#425544',
        },
        'forest': {
          DEFAULT: '#2D4739',
          50: '#E6EBE8',
          100: '#C2CFC6',
          200: '#8FA496',
          300: '#5C7966',
          400: '#2D4739',
          500: '#1A2B22',
        },
        'bark': {
          DEFAULT: '#5C4033',
          50: '#EBE5E1',
          100: '#D4C9C1',
          200: '#A99D92',
          300: '#817264',
          400: '#5C4033',
          500: '#3D2A22',
        },
        'moss': {
          DEFAULT: '#8B9A6D',
          50: '#F0F3EA',
          100: '#E1E7D5',
          200: '#C3CFA9',
          300: '#A5B780',
          400: '#8B9A6D',
          500: '#6B7852',
        },
        'stone': {
          DEFAULT: '#9A8F84',
          50: '#F5F3F1',
          100: '#EBE7E3',
          200: '#D7CFC6',
          300: '#C2B7A9',
          400: '#9A8F84',
          500: '#7A7168',
        },
        'charcoal': {
          DEFAULT: '#2A2D2E',
          50: '#E6E6E7',
          100: '#C2C3C3',
          200: '#8A8B8C',
          300: '#5A5B5C',
          400: '#2A2D2E',
          500: '#1A1C1D',
        },
      },
      fontFamily: {
        // NEW sumi-e type system. font-display + font-body are the canonical
        // semantic names; serif/sans aliases preserve legacy class compatibility
        // (existing components use font-serif on headings; they will re-render
        // in Cardo instead of Playfair — intentional foundation-level swap).
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        serif: ['var(--font-display)'],
        sans: ['var(--font-body)'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        // Editorial display sizes (fluid) for marketing/content pages
        'display-1': ['var(--type-display-1)', { lineHeight: 'var(--leading-display)', letterSpacing: 'var(--tracking-display-large)' }],
        'display-2': ['var(--type-display-2)', { lineHeight: 'var(--leading-display)', letterSpacing: 'var(--tracking-display)' }],
        'display-3': ['var(--type-display-3)', { lineHeight: 'var(--leading-display-tight)', letterSpacing: 'var(--tracking-display)' }],
        'display-4': ['var(--type-display-4)', { lineHeight: 'var(--leading-display-tight)' }],
        'display-5': ['var(--type-display-5)', { lineHeight: '1.2' }],
        // Legacy display sizes used by existing pages
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '9xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.06em' }],
      },
      letterSpacing: {
        tightest: '-0.06em',
        tighter: '-0.04em',
      },
      spacing: {
        // Semantic 4pt scale (sumi-e system). Prefer these over numeric.
        '3xs': 'var(--space-3xs)',
        '2xs': 'var(--space-2xs)',
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        'section': 'var(--section-y)',
        // Legacy custom values
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        reading: 'var(--measure-reading)',
      },
      borderRadius: {
        // Sharper edges for sumi-e (paper, not pillows)
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        // Legacy rounded values stay for unchanged components
        '4xl': '2rem',
      },
      boxShadow: {
        // NEW: ink-line shadows for the sumi-e system
        'ink-line': 'var(--shadow-ink-line)',
        'press': 'var(--shadow-press)',
        'lift': 'var(--shadow-lift)',
        // LEGACY shadows (retiring)
        'soft': '0 2px 15px -3px rgba(45, 71, 57, 0.07), 0 10px 20px -2px rgba(45, 71, 57, 0.04)',
        'soft-lg': '0 10px 40px -3px rgba(45, 71, 57, 0.1), 0 4px 6px -2px rgba(45, 71, 57, 0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(45, 71, 57, 0.06)',
        'warm': '0 4px 20px -2px rgba(92, 64, 51, 0.08), 0 2px 8px -2px rgba(92, 64, 51, 0.04)',
        'dramatic': '0 20px 60px -10px rgba(45, 71, 57, 0.2), 0 8px 20px -6px rgba(92, 64, 51, 0.1)',
      },
      transitionTimingFunction: {
        'out-quart': 'var(--ease-out-quart)',
        'out-expo': 'var(--ease-out-expo)',
        'in-out-quint': 'var(--ease-in-out)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
        deliberate: 'var(--duration-deliberate)',
      },
      zIndex: {
        base: 'var(--z-base)',
        raised: 'var(--z-raised)',
        sticky: 'var(--z-sticky)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'url(\'/images/hero/pattern.svg\')',
      },
    },
  },
  plugins: [],
}
