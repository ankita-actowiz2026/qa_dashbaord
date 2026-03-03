import { Routes, Route } from "react-router-dom";
import AppRoutesAdmin from "./admin/AppRoutesAdmin";
import AppRoutesFront from "./front/AppRouteFront";
const AppRoutes = () => {
  
  return (
    <Routes>
      <Route path="/admin/*" element={<AppRoutesAdmin />} />
      <Route path="/*" element={<AppRoutesFront />} />
    </Routes>
  );
};
export default AppRoutes;
