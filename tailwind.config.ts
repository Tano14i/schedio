import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF6FA",
          100: "#DCECF5",
          200: "#B8D8EA",
          300: "#8DBFD9",
          400: "#5E9EC2",
          500: "#1F4D6B",
          600: "#16384E",
          700: "#122E40",
          800: "#0D2230",
          900: "#091721"
        },
        success: {
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A6F4C5",
          300: "#6CE9A6",
          400: "#32D583",
          500: "#2FB36F",
          600: "#24945C",
          700: "#1C7348",
          800: "#175C3A",
          900: "#134C30"
        },
        warning: {
          50: "#FFF8EB",
          100: "#FDECC8",
          200: "#FBD98F",
          300: "#F7C35A",
          400: "#F2A93B",
          500: "#DC8A1F",
          600: "#B86E17",
          700: "#955513",
          800: "#794412",
          900: "#633911"
        },
        danger: {
          50: "#FEF3F2",
          100: "#FEE4E2",
          200: "#FECDCA",
          300: "#FDA29B",
          400: "#F97066",
          500: "#D95C5C",
          600: "#B54747",
          700: "#933737",
          800: "#7A2E2E",
          900: "#651F1F"
        },
        neutral: {
          0: "#FFFFFF",
          50: "#F7F9FB",
          100: "#EEF2F6",
          200: "#D9E1E7",
          300: "#C1CBD4",
          400: "#94A3B0",
          500: "#667684",
          600: "#4D5B67",
          700: "#36424C",
          800: "#1C2731",
          900: "#111827"
        },
        brand: {
          50: "#EEF6FA",
          100: "#DCECF5",
          200: "#B8D8EA",
          300: "#8DBFD9",
          400: "#5E9EC2",
          500: "#1F4D6B",
          600: "#16384E",
          700: "#122E40",
          800: "#0D2230",
          900: "#091721"
        },
        ink: "#1C2731"
      },
      boxShadow: {
        panel: "0 12px 32px rgba(16, 24, 40, 0.10)",
        soft: "0 4px 12px rgba(16, 24, 40, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
