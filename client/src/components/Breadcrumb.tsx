import { Link, useLocation } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";
const routeNameMap: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  import_file: "Upload File",
  validation_result: "Validation Result",
  update_profile: "Update Profile",
  change_password: "Change Password",
};

export default function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center mb-4 text-lg text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {/* Home */}

        {pathnames
          .filter((v) => v != "admin")
          .map((value, index) => {
            const to = "/" + pathnames.slice(0, index + 1).join("/");
            const isLast = index === pathnames.length - 1;

            return (
              <li key={to} className="flex items-center gap-1">
                {!isLast ? (
                  <Link
                    to={to}
                    className="font-medium transition hover:text-gray-800"
                  >
                    {routeNameMap[value] || value}
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-800">
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
