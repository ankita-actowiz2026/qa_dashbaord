import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type Props = {
  children?: React.ReactNode;
};
const PublicRoute = ({ children }: Props) => {
  // const auth_data: string | null = localStorage.getItem("auth_data");
  // if (auth_data) {
  const { accessToken, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;
