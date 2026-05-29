import type { Config } from "tailwindcss";

// In Tailwind v4, design tokens are defined in globals.css via @theme.
// This file is kept only for content path configuration.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./stores/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
