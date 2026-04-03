/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#3F4D67",
        accent: "#1dc4e9",
        accentHover: "#15a8c8",

        sidebarHover: "#424649",
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
