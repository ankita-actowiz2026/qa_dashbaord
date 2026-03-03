import { Routes, Route } from "react-router-dom";
import AdminLayout from "../../layouts/admin/AdminLayout";
import Dashboard from "../../pages/admin/Dashboard";
import UserList from "../../pages/admin/user/UserList";
import UserAdd from "../../pages/admin/user/UserAdd";
import Login from "../../pages/admin/Login";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
const AppRoutesAdmin = () => {  
  alert("admin")
  return (
    <Routes>
      <Route
        path="login"
        element={         <Login /> }
      />

      <Route
        path="/"
        element={
            <AdminLayout />          
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="user" element={<UserList />} />
        <Route path="user/list" element={<UserList />} />
        <Route path="user/add" element={<UserAdd />} />
        <Route path="user/add/:id?" element={<UserAdd />} />

      </Route>
    </Routes>
  );
};

export default AppRoutesAdmin;
