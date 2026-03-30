import { Link, useLocation } from "react-router-dom";

const routeNameMap: Record<string, string> = {
  admin: "Dashboard",
  import_file: "Import File",
  validation_result: "Validation Result",
};

export default function Breadcrumb() {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <ol className="flex items-center gap-2 flex-wrap">
        {pathnames.map((value, index) => {
          const to = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;

          return (
            <li key={to} className="flex items-center gap-2">
              {!isLast ? (
                <Link to={to} className="hover:text-gray-800 transition">
                  {routeNameMap[value] || value}
                </Link>
              ) : (
                <span className="text-gray-800 font-medium">
                  {routeNameMap[value] || value}
                </span>
              )}

              {!isLast && <span>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
