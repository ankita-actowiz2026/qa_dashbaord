import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { FiHome, FiUpload } from "react-icons/fi";
import Header from "../../layouts/admin/Header";
import logo from "../../assets/actowizLogo.svg";

const isMobile = window.innerWidth < 640;
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // default open
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (location.pathname.startsWith("/admin/user")) {
      setUserMenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}-
      <aside
        className={`
        bg-gray-900 text-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
        ${
          isMobile
            ? `fixed top-0 left-0 h-full z-50 w-64 transform ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : sidebarOpen
              ? "w-64"
              : "w-20"
        }
      `}
      >
        {/* Logo */}
        <div className="h-24 flex items-center px-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-full overflow-hidden bg-white flex items-center justify-center">
              <img
                src={logo}
                alt="App logo"
                className="h-15 w-15 object-contain scale-110"
              />
            </div>

            {(sidebarOpen || isMobile) && (
              <span className="text-white text-lg font-bold whitespace-nowrap">
                QA Tool
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center ${
                sidebarOpen || isMobile ? "justify-start" : "justify-center"
              } gap-3 px-3 py-2 rounded-lg transition
            ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`
            }
          >
            <FiHome size={18} />
            {(sidebarOpen || isMobile) && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/admin/import_file"
            className={({ isActive }) =>
              `flex items-center ${
                sidebarOpen || isMobile ? "justify-start" : "justify-center"
              } gap-3 px-3 py-2 rounded-lg transition
            ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`
            }
          >
            <FiUpload size={18} />
            {(sidebarOpen || isMobile) && <span>Import</span>}
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          {(sidebarOpen || isMobile) && "© 2026 Company"}
        </div>
      </aside>
      {/* Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
