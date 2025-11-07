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