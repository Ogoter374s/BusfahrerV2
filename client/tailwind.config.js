export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        pulsate: 'pulsate 2.2s ease-in-out infinite',
        slideIn: 'slideIn 0.3s ease-out forwards',
        lightSweep: 'lightSweep 3s linear infinite',
        pulseBorder: 'pulseBorder 1.4s infinite ease-in-out',
        jumpPoints: 'jumpPoints 1s infinite ease-in-out',
      },
      fontFamily: {
        times: ['"Times New Roman"', 'serif'],
        luckiest: ['"Luckiest Guy"', 'cursive'],
      },
    },
    screens: {
      sm: '680px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [
    require('tailwindcss-textshadow')
  ],
};