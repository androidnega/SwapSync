import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  userRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, userRole }) => {
  // Check if user's role is in the allowed roles
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

