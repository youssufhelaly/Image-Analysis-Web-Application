import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Ensure this is imported
import './LoginForm.css'; // Import your CSS file
import CircularProgress from '@mui/material/CircularProgress';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!username || !password) {
      toast.error('Please fill in both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token); // Store token if needed
        
        navigate('/upload');
      } else {
        // Handle unsuccessful login
        const error = await response.json();
        toast.error(error.message || 'Login failed. Please check your username and password.');
      }
    } catch (error) {
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Log In</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            aria-label="Username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            aria-label="Password"
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default LoginForm;
