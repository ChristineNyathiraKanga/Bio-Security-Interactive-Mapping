import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vf: {
          green: '#00822c',
          'dark-green': '#005e1f',
          blue: '#00BDF0',
        },
      },
    },
  },
  plugins: [],
};
export default config;
