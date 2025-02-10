import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const navigate = useNavigate();

  const handleSignupClick = () => {
    setShowRoleOptions(true);
  };

  const handleRoleSelect = (role) => {
    navigate('/register', { state: { role } });
  };

  return (
    <div className="home-container">
      <div className="content">
        <h1>Welcome to Healthcare Portal</h1>
        <p>Your trusted platform for medical services</p>

        <div className="buttons-container">
          <button className="login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
          <button className="signup-btn" onClick={handleSignupClick}>
            Sign Up
          </button>
        </div>

        {showRoleOptions && (
          <div className="role-options">
            <h3>Select your role:</h3>
            <div className="role-buttons">
              <button onClick={() => handleRoleSelect('patient')}>Patient</button>
              <button onClick={() => handleRoleSelect('doctor')}>Doctor</button>
              <button onClick={() => handleRoleSelect('paramedic')}>Para Medic</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .content {
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 90%;
        }

        h1 {
          color: #2d3748;
          margin-bottom: 16px;
          font-size: 2.5rem;
        }

        p {
          color: #4a5568;
          margin-bottom: 32px;
          font-size: 1.1rem;
        }

        .buttons-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 24px;
        }

        button {
          padding: 12px 32px;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .login-btn {
          background: #4299e1;
          color: white;
        }

        .signup-btn {
          background: #48bb78;
          color: white;
        }

        .role-options {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .role-options h3 {
          color: #2d3748;
          margin-bottom: 16px;
        }

        .role-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .role-buttons button {
          background: #805ad5;
          color: white;
          padding: 10px 24px;
        }
      `}</style>
    </div>
  );
}

export default Home;