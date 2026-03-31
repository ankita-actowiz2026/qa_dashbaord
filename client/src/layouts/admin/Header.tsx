import { useState } from "react";
import { FiLogOut, FiUser, FiSettings, FiChevronDown } from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      <div className="relative">
        {/* Profile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold">
            {user?.first_name?.charAt(0) || "U"}
          </div>

          <span className="hidden sm:block text-gray-700 font-medium">
            {user?.first_name}
          </span>

          <FiChevronDown className="text-gray-500" />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-20">
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
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
            >
              <FiSettings />
              Change Password
            </button>

            {/* Divider */}
            <div className="my-1 border-t" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
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
