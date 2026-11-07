import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        board: {
          classicLight: "#ebecd0",
          classicDark: "#739552",
          woodLight: "#e9cfad",
          woodDark: "#ad7d52",
          glassLight: "#2c3e50",
          glassDark: "#1a252f",
          neonLight: "#1e293b",
          neonDark: "#0f172a",
          highlight: "rgba(255, 255, 0, 0.4)",
          danger: "rgba(239, 68, 68, 0.5)",
          moveDot: "rgba(0, 0, 0, 0.2)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

