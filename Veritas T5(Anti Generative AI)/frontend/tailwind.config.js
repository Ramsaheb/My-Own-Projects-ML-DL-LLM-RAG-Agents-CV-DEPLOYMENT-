/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'veritas': {
          'dark': '#0a0a0a',
          'darker': '#050505',
          'accent': '#22c55e',
          'accent-dim': '#16a34a',
          'danger': '#ef4444',
          'muted': '#6b7280',
          'border': '#1f2937',
          'surface': '#111111',
          'surface-hover': '#1a1a1a',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
