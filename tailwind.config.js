/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFD200',
          yellowDark: '#F5B800',
          ink: '#111111',
          sky: '#DCF3FB',
          skyDark: '#C3E9F6',
        },
      },
      fontFamily: {
        display: ['Anton', 'Prompt', 'sans-serif'],
        sans: ['Prompt', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(0,0,0,0.15)',
        card: '0 20px 45px -20px rgba(0,0,0,0.25)',
        glow: '0 0 0 4px rgba(255,210,0,0.35)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        pop: 'pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
