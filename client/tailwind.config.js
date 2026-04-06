/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#3F4D67", //menu bg color
        sidebarHover: "#424649",
        accent: "#1dc4e9", //active menu color
        accentHover: "#15a8c8",
        sidebarSecondary: "#3B82F6", //secondary text color
        sidebarSecondaryHover: "#2563EB", //active menu color
      },
    },
  },
  plugins: [],
};
/* bg-gradient-to-r from-[#3F4D67] to-[#424649]
bg-gradient-to-r from-sidebarSecondary to-sidebarSecondaryHover
 */
