import { Navigate } from "react-router-dom";
//import { isAuthenticated } from "../../utils/admin/auth";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
const ProtectedRoute = ({ children }: Props) => {
  const auth_data: string | null = localStorage.getItem("admin_data");
  const new_auth_data = auth_data ? JSON.parse(auth_data) : null;
  if (!(auth_data && new_auth_data?.accessToken)) {
  
    return (
      <Navigate to="/admin/login" replace state={{ msg: "Please login" }} />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
