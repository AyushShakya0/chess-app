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
        sovereign: {
          canvas: "#0d0f12",
          card: "#14171f",
          cardHover: "#181d27",
          elevated: "#1c202a",
          border: "#252a36",
          borderLight: "rgba(255, 255, 255, 0.08)",
          gold: "#d4a359",
          goldHover: "#e2b768",
          goldLight: "#f0cf85",
          goldDark: "#9c6d42",
          goldMuted: "rgba(212, 163, 89, 0.15)",
        },
        slate: {
          750: "#223147",
          850: "#161f30",
        },
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
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "var(--font-jakarta)", "sans-serif"],
        hero: ["var(--font-cinzel)", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
