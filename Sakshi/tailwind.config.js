/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        darkBlue: '#0F172A',
        background: '#F8FAFC',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.10)',
        panel: '0 30px 80px rgba(15, 23, 42, 0.12)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(10px, -12px, 0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 650ms ease-out both',
        floaty: 'floaty 4.5s ease-in-out infinite',
        drift: 'drift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

