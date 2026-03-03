import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";
const Header = () => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const { logout, user, accessToken } = useAuth();
  const handleLogout = async () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem("auth_data") || "{}");

      await axios.post(BACKEND_URL + "/api/auth/logout", {
        headers: {
          Authorization: `Bearer ${tokenData}`,
        },
      });
    } catch (err) {
      console.error("Server logout failed", err);
    }
    logout();
    navigate("/login", {
      replace: true,
      state: { msg: "Logout successfully", type: "success" },
    });
  };
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-blue-600">
          Demo
        </Link>

        {/* Hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Menu */}
        <nav
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white md:flex gap-6 transition-all duration-300 ${
            open ? "block" : "hidden md:flex"
          }`}
        >
          {!user ? (
            <>
              <NavLink
                to="/login"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="block px-4 py-2 hover:text-blue-600"
              >
                register
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/dashboard"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Home
              </NavLink>
              <NavLink
                to="/post/list"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Post
              </NavLink>
              <NavLink
                to="/post/listWithPagination"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Post with client pagination
              </NavLink>
              <NavLink
                to="/post/ListWithServerPagination"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Post with server pagination
              </NavLink>
              <NavLink
                to="/login"
                onClick={handleLogout}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-md transition ${
                    isActive
                      ? "bg-gray-100 text-blue-600 font-medium"
                      : "hover:bg-red-50 hover:text-red-600"
                  }`
                }
              >
                Logout
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
