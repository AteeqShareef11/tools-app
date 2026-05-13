export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0C0C10",
          2: "#12121A",
          3: "#1A1A26",
          4: "#22222E",
          5: "#2C2C3A",
        },
        line: {
          1: "rgba(255,255,255,0.06)",
          2: "rgba(255,255,255,0.10)",
          3: "rgba(255,255,255,0.18)",
        },
        accent: {
          DEFAULT: "#C8FB4E",
          hover: "#D4FF66",
          purple: "#7B5CFF",
          teal: "#00E5B4",
          red: "#FF5C7B",
        },
        text: {
          base: "#F0EEF8",
          muted: "#6B6A80",
          subtle: "#9997AE",
        },
      },
      keyframes: {
        up: {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        spin: { to: { transform: "rotate(360deg)" } },
        scanLine: { "0%": { top: "-2px" }, "100%": { top: "100%" } },
        glowPulse: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        up: "up 0.55s cubic-bezier(0.16,1,0.3,1) both",
        "up-1": "up 0.55s 0.08s cubic-bezier(0.16,1,0.3,1) both",
        "up-2": "up 0.55s 0.16s cubic-bezier(0.16,1,0.3,1) both",
        "up-3": "up 0.55s 0.24s cubic-bezier(0.16,1,0.3,1) both",
        "up-4": "up 0.55s 0.32s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 0.4s ease both",
        "spin-slow": "spin 8s linear infinite",
        "spin-med": "spin 3s linear infinite reverse",
        "spin-fast": "spin 2s linear infinite",
        "glow-pulse": "glowPulse 2s ease infinite",
        float: "float 3s ease infinite",
        ticker: "ticker 20s linear infinite",
        scan: "scanLine 1.5s linear infinite",
      },
    },
  },
  plugins: [],
};
