import axios from "axios";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Header = () => {
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
    <header className="relative flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
      {/* Left Section */}
      <div>{/* keep empty or add logo */}</div>

      {/* Center Title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-xl font-semibold text-gray-800">
        QA Tool
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-gray-600 font-semibold">
          Hi, {user?.name || ""}
        </span>

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
