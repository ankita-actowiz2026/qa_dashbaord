import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiHome,
  FiUpload,
  FiUser,
  FiChevronDown,
  FiLogOut,
  FiMenu,
} from "react-icons/fi";
import { MdClose } from "react-icons/md";

import logo from "../../assets/actowizLogo.svg";
import Header from "../../layouts/admin/Header";
import Footer from "../../layouts/admin/Footer";
import Breadcrumb from "../../components/Breadcrumb";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`
          bg-sidebar text-gray-200 flex flex-col shadow-2xl
          transition-all duration-300 ease-in-out
          ${
            isMobile
              ? `fixed top-0 left-0 h-full z-50 w-64 transform ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : sidebarOpen
                ? "w-80"
                : "w-20 hover:w-80 group"
          }
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-24 px-4 bg-sidebar">
          <div className="flex items-center gap-3 w-full">
            {/* Logo Icon */}
            <div className="flex items-center justify-center w-16 h-16 overflow-hidden rounded-full bg-white flex-shrink-0">
              <img
                src={logo}
                alt="App logo"
                className="object-contain w-full h-full scale-125"
              />
            </div>

            {/* Text - with animation for collapsed state */}
            <div
              className={`
                flex items-center justify-between flex-1
                overflow-hidden transition-all duration-300
                ${
                  sidebarOpen || isMobile
                    ? "max-w-full opacity-100 translate-x-0"
                    : "max-w-0 opacity-0 -translate-x-2 group-hover:max-w-full group-hover:opacity-100 group-hover:translate-x-0"
                }
              `}
            >
              <div className="flex flex-col w-full">
                <span className="m-0 font-bold uppercase text-4xl leading-snug text-left">
                  Actowiz
                </span>
                <span className="text-lg text-white font-medium text-left">
                  QA Tool
                </span>
              </div>
              {/* Close Icon - only show on mobile or when sidebar is open */}
              {(isMobile || sidebarOpen) && (
                <MdClose
                  size={22}
                  onClick={() => setSidebarOpen(false)}
                  className="cursor-pointer text-gray-300 hover:text-accent flex-shrink-0 ml-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`
            flex-1 py-6 space-y-1
            transition-all duration-300
            ${sidebarOpen || isMobile ? "overflow-y-auto" : "overflow-visible"}
          `}
        >
          {/* Dashboard Link - FIXED: Removed duplicate tooltip */}
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center w-full ${
                sidebarOpen || isMobile
                  ? "justify-start px-4"
                  : "justify-center px-2 group-hover:justify-start group-hover:px-4"
              } gap-3 py-2.5 rounded-md transition-all duration-200 relative
              ${isActive ? "text-accent" : "text-gray-300 hover:text-accent"}`
            }
          >
            <FiHome size={22} className="flex-shrink-0" />
            {/* Only show text when sidebar is open OR on hover (via group-hover) */}
            <span
              className={`
                text-xl font-normal whitespace-nowrap
                transition-all duration-200
                ${
                  sidebarOpen || isMobile
                    ? "inline-block opacity-100"
                    : "hidden group-hover:inline-block group-hover:opacity-100"
                }
              `}
            >
              Dashboard
            </span>
          </NavLink>

          {/* Upload File Link - FIXED: Removed duplicate tooltip */}
          <NavLink
            to="/admin/import_file"
            className={({ isActive }) =>
              `flex items-center w-full ${
                sidebarOpen || isMobile
                  ? "justify-start px-4"
                  : "justify-center px-2 group-hover:justify-start group-hover:px-4"
              } gap-3 py-2.5 rounded-md transition-all duration-200 relative
              ${isActive ? "text-accent" : "text-gray-300 hover:text-accent"}`
            }
          >
            <FiUpload size={22} className="flex-shrink-0" />
            {/* Only show text when sidebar is open OR on hover (via group-hover) */}
            <span
              className={`
                text-xl font-normal whitespace-nowrap
                transition-all duration-200
                ${
                  sidebarOpen || isMobile
                    ? "inline-block opacity-100"
                    : "hidden group-hover:inline-block group-hover:opacity-100"
                }
              `}
            >
              Upload File
            </span>
          </NavLink>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 duration-200 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 bg-gray-white">
        <Header />

        <div className="flex flex-col flex-1">
          {/* Content */}
          <main className="flex-1 p-4 overflow-y-auto md:p-6 lg:p-8">
            <div className="">
              <Breadcrumb />
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Mobile Toggle Button */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3 bg-sidebar text-white rounded-full shadow-lg hover:bg-[#2A374D] transition-all duration-200 md:hidden"
        >
          <FiMenu size={24} />
        </button>
      )}
    </div>
  );
};

export default AdminLayout;
