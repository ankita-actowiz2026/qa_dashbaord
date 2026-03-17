import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { FiUsers, FiUserPlus, FiHome, FiChevronDown } from "react-icons/fi";
import Header from "../../layouts/admin/Header";
import { TbFileReport } from "react-icons/tb";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // default open
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin/user")) {
      setUserMenuOpen(true);
    }
  }, [location.pathname]);

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
      isActive
        ? "bg-gray-800 text-white"
        : "text-gray-300 hover:bg-gray-800 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-gray-200 h-full transition-all duration-300
        ${sidebarOpen ? "w-64" : "w-0 md:w-16"} overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          {sidebarOpen && (
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => navItemClass(isActive)}
          >
            <FiHome size={18} />
            {sidebarOpen && "Dashboard"}
          </NavLink>

          <NavLink
            to="/admin/import_file"
            className={({ isActive }) => navItemClass(isActive)}
          >
            <FiHome size={18} />
            {sidebarOpen && "Import"}
          </NavLink>

          {/* User Menu */}
          <div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <FiUsers size={18} />
                {sidebarOpen && "User"}
              </div>
              {sidebarOpen && (
                <FiChevronDown
                  size={16}
                  className={`transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {userMenuOpen && sidebarOpen && (
              <div className="ml-8 mt-2 space-y-1 text-sm">
                <NavLink
                  to="/admin/user"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  User List
                </NavLink>

                <NavLink
                  to="/admin/user/add"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  Add User
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/admin/report"
            className={({ isActive }) => navItemClass(isActive)}
          >
            <TbFileReport size={18} />
            {sidebarOpen && "Report"}
          </NavLink>
        </nav>
      </aside>

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        <Header
          title="Admin Dashboard"
          userName="Admin"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} // 🔥 Toggle
          onLogout={() => console.log("logout")}
        />

        <main className="flex-1 p-6 overflow-auto bg-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
