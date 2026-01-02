/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent - golden/cream
        primary: '#D0BB95',
        // Editor colors
        editor: {
          bg: '#1d1a15',
          panel: '#152228',
          input: '#1e2e36',
          border: '#2a3b45',
          accent: '#D0BB95',
          highlight: '#D0BB95',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(208, 187, 149, 0.4)' },
          '50%': { boxShadow: '0 0 25px rgba(208, 187, 149, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
