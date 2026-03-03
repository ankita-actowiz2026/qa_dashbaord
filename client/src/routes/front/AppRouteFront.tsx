import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../../pages/front/Login";
import FrontLayout from "../../layouts/front/FrontLayout";

import PostAdd from "../../pages/front/post/PostAdd";
import PostList from "../../pages/front/post/PostList";
import ListWithPagination from "../../pages/front/post/ListWithPagination";
import ListWithServerPagination from "../../pages/front/post/ListWithServerPagination";

import PrivateRoute from "../../routes/front/PrivateRoute";
import PublicRoute from "../../routes/front/PublicRoute";
import Dashboard from "../../pages/front/Dashboard";
import PageNotFound from "../../pages/front/PageNotFound";

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

      <Route path="/" element={<PrivateRoute><FrontLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/post/add/:id?" element={<PostAdd />} />
        <Route path="/post/list" element={<PostList />} />

        <Route
          path="/post/listWithPagination"
          element={<ListWithPagination />}
        />

        <Route
          path="/post/ListWithServerPagination"
          element={<ListWithServerPagination />}
        />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default AppRouteFront;
