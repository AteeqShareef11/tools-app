/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        cab: ["Cabinet Grotesk", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          DEFAULT: "#060610",
          50: "#0a0a1a",
          100: "#0f0f1f",
          200: "#14142a",
          300: "#1a1a35",
          400: "#222240",
        },
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        gradFlow: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        scanLine: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        matchFill: {
          from: { width: "0%" },
        },
        borderPulse: {
          "0%,100%": { borderColor: "rgba(99,102,241,0.3)" },
          "50%": { borderColor: "rgba(99,102,241,0.7)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        shimmer: "shimmer 1.6s infinite",
        "grad-flow": "gradFlow 5s ease infinite",
        "scan-line": "scanLine 2s linear infinite",
        "spin-slow": "spinSlow 3s linear infinite",
        pulse: "pulse 1.5s ease infinite",
        "match-fill": "matchFill 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "border-pulse": "borderPulse 2s ease infinite",
      },
      backgroundSize: {
        200: "200% 200%",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99,102,241,0.2), 0 0 24px rgba(99,102,241,0.06)",
        "glow-lg":
          "0 0 0 1px rgba(99,102,241,0.25), 0 0 40px rgba(99,102,241,0.1)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
