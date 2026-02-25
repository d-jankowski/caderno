/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf4ee',
          100: '#f2e6d6',
          200: '#e4ccb0',
          300: '#d1ae88',
          400: '#b98e60',
          500: '#a07248',
          600: '#7c5638',
          700: '#623f28',
          800: '#4a2d1c',
          900: '#321e12',
          950: '#1a0f09',
        },
        paper: {
          DEFAULT: '#faf8f3',
          50: '#faf8f3',
          100: '#f5f1e8',
          200: '#ede8de',
          300: '#d4c9b4',
          400: '#bfad96',
          500: '#a8998a',
        },
        ink: {
          DEFAULT: '#2d2926',
          50: '#f5f3f1',
          100: '#e8e3de',
          200: '#d1c9c0',
          300: '#b5a594',
          400: '#9a8877',
          500: '#7a6e62',
          600: '#5e534a',
          700: '#453c35',
          800: '#302a25',
          900: '#1e1a17',
          950: '#0f0d0a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.ink.DEFAULT'),
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: theme('colors.primary.700'),
              },
            },
            h1: { color: theme('colors.ink.DEFAULT') },
            h2: { color: theme('colors.ink.DEFAULT') },
            h3: { color: theme('colors.ink.DEFAULT') },
            h4: { color: theme('colors.ink.DEFAULT') },
            strong: { color: theme('colors.ink.DEFAULT') },
            code: {
              color: theme('colors.ink.DEFAULT'),
              backgroundColor: theme('colors.paper.200'),
              borderRadius: '3px',
              padding: '0.1em 0.3em',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            pre: {
              backgroundColor: theme('colors.paper.200'),
              color: theme('colors.ink.DEFAULT'),
            },
            blockquote: {
              color: theme('colors.ink.500'),
              borderLeftColor: theme('colors.paper.300'),
            },
            hr: { borderColor: theme('colors.paper.300') },
            'ul > li::before': { backgroundColor: theme('colors.ink.400') },
            'ol > li::before': { color: theme('colors.ink.400') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
