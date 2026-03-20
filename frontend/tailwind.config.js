/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Connect Brand Colors
        'brand': {
          // Primary - Connect Gold
          primary: '#F7C03E',     // Rich gold from Connect logo
          'primary-dark': '#B8860B', // Dark gold for hovers

          // Text Colors
          header: '#1A1A1A',      // Near black / charcoal for headings
          text: '#4A4A4A',        // Medium gray for body text
          'text-light': '#6B6B6B', // Light gray for secondary text

          // Background Colors (Warm Neutrals)
          bg: '#FFFBEF',          // Very light straw/gold
          'bg-cream': '#FAF8F5',  // Warm off-white / cream
          'bg-sand': '#F2EDE6',   // Light warm gray / sand
          'bg-taupe': '#E8E3DB',  // Warm gray / taupe
          'bg-dark': '#2C2C2C',   // Dark charcoal for hero/footer

          // Legacy/Optional Accent Colors
          accent: '#18B4DD',      // Cyan for secondary accents (optional)
          pink: '#F81889',        // Keep for Beats branding only
          peach: '#FEB95F',       // Keep for Beats branding only

          // Neutral Grays (for borders, dividers)
          neutral: {
            100: '#E8E3DB',       // Warm taupe
            200: '#D4CFC7',       // Medium warm gray
            300: '#C0BAB2',       // Darker warm gray
            400: '#A8A39A',       // Deep warm gray
          },
        },
      },
      fontFamily: {
        'festival': ['"rig-solid-bold-reverse"', 'Impact', 'Arial Black', 'sans-serif'], // Only for collateral/print (not used on site)
        'title': ['"Montserrat"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Arial', 'sans-serif'], // For all web titles
        'slogan': ['"Bebas Neue"', 'Impact', 'Arial Black', 'sans-serif'], // For taglines and slogans
        'logo': ['"Aharoni Bold"', 'Aharoni', 'Arial Black', 'Arial', 'sans-serif'], // For matching the Connect logo
        'horizon': ['"Horizon"', 'Impact', 'Arial Black', 'sans-serif'], // Horizon font for major headers
      },
    },
  },
}

