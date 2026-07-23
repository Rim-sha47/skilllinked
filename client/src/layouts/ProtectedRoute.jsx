import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // For development purposes, if we want to bypass auth, we can just return <Outlet />
  // but let's stick to the flow. If not authenticated, go to login.
  // We can mock being authenticated initially in authSlice or by a button.
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
