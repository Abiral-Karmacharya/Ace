/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        page: '#0b1214',
        card: '#121e21',
        cardborder: '#293a3e',
        primarytext: '#edf3ef',
        mutedtext: '#91a5a7',
        skyblue: '#a6edce',
        electric: '#367d69',
        gold: '#e6c388',
        success: '#8bd9b1',
        danger: '#ef9292',
        inputbg: '#0d171a',
      },
      animation: {
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        'scanline': 'scanline 4s linear infinite',
        'flicker': 'flicker 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 4px #8bd9b1, 0 0 8px #8bd9b1' },
          '50%': { boxShadow: '0 0 10px #8bd9b1, 0 0 20px #8bd9b1' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 4px #ef9292, 0 0 8px #ef9292' },
          '50%': { boxShadow: '0 0 10px #ef9292, 0 0 20px #ef9292' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(2000%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '55%': { opacity: '1' },
          '70%': { opacity: '0.7' },
          '75%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scaleX(0.3)', opacity: '0.4' },
          '25%': { transform: 'scaleX(1)', opacity: '1' },
          '50%': { transform: 'scaleX(0.5)', opacity: '0.6' },
          '75%': { transform: 'scaleX(0.9)', opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
}
