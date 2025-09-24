import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

const UserProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = getUser();
  
  // If user is admin, redirect to admin dashboard
  if (user && user.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  // If user is not admin, allow access to user dashboard
  return children;
};

export default UserProtectedRoute;
