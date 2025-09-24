import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

const PoliceProtectedRoute = ({ children }) => {
  const user = getUser();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'police') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default PoliceProtectedRoute;
