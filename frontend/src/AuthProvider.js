// Importing necessary dependencies from React
import React, { createContext, useContext, useState } from 'react';

/**
 * Creates a context for managing authentication state across the application.
 * The AuthContext will provide access to authentication-related values and functions,
 * such as the token, login, and logout.
 */
const AuthContext = createContext();

/**
 * AuthProvider Component
 * This component wraps around the part of the application that requires access to the authentication state.
 * It provides the current token, as well as login and logout functions to manage authentication state.
 *
 * @param {Object} props - React props object.
 * @param {ReactNode} props.children - The components that will be wrapped by the AuthProvider and will
 *                                     have access to the authentication context.
 */
export const AuthProvider = ({ children }) => {
  // Initialize the token state by checking if there's a stored token in localStorage, defaulting to an empty string if not
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  /**
   * login - Function to log in the user by setting the token both in the state and in localStorage.
   * 
   * @param {string} newToken - The token received upon successful login, typically a JWT token.
   */
  const login = (newToken) => {
    setToken(newToken); // Update the token state with the new token
    localStorage.setItem('token', newToken); // Store the token in localStorage so it's persistent between sessions
  };

  /**
   * logout - Function to log out the user by clearing the token from the state and localStorage.
   */
  const logout = () => {
    setToken(''); // Clear the token state (empty string indicates the user is logged out)
    localStorage.removeItem('token'); // Remove the token from localStorage to log the user out across sessions
  };

  return (
    // Provide the token, login, and logout functions to any children components wrapped by AuthProvider
    <AuthContext.Provider value={{ token, login, logout }}>
      {children} {/* Renders the wrapped children components */}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * This custom hook allows components to access the AuthContext values (token, login, and logout).
 * It provides an easy way to access authentication data and functions without needing to directly use
 * the context consumer in every component.
 *
 * @returns {Object} - The authentication context values: token, login, and logout.
 */
export const useAuth = () => useContext(AuthContext);
