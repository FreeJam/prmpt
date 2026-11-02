/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Golos Text"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        canvas: rgb('--canvas'),
        surface: rgb('--surface'),
        sunken: rgb('--sunken'),
        hover: rgb('--hover'),

        // совместимость с существующей разметкой (bg-bg-700, text-ink-100 и т. д.)
        bg: { 900: rgb('--canvas'), 800: rgb('--surface'), 700: rgb('--sunken'), 600: rgb('--hover') },

        ink: {
          100: rgb('--ink-100'),
          200: rgb('--ink-200'),
          300: rgb('--ink-300'),
          400: rgb('--ink-400'),
          500: rgb('--ink-500'),
          600: rgb('--ink-600')
        },

        line: { DEFAULT: rgb('--line'), soft: rgb('--line-soft') },

        accent: {
          DEFAULT: rgb('--accent'),
          soft: rgb('--accent-soft'),
          deep: rgb('--accent-deep'),
          ink: rgb('--accent-ink')
        },
        marker: { DEFAULT: rgb('--marker'), soft: rgb('--marker-soft') },
        mint: rgb('--mint'),
        amber: rgb('--amber'),
        rose: rgb('--rose')
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '15px' }],
        xs: ['12px', { lineHeight: '17px' }],
        sm: ['13.5px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '31px' }],
        '3xl': ['31px', { lineHeight: '37px' }],
        '4xl': ['40px', { lineHeight: '45px' }],
        '5xl': ['52px', { lineHeight: '55px' }]
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '11px',
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px'
      },
      // «голый» border/divide берёт цвет из токенов, а не из серой палитры Tailwind по умолчанию
      borderColor: ({ theme }) => ({ DEFAULT: rgb('--line'), ...theme('colors') }),
      divideColor: ({ theme }) => ({ DEFAULT: rgb('--line-soft'), ...theme('colors') }),
      outlineColor: ({ theme }) => ({ DEFAULT: rgb('--accent'), ...theme('colors') }),
      boxShadow: {
        // тени подкрашены под фон, а не чистый чёрный
        hair: '0 1px 0 0 rgb(var(--line) / .9)',
        soft: '0 1px 2px -1px rgb(var(--shadow) / .14), 0 2px 8px -4px rgb(var(--shadow) / .10)',
        panel: '0 2px 4px -2px rgb(var(--shadow) / .12), 0 12px 32px -14px rgb(var(--shadow) / .20)',
        lift: '0 4px 10px -6px rgb(var(--shadow) / .20), 0 22px 48px -24px rgb(var(--shadow) / .28)',
        glow: '0 0 0 3px rgb(var(--marker) / .35)'
      },
      zIndex: { nav: '30', drawer: '50', modal: '60', toast: '70' },
      transitionTimingFunction: {
        out: 'cubic-bezier(.22,.68,.32,1)',
        spring: 'cubic-bezier(.34,1.28,.48,1)'
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
        fade: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slide: { '0%': { opacity: '0', transform: 'translateX(18px)' }, '100%': { opacity: '1', transform: 'none' } },
        draw: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } }
      },
      animation: {
        rise: 'rise .34s cubic-bezier(.22,.68,.32,1) both',
        fade: 'fade .22s ease both',
        slide: 'slide .3s cubic-bezier(.22,.68,.32,1) both',
        draw: 'draw .45s cubic-bezier(.22,.68,.32,1) both'
      }
    }
  },
  plugins: []
};
