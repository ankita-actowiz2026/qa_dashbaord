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
/* <div className="w-64 h-screen bg-sidebar text-white p-4">
  Sidebar Content
</div>

<button className="w-full text-left px-4 py-2 rounded-lg hover:bg-sidebar-hover">
  Dashboard
</button>
<button className="w-full text-left px-4 py-2 rounded-lg bg-sidebar-active">
  Active Menu
</button> */
