import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState,useEffect } from "react";
import { FiMenu, FiX,FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import axios from "axios";
const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  //const { logout, user, accessToken } = useAuth();
  const [user, setUser] = useState<any>(null);

  const fetchMe = async () => {
    try {
      const res = await axios.get(
        BACKEND_URL + "/api/auth/profile",
        { withCredentials: true }
      );

      setUser(res.data.data);
    } catch (error) {
      console.log("Not logged in");
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(BACKEND_URL + "/api/auth/logout",{},{withCredentials: true,});
    } catch (err) {
      console.error("Server logout failed", err);
    }
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

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex items-center text-gray-600 hover:text-blue-600 transition-colors"
        >
          {open ? <FiMenu size={22} className="text-gray-700" /> : <FiMenu size={24} />}
        </button>

        <nav
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white md:flex gap-6 transition-all duration-300 ${
            open ? "block" : "hidden md:flex"
          }`}
        >
          {!user ? (
            <>
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
                    : "block px-4 py-2 text-gray-600 hover:text-blue-600"
                }
              >
                Login
              </NavLink>              
            </>
          ) : (
            <>              
              <NavLink
                to="/dashboard"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
                    : "block px-4 py-2 text-gray-600 hover:text-blue-600"
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/import_file"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
                    : "block px-4 py-2 text-gray-600 hover:text-blue-600"
                }
              >
                Import
              </NavLink>            
              <NavLink
                to="/report"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600"
                    : "block px-4 py-2 text-gray-600 hover:text-blue-600"
                }
              >
                Reports
              </NavLink>              
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                  <span className="text-gray-700">Welcome,</span>
                  <span className="font-bold text-blue-600">{user?.name || ""}</span>
                </div>              
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors duration-200"
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
