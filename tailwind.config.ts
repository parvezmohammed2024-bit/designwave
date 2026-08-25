import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#F7F4ED",
        // Brand palette extracted from the Design Wave logo.
        // brand = the "D" (violet -> magenta-purple gradient)
        // wave  = the wave/"W" (cyan -> royal blue gradient)
        // Text on light backgrounds must use 700+; 300-500 are for
        // fills/accents only (AA contrast rule).
        brand: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#9333EA",
          700: "#7A22C9",
          800: "#6B21A8",
          900: "#4C1D95",
          DEFAULT: "#7A22C9",
        },
        wave: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0B78D6",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          DEFAULT: "#0EA5E9",
        },
      },
      fontFamily: {
        bangla: ["var(--font-bangla)", "sans-serif"],
      },
      // Tailwind's default text-* line-heights (down to 1.0 at text-6xl)
      // clip Bangla ascenders/descenders — every size gets Bangla-safe leading.
      fontSize: {
        "2xl": ["1.5rem", { lineHeight: "1.55" }],
        "3xl": ["1.875rem", { lineHeight: "1.5" }],
        "4xl": ["2.25rem", { lineHeight: "1.45" }],
        "5xl": ["3rem", { lineHeight: "1.4" }],
        "6xl": ["3.75rem", { lineHeight: "1.35" }],
      },
      lineHeight: {
        bangla: "1.75",
        "bangla-tight": "1.45",
      },
      transitionTimingFunction: {
        paper: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
