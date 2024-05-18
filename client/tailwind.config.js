/** @type {import('tailwindcss').Config} */
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  content: [
    "./index.html",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/App.jsx",
    "./src/main.jsx",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    tailwindcss,
    autoprefixer,
    // Add other plugins here if needed
  ],
};