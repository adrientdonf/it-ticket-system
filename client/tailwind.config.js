/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-container": "#89cff0",
        "on-surface-variant": "#bfc8cd",
        "surface-container": "#1f1f1f",
        "surface-container-lowest": "#0e0e0e",
        "error": "#ffb4ab",
        "on-primary-container": "#005974",
        "surface-container-highest": "#353535",
        "surface-dim": "#131313",
        "on-primary": "#003546",
        "background": "#131313",
        "surface-bright": "#393939",
        "primary": "#bce8ff",
        "surface-container-low": "#1b1b1b",
        "surface-container-high": "#2a2a2a",
        "surface": "#131313",
        "on-background": "#e2e2e2",
        "surface-tint": "#8ad0f1",
        "error-container": "#93000a",
        "outline": "#899297",
        "on-surface": "#e2e2e2",
        "primary-fixed-dim": "#8ad0f1",
      },
      fontFamily: {
        sans: ["Hanken Grotesk", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "display-lg": ["48px", { lineHeight: "56px", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};