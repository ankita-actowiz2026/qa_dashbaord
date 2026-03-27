import AppRoutesAdmin from "./admin/AppRoutesAdmin";
//import AppRoutesFront from "./user/AppRouteFront";
import { Routes, Route, Navigate } from "react-router-dom";
import PageNotFound from "../pages/admin/PageNotFound";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin/*" element={<AppRoutesAdmin />} />
      {/* <Route path="/*" element={<AppRoutesFront />} /> */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export default AppRoutes;
