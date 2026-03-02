import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0B0B0C", // Deep Black
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#1A1A1D", // Charcoal
          foreground: "#Eaeaea",
        },
        accent: {
          DEFAULT: "#D4AF37", // Gold
          foreground: "#000000",
        },
      },
    },
  },
  plugins: [],
};
export default config;
