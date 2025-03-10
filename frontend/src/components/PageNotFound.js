import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="top-bar">
        <h1>Page Not Found</h1>
      </div>
      
      <div className="login-form-container">
        <div className="login-box">
          <div className="login-header">
            <h2>404</h2>
            <p>The page you're looking for doesn't exist.</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '60px', color: '#667eea', marginBottom: '20px' }}>
              <span role="img" aria-label="Confused face">😕</span>
            </div>
            <p>We can't seem to find the page you're looking for.</p>
          </div>

          <button 
            type="button"
            onClick={() => navigate('/')}
            className="login-button"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}