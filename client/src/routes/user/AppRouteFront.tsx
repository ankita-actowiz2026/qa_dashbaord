import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../../pages/user/Login";
import FrontLayout from "../../layouts/user/FrontLayout";


import ProtectedRoute from "../../routes/user/protectedRoute";
import PublicRoute from "../../routes/user/PublicRoute";
import Dashboard from "../../pages/user/Dashboard";
import PageNotFound from "../../pages/user/PageNotFound";
import ImportFile from "../../pages/user/import_file/ImportFile";
import Report from "../../pages/user/report/Report";

// import { injectAuthContext } from "../../utils/user/apiClient";

// const Injector = () => {
//   const auth = useAuth();

//   injectAuthContext(auth);
//   return null;
// };
function AppRouteFront() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Login" />} />      
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />      

      <Route path="/" element={<ProtectedRoute><FrontLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/import_file" element={<ImportFile />} />        
        <Route path="/report" element={<Report type="user" />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRouteFront;
