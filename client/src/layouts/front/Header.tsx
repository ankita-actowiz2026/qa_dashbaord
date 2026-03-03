import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX,FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";
const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { logout, user, accessToken } = useAuth();
  
  const handleLogout = async () => {
    try {
     
      const tokenData = JSON.parse(localStorage.getItem("user_data") || "{}");

      await axios.post(BACKEND_URL + "/api/auth/logout",{},{
            headers: {
              Authorization: `Bearer ${tokenData.accessToken}`,
            },
          }
);
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
          QA Dashboard
        </Link>     

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
            </>
          ) : (
            <>              
              <NavLink
                to="/dashboard"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/post/list"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Import
              </NavLink>
              {/* to="/post/ListWithServerPagination" */}
              <NavLink
                to="#"
                className="block px-4 py-2 hover:text-blue-600"
              >
                Reports
              </NavLink>              
              
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-gray-600"> Welcome, <span className="font-semibold text-blue-600">{user?.username || ""}</span></span>              
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600"
                  >
                    <FiLogOut size={18} />
                    <span className="hidden sm:block">Logout</span>
                  </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
