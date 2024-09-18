/**
 * A form to register a new user.
 *
 * @returns {React.ReactElement} The registration form component.
 */
import React, { useState } from 'react';
import axios from 'axios';
const RegisterForm = () => {
  const [username, setUsername] = useState(''); // The username input field
  const [password, setPassword] = useState(''); // The password input field

  /**
   * Handles the form submission by sending a POST request to the backend
   * to register the user.
   *
   * @param {React.FormEvent} e The form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send a POST request to the backend to register the user
      await axios.post('http://localhost:5000/auth/register', { username, password });

      // If the request is successful, show an alert to the user
      alert('User registered successfully!');
    } catch (error) {
      // If the request fails, show an error message in the console
      console.error('Registration failed', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Username:
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password:
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <button type="submit">Register</button>
    </form>
  );
};

export default RegisterForm;

