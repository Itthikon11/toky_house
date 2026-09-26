/** @type {import('tailwindcss').Config} */
// Design tokens ของ TOKYO HOUSE — สี/ฟอนต์/เงา ใช้ผ่าน class เท่านั้น ห้ามใส่ค่าสีตรง ๆ ในหน้า
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFD200', //   สีหลัก: ปุ่มหลัก, ไฮไลต์
          yellowDark: '#F5B800', // hover / focus ring
          yellowSoft: '#FFF6CC', // พื้นหลังข้อความแจ้งเตือนเบา ๆ
          ink: '#111111', //      ตัวอักษรหลัก, ปุ่มรอง
          sky: '#DCF3FB', //      พื้นหลังส่วนรอง
          skyDark: '#C3E9F6',
        },
      },
      fontFamily: {
        display: ['Anton', 'Prompt', 'sans-serif'],
        sans: ['Prompt', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 20px -10px rgba(0,0,0,0.18)',
        card: '0 16px 40px -22px rgba(0,0,0,0.28)',
        glow: '0 0 0 4px rgba(255,210,0,0.35)',
        bar: '0 -8px 24px -12px rgba(0,0,0,0.18)',
      },
      spacing: {
        nav: '64px', //    ความสูงแถบเมนูล่าง (มือถือ)
        header: '64px', // ความสูงแถบบน
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        pop: 'pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
