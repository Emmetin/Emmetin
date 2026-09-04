import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#ea580c",
          600: "#c2410c",
          700: "#9a3412",
        },
      },
    },
  },
  plugins: [],
};

export default config;
