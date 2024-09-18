/**
 * A protected route component that renders the given children if the user is authenticated
 * by checking for the presence of an authentication token in local storage.
 * If the user is not authenticated, it redirects them to the login page.
 * @param {{ children: JSX.Element }} props The children to be rendered if the user is authenticated.
 * @returns {JSX.Element} The protected route component.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // Retrieve the authentication token from local storage

  if (!token) {
    // Redirect to login if the user is not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render the children (protected component) if authenticated
  return children;
};

/**
 * Exports the ProtectedRoute component as the default export.
 */
export default ProtectedRoute;

