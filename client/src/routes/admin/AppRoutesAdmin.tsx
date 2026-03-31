import { Routes, Route } from "react-router-dom";
import AdminLayout from "../../layouts/admin/AdminLayout";
import Dashboard from "../../pages/admin/Dashboard";
import UserList from "../../pages/admin/user/UserList";
import UserAdd from "../../pages/admin/user/UserAdd";
import Login from "../../pages/admin/Login";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Report from "../../pages/report/Report";
import ImportFile from "../../pages/admin/import_file/ImportFile";
import PageNotFound from "../../pages/admin/PageNotFound";
import ValidationResult from "../../pages/admin/import_file/ValidationResult";
import ChangePassword from "../../pages/admin/ChangePassword";
import UpdateProfile from "../../pages/admin/UpdateProfile";
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
        <Route
          path="import_file/validation_result"
          element={<ValidationResult />}
        />
        <Route path="change_password" element={<ChangePassword />} />
        <Route path="update_profile" element={<UpdateProfile />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user" element={<UserList />} />
        <Route path="user/list" element={<UserList />} />
        <Route path="user/add" element={<UserAdd />} />
        <Route path="user/add/:id?" element={<UserAdd />} />
        <Route path="/report" element={<Report type="Admin" />} />
        <Route path="/import_file" element={<ImportFile />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
