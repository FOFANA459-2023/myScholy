import React from 'react';
import { Navigate } from 'react-router-dom';
import { apiService } from '../services/api';

const ProtectedRoute = ({ children, requiredRole = null, requireLogin = false }) => {
  const isAuthenticated = apiService.isAuthenticated();
  const user = apiService.getCurrentUser();

  // If login is required and user is not authenticated
  if (requireLogin && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated && requiredRole) {
    return <Navigate to="/login" replace />;
  }

  // If specific role is required and user doesn't have it
  if (requiredRole && user) {
    const isAdmin = user.user_type === 'admin' || user.is_staff || user.is_superuser;
    
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/access-denied" replace />;
    }
    
    if (requiredRole === 'student' && user.user_type !== 'student' && !isAdmin) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

