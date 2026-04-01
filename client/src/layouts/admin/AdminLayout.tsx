import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUpload,
  FiUser,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import Header from "../../layouts/admin/Header";
import logo from "../../assets/actowizLogo.svg";
import Footer from "../../layouts/admin/Footer";
import Breadcrumb from "../../components/Breadcrumb";
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
  useEffect(() => {
    if (location.pathname.startsWith("/admin/user")) {
      setUserMenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
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
        <div className="h-20 flex items-center px-4 border-b border-gray-800 bg-black ">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="h-18 w-18 rounded-full overflow-hidden flex items-center justify-center bg-purple-100">
              <img
                src={logo}
                alt="App logo"
                className="h-18 w-18 object-contain"
              />
            </div>

            {/* Text */}
            {(sidebarOpen || isMobile) && (
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold text-white">
                  Actowiz
                </span>
                <span className="text-xs text-white">QA Tool</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {/* Dashboard */}
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

          {/* Import */}
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

          {/* ✅ USER MENU HERE */}
          {/* <div>
          
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className={`w-full flex items-center ${
                sidebarOpen || isMobile ? "justify-between" : "justify-center"
              } px-3 py-2 rounded-lg transition
  ${
    location.pathname.startsWith("/admin/user")
      ? "bg-gray-800 text-white"
      : "text-gray-400 hover:bg-gray-800 hover:text-white"
  }`}
            >
              <div className="flex items-center gap-3">
                <FiUser size={18} />
                {(sidebarOpen || isMobile) && <span>User</span>}
              </div>

              {(sidebarOpen || isMobile) && (
                <FiChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

          
            {userMenuOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <NavLink
                  to="/admin/user/list"
                  className={({ isActive }) =>
                    `block px-3 py-2 text-sm rounded-lg transition ${
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
                    `block px-3 py-2 text-sm rounded-lg transition ${
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
          </div> */}
        </nav>
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

        <div className="flex-1 flex flex-col">
          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
            <div className="w-full">
              <Breadcrumb />
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <Footer></Footer>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
