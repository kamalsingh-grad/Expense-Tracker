/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg)',
        card: 'var(--card)',
        card2: 'var(--card-2)',
        line: 'var(--border)',
        line2: 'var(--border-strong)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        brand: { DEFAULT: 'var(--brand)', strong: 'var(--brand-strong)', soft: 'var(--brand-soft)' },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        warning: { DEFAULT: '#f59e0b', soft: 'rgba(245,158,11,0.14)' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow)',
        lift: '0 18px 44px -18px rgba(0,0,0,0.45)',
      },
      borderRadius: { xl2: '1.25rem' },
      maxWidth: { content: '1440px' },
    },
  },
  plugins: [],
};
