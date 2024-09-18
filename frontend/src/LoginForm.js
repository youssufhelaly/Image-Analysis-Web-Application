// Importing necessary dependencies
import React, { useState } from 'react'; // React and useState hook for managing component state
import { useNavigate } from 'react-router-dom'; // useNavigate hook for programmatic navigation
import { ToastContainer, toast } from 'react-toastify'; // Toast notifications for user feedback
import 'react-toastify/dist/ReactToastify.css'; // Importing CSS for Toast notifications
import './LoginForm.css'; // Importing custom CSS for styling the login form
import CircularProgress from '@mui/material/CircularProgress'; // Material-UI component for loading spinner

/**
 * LoginForm Component
 * This component renders a login form with username and password inputs. It handles form submission,
 * basic validation, displays loading feedback during authentication, and handles errors through
 * toast notifications. If login is successful, it navigates the user to the upload page.
 */
const LoginForm = () => {
  // State variables for form input and loading status
  const [username, setUsername] = useState(''); // State to store the inputted username
  const [password, setPassword] = useState(''); // State to store the inputted password
  const [loading, setLoading] = useState(false); // State to handle loading spinner visibility during login request

  // Hook for navigating to different pages after successful login
  const navigate = useNavigate();

  /**
   * handleSubmit - Function triggered when the form is submitted.
   * It validates the input fields, sends a login request to the backend, and handles
   * navigation and error feedback based on the server response.
   *
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents default form submission behavior (page reload)

    // Basic validation: Check if both username and password fields are filled
    if (!username || !password) {
      toast.error('Please fill in both fields.'); // Show an error toast notification if validation fails
      return;
    }

    // Set the loading state to true to show the loading spinner while awaiting server response
    setLoading(true);

    try {
      // Send POST request to the server's login endpoint
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST', // HTTP method for the request
        headers: {
          'Content-Type': 'application/json', // Ensures the request body is sent as JSON
        },
        // Convert the username and password into JSON format to send as the request body
        body: JSON.stringify({ username, password }),
      });

      // If the response status is OK (200), the login was successful
      if (response.ok) {
        const data = await response.json(); // Parse the response data into JSON
        localStorage.setItem('authToken', data.access_token); // Store the received JWT token in local storage for future authenticated requests

        // Navigate the user to the upload page after successful login
        navigate('/upload');
      } else {
        // Handle failed login attempts by showing the error message from the server or a default message
        const error = await response.json(); // Parse the error response
        toast.error(error.message || 'Login failed. Please check your username and password.'); // Show error toast notification
      }
    } catch (error) {
      // If there is a network error or any other unexpected error, show an error notification
      toast.error('An error occurred during login. Please try again.');
    } finally {
      // Set loading state back to false, hiding the loading spinner
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Login form title */}
      <h2 className="login-title">Log In</h2>
      
      {/* Form for username and password inputs */}
      <form onSubmit={handleSubmit} className="login-form">
        {/* Username input field */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username} // Binds the input value to the username state
            onChange={(e) => setUsername(e.target.value)} // Updates the username state on input change
            className="form-control"
            aria-label="Username" // Accessibility label for screen readers
          />
        </div>

        {/* Password input field */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password} // Binds the input value to the password state
            onChange={(e) => setPassword(e.target.value)} // Updates the password state on input change
            className="form-control"
            aria-label="Password" // Accessibility label for screen readers
          />
        </div>

        {/* Submit button with a loading spinner during login request */}
        <button type="submit" className="submit-button" disabled={loading}>
          {/* If loading is true, show a spinner, else show the "Login" button text */}
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </button>
      </form>
      
      {/* Container for toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default LoginForm;
