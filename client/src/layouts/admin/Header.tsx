import axios from "axios";
import { FiMenu, FiLogOut } from "react-icons/fi";
import { useNavigate, NavLink } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface HeaderProps {
  title: string;
  userName: string;
  onMenuClick: () => void;
  onLogout: () => void;
}

const Header = ({ title, userName, onMenuClick, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await axios.post(
        BACKEND_URL + "/admin/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );
      localStorage.removeItem("admin_data");
    } catch (err) {
      console.error("Server logout failed", err);
    }
    navigate("/admin/login", {
      replace: true,
      state: { msg: "Logout successfully", type: "success" },
    });
  };
  return (
    <header className="flex items-center justify-between bg-white shadow px-6 py-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <FiMenu size={22} className="text-gray-700" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-gray-800">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-gray-600">Hi, {userName}</span>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600"
        >
          <FiLogOut size={18} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
