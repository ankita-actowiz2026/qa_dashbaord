import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";
const routeNameMap: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  import_file: "Import File",
  validation_result: "Validation Result",
  update_profile: "Update Profile",
  change_password: "Change Password",
};

export default function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      <ol className="flex items-center gap-1 flex-wrap">
        {/* Home */}

        {pathnames.map((value, index) => {
          const to = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="flex items-center gap-1">
              {!isLast ? (
                <Link
                  to={to}
                  className="hover:text-gray-800 transition font-medium"
                >
                  {routeNameMap[value] || value}
                </Link>
              ) : (
                <span className="text-gray-800 font-semibold">
                  {routeNameMap[value] || value}
                </span>
              )}

              {!isLast && (
                <FiChevronRight size={14} className="text-gray-400" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
