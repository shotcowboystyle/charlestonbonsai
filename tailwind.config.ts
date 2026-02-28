import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        cream: {
          DEFAULT: '#F5F3EE',
          50: '#FEFDFB',
          100: '#F9F8F5',
          200: '#F5F3EE',
          300: '#E8E4DB',
          400: '#D4CFC2',
        },
        sage: {
          DEFAULT: '#7A8F7D',
          50: '#E8EDE9',
          100: '#D1DBD3',
          200: '#A3B7A6',
          300: '#7A8F7D',
          400: '#5D7260',
          500: '#425544',
        },
        forest: {
          DEFAULT: '#2D4739',
          50: '#E6EBE8',
          100: '#C2CFC6',
          200: '#8FA496',
          300: '#5C7966',
          400: '#2D4739',
          500: '#1A2B22',
        },
        bark: {
          DEFAULT: '#5C4033',
          50: '#EBE5E1',
          100: '#D4C9C1',
          200: '#A99D92',
          300: '#817264',
          400: '#5C4033',
          500: '#3D2A22',
        },
        moss: {
          DEFAULT: '#8B9A6D',
          50: '#F0F3EA',
          100: '#E1E7D5',
          200: '#C3CFA9',
          300: '#A5B780',
          400: '#8B9A6D',
          500: '#6B7852',
        },
        stone: {
          DEFAULT: '#9A8F84',
          50: '#F5F3F1',
          100: '#EBE7E3',
          200: '#D7CFC6',
          300: '#C2B7A9',
          400: '#9A8F84',
          500: '#7A7168',
        },
        charcoal: {
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
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
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
        'hero-pattern': "url('/images/hero/pattern.svg')",
      },
    },
  },
  plugins: [],
}
