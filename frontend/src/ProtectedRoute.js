import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // Adjust token retrieval as needed

  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }

  // Render the children (protected component) if authenticated
  return children;
};

export default ProtectedRoute;
