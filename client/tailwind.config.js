/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        guardant: {
          navy:   '#0B2545',
          blue:   '#1B5FA8',
          teal:   '#00828A',
          sage:   '#4A7B6F',
          stone:  '#F5F3EF',
          slate:  '#6B7280',
          border: '#E2E5EA',
        },
        urgency: { p0:'#B91C1C', p1:'#C2410C', p2:'#1D4ED8', p3:'#15803D' }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        card:  '0 1px 3px rgba(11,37,69,0.06), 0 1px 2px rgba(11,37,69,0.04)',
        panel: '0 4px 16px rgba(11,37,69,0.08)',
      }
    }
  },
  plugins: [],
}
