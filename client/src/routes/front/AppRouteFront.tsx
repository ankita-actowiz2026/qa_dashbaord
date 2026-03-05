import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../../pages/front/Login";
import FrontLayout from "../../layouts/front/FrontLayout";


import ProtectedRoute from "../../routes/front/ProtectedRoute";
import PublicRoute from "../../routes/front/PublicRoute";
import Dashboard from "../../pages/front/Dashboard";
import PageNotFound from "../../pages/front/PageNotFound";
import ImportFile from "../../pages/front/import_file/ImportFile";
import Report from "../../pages/front/report/Report";

// import { injectAuthContext } from "../../utils/front/apiClient";

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
        <Route path="/report" element={<Report />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRouteFront;
