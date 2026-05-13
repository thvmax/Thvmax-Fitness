import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#050506",
          1: "#0A0A0C",
          2: "#111114",
          3: "#18181C",
          4: "#222228",
        },
        accent: {
          red: "#E63946",
          blue: "#457B9D",
          green: "#2A9D8F",
          orange: "#E76F51",
          purple: "#9B5DE5",
          gold: "#FFB400",
          mint: "#00C896",
        },
        text: {
          primary: "#E8E8EC",
          secondary: "#8888A0",
          muted: "#55556A",
          dim: "#333344",
        },
      },
      fontFamily: {
        display: ['"Instrument Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        body: ['"DM Sans"', "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
