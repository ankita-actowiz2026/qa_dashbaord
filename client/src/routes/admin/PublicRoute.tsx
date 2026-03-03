import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../utils/admin/auth";

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  if (isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
