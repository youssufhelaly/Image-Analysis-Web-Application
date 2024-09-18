import React, { useState } from 'react';
import axios from 'axios';
import './RegisterForm.css';
import {ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';


const RegisterForm = () => {
  // State hooks for form inputs
  const [username, setUsername] = useState(''); // The username input field
  const [password, setPassword] = useState(''); // The password input field
  const [confirmPassword, setConfirmPassword] = useState(''); // The confirm password input field
  const [passwordVisible, setPasswordVisible] = useState(false); // Toggle password visibility
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // Toggle confirm password visibility

  // Hook for navigating to different pages after successful login
  const navigate = useNavigate();
  /**
   * Handles the form submission by sending a POST request to the backend
   * to register the user.
   *
   * @param {React.FormEvent} e The form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if all fields are filled
    if (!username || !password || !confirmPassword) {
      toast.error('Please fill in all fields!');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      // Send a POST request to the backend to register the user
      await axios.post('http://localhost:5000/auth/register', { username, password });

      // If the request is successful, show a success message and navigate
      toast.success('User registered successfully!', { autoClose: 2000 });

      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/login');
    } catch (error) {
      // If the request fails, show an error message
      toast.error('Registration failed');
      console.error('Registration failed', error);
    }
  };

  return (
    <div className="register-form-container">
      <h2 className="register-title">Register</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Enter your password"
            />
            <span
              className="password-toggle"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              <i className={`material-icons ${passwordVisible ? 'visible' : 'hidden'}`}>
                {passwordVisible ? 'visibility_off' : 'visibility'}
              </i>
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password:</label>
          <div className="password-wrapper">
            <input
              id="confirm-password"
              type={confirmPasswordVisible ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control"
              placeholder="Confirm your password"
            />
            <span
              className="password-toggle"
              onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              <i className={`material-icons ${confirmPasswordVisible ? 'visible' : 'hidden'}`}>
                {confirmPasswordVisible ? 'visibility_off' : 'visibility'}
              </i>
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Register</button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default RegisterForm;
