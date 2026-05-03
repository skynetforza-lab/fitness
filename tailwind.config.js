/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#dcf3ff",
          200: "#b6e6ff",
          300: "#7dd2ff",
          400: "#3cb8ff",
          500: "#0d9eff",
          600: "#007de6",
          700: "#0064b8",
          800: "#065597",
          900: "#0b487d",
        },
        habit: {
          workout: "#22c55e",
          trainer: "#a855f7",
          steps: "#3b82f6",
          food: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
