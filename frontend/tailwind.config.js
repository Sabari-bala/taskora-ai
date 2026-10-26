/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          50:  'var(--paper-50)',
          100: 'var(--paper-100)',
          150: 'var(--paper-150)',
          200: 'var(--paper-200)',
          300: 'var(--paper-300)',
          400: 'var(--paper-400)',
        },
        ink: {
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
        },
        signal: {
          50:  'var(--signal-50)',
          100: 'var(--signal-100)',
          300: 'var(--signal-300)',
          500: 'var(--signal-500)',
          600: 'var(--signal-600)',
          700: 'var(--signal-700)',
          900: 'var(--signal-900)',
        },
        ember: {
          50:  'var(--ember-50)',
          100: 'var(--ember-100)',
          500: 'var(--ember-500)',
          600: 'var(--ember-600)',
        },
      },
      letterSpacing: {
          tightest: '-0.02em',
          tighter: '-0.015em',
          tight: '-0.01em',
        },
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],
          'sm': ['0.8125rem', { lineHeight: '1.25rem' }], /* 13px SaaS standard */
          'base': ['0.875rem', { lineHeight: '1.375rem' }], /* 14px SaaS standard */
          'lg': ['1rem', { lineHeight: '1.5rem' }],
          'xl': ['1.125rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.25rem', { lineHeight: '1.875rem' }],
          '3xl': ['1.5rem', { lineHeight: '2rem' }],
        },
        fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15,15,14,.04)',
        sm: '0 1px 3px rgba(15,15,14,.06)',
        md: '0 4px 12px rgba(15,15,14,.06)',
        lg: '0 12px 32px rgba(15,15,14,.08)',
        focus: '0 0 0 3px rgba(79,94,232,.20)',
        'focus-ai': '0 0 0 3px rgba(255,107,66,.20)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(.2,.8,.2,1)',
        spring: 'cubic-bezier(.34,1.4,.64,1)',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '180ms',
        slow: '280ms',
      },
    },
  },
  plugins: [],
}
