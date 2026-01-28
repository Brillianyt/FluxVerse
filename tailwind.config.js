/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Luma Design System - Integrated from luma_event_card.txt
        luma: {
          base: "var(--page-bg-color)", // #f7f8f9 or #212325 in dark
          card: "var(--card-bg-color)", // glassy
          "card-hover": "var(--hover-bg-color)",
          border: "var(--divider-color)",
          
          // Grayscale
          "gray-10": "var(--gray-10)",
          "gray-20": "var(--gray-20)",
          "gray-30": "var(--gray-30)",
          "gray-40": "var(--gray-40)",
          "gray-50": "var(--gray-50)",
          "gray-60": "var(--gray-60)",
          "gray-70": "var(--gray-70)",
          "gray-80": "var(--gray-80)",
          "gray-90": "var(--gray-90)",
          "gray-100": "var(--gray-100)",
          
          // Brand
          brand: "var(--brand-color)",
          cranberry: "var(--cranberry-50)",
          
          // Text hierarchy
          text: {
            primary: "var(--primary-color)",
            secondary: "var(--secondary-color)",
            tertiary: "var(--tertiary-color)",
          }
        },
        primary: {
          DEFAULT: "var(--brand-color)", // Use Cranberry as primary
          foreground: "#FFFFFF",
          50: "#fef4f9",
          100: "#fde2ef",
          200: "#fcc6de",
          300: "#f98dbe",
          400: "#f6539d",
          500: "#f31a7c",
          600: "#d5176d",
          700: "#b6145d",
          800: "#98104e",
          900: "#790d3e",
        },
        background: "var(--page-bg-color)", 
        foreground: "var(--primary-color)",
      },
      borderRadius: {
        sm: "var(--border-radius)",   // Buttons, small tags -> 8px
        DEFAULT: "var(--card-border-radius)", // Standard cards -> 12px
        lg: "16px",  // Large containers
      },
      fontFamily: {
        sans: ['var(--font)'],
      },
      letterSpacing: {
        tight: '-0.01em', // Luma heading style
      },
      boxShadow: {
        'luma-hover': 'var(--light-shadow-sm)',
        'luma': 'var(--light-shadow-sm)', // Standard shadow
      },
      maxWidth: {
        'extra-wide': 'var(--max-width-extra-wide-page)',
      },
      animation: {
        blob: "blob 7s infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 40s linear infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "200% 0",
          },
          "100%": {
            backgroundPosition: "-200% 0",
          },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
