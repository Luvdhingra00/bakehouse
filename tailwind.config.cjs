/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#fffdf9", 100: "#fbf6ee", 200: "#f4ead9" },
        blush: { 50: "#fff3f5", 100: "#ffe3e8", 200: "#fbc8d3", 400: "#f08fa5", 500: "#e56b8a" },
        cocoa: { 300: "#b99478", 400: "#9a6f52", 500: "#7b523a", 700: "#4a2f20", 900: "#2b1a10" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(74, 47, 32, 0.08)",
        lift: "0 14px 40px rgba(74, 47, 32, 0.14)",
      },
    },
  },
  plugins: [],
};
