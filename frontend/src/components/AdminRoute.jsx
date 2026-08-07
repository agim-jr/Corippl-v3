// frontend/src/components/AdminRoute.jsx

import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const AdminRoute = () => {
  const { token, isAdmin } = useContext(AuthContext);

  console.log("AdminRoute - Token:", token);
  console.log("AdminRoute - isAdmin:", isAdmin); // Debugging

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    toast.error("Access denied. Admins only.");
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
