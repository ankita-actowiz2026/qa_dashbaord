import { Routes, Route } from "react-router-dom";
import AdminLayout from "../../layouts/admin/AdminLayout";
import Dashboard from "../../pages/admin/Dashboard";
import UserList from "../../pages/admin/user/UserList";
import UserAdd from "../../pages/admin/user/UserAdd";
import Login from "../../pages/admin/Login";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Report from "../../pages/user/report/Report";

const AppRoutes = () => {  
  return (
    <Routes>
      <Route
        path="login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user" element={<UserList />} />
        <Route path="user/list" element={<UserList />} />
        <Route path="user/add" element={<UserAdd />} />
        <Route path="user/add/:id?" element={<UserAdd />} />
        <Route path="/report" element={<Report type="admin" />} />

      </Route>
    </Routes>
  );
};

export default AppRoutes;
