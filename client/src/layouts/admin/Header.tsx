import { useState } from "react";
import { FiLogOut, FiUser, FiSettings, FiChevronDown } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useRef, useEffect } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleLogout = async () => {
    try {
      await axios.post(
        BACKEND_URL + "/admin/auth/logout",
        {},
        { withCredentials: true },
      );

      toast.success("Logout successfully"); // ✅ toaster here
    } catch (err) {
      console.error("Server logout failed", err);
      toast.error("Logout failed"); // optional error toast
    }

    logout();

    navigate("/admin/login", {
      replace: true,
    });
  };
  return (
    <header className=" flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
      {/* Left */}
      <div />
      {/* Center Title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl font-semibold text-gray-800">
        QA Tool
      </h1>

      {/* Right Section */}
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl
             transition-all duration-200 ease-out
             hover:bg-gray-100 hover:shadow-md
             hover:-translate-y-[1px]
             active:scale-[0.97]
             focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <div
            className="w-8 h-8 flex items-center justify-center rounded-full
               bg-gray-200 text-gray-700 font-semibold
               transition-all duration-200
               group-hover:bg-gray-300 group-hover:scale-105"
          >
            {user?.first_name?.charAt(0) || "U"}
          </div>

          <span className="hidden sm:block text-gray-700 font-medium">
            {user?.first_name}
          </span>

          <FiChevronDown
            className={`text-gray-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20">
            {/* Username */}
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              Signed in as
              <p className="font-semibold text-gray-800 truncate">
                {user?.first_name}
              </p>
            </div>

            {/* Profile */}
            {/* <button
              onClick={() => {
                setOpen(!open);
                navigate("/admin/update_profile");
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              <FiUser />
              Profile
            </button> */}

            {/* Change Password */}
            <button
              onClick={() => {
                setOpen(!open);
                navigate("/admin/change_password");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl 
             transition-all duration-200 
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] 
             active:scale-[0.98]"
            >
              <FiSettings />
              Change Password
            </button>

            {/* Divider */}
            <div className="my-1 border-t" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl 
             transition-all duration-200 
             hover:bg-gray-100 hover:shadow-sm hover:scale-[1.02] 
             active:scale-[0.98]
              text-red-500"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
