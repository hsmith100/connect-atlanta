/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Beats on the Block Brand Colors
        'brand': {
          // Primary - Sunkiss Yellow
          primary: '#FCBC3A',
          'primary-dark': '#C99620',

          // Text Colors
          header: '#1A1A1A',
          text: '#4A4A4A',
          'text-light': '#6B6B6B',

          // Background Colors
          bg: '#FEEAD6',          // Relaxed Tan (page base)
          'bg-cream': '#FAF5F0',  // Off White
          'bg-sand': '#F7AF7F',   // Vibin' Peach (warmer sand)
          'bg-taupe': '#F0E8DC',  // Relaxed Tan mid
          'bg-dark': '#2C2C2C',

          // Brand Accent Colors
          accent: '#40BCB7',      // Open Sky Aqua
          pink: '#EA4E9A',        // Pulse Pink
          peach: '#F7AF7F',       // Vibin' Peach
          tan: '#FEEAD6',         // Relaxed Tan
          green: '#3AAA45',       // Valley Green

          // Neutral Grays (for borders, dividers)
          neutral: {
            100: '#FEEAD6',       // Relaxed Tan
            200: '#F0E8DC',       // Relaxed Tan mid
            300: '#DDD5C9',
            400: '#C5BDB1',
          },
        },
      },
      fontFamily: {
        'festival': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
        'title': ['"Bricolage Grotesque"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'logo': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
        'horizon': ['"Anton"', 'Impact', 'Arial Black', 'sans-serif'],
      },
    },
  },
}

