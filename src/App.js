import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import UploadImages from './UploadImages'; // Ensure UploadImages is imported
import ProtectedRoute from './ProtectedRoute'; // Ensure ProtectedRoute is defined

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadImages />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
