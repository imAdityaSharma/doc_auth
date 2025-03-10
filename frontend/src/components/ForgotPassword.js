import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();
  
  // Request OTP
  const requestOTP = () => {
    if(email.length === 0) {
      setErrorMessage("Please enter your email address");
      return;
    }
    
    // TODO: Replace with your API endpoint
    axios.post('http://127.0.0.1:5000/send-verification', {
      email: email,
      isPasswordChange:true,
    })
    .then(function (response) {
      console.log(response);
      setOtpSent(true);
      setStep(2);
      setErrorMessage('');
    })
    .catch(function (error) {
      console.log(error, 'error');
      setErrorMessage("Failed to send OTP. Please check your email and try again.");
    });
  };
  
  // Verify OTP
  const verifyOTP = () => {
    if(otp.length === 0) {
      setErrorMessage("Please enter the OTP");
      return;
    }
    
    // TODO: Replace with your API endpoint
    axios.post('http://127.0.0.1:5000/verify-email', {
      email: email,
      code: otp
    })
    .then(function (response) {
      console.log(response);
      setStep(3);
      setErrorMessage('');
    })
    .catch(function (error) {
      console.log(error, 'error');
      setErrorMessage("Invalid OTP. Please try again.");
    });
  };
  
  // Reset Password
  const resetPassword = () => {
    if(newPassword.length === 0) {
      setErrorMessage("Please enter a new password");
      return;
    }
    if(newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    
    // TODO: Replace with your API endpoint
    axios.post('http://127.0.0.1:5000/password_change', {
      email: email,
      otp: otp,
      newPassword: newPassword
    })
    .then(function (response) {
      console.log(response);
      alert("Password reset successful!");
      navigate('/login');
    })
    .catch(function (error) {
      console.log(error, 'error');
      setErrorMessage("Failed to reset password. Please try again.");
    });
  };
  
  // Handle back button
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/login');
    }
    setErrorMessage('');
  };
  
  return (
    <div className="login-container">
      <div className="top-bar">
        <h1>Password Recovery</h1>
      </div>
      
      <div className="login-form-container">
        <div className="login-box">
          <div className="login-header">
            <h2>
              {step === 1 && "Forgot Password"}
              {step === 2 && "Enter OTP"}
              {step === 3 && "Create New Password"}
            </h2>
            <p>
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create a new password for your account"}
            </p>
          </div>

          {errorMessage && (
            <div style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>
              {errorMessage}
            </div>
          )}

          <form className="login-form">
            {step === 1 && (
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="form-input"
                />
              </div>
            )}

            {step === 2 && (
              <div className="form-group">
                <label>OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="form-input"
                />
              </div>
            )}

            {step === 3 && (
              <>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                </div>
              </>
            )}

            <button 
              type="button"
              onClick={
                step === 1 ? requestOTP : 
                step === 2 ? verifyOTP : 
                resetPassword
              }
              className="login-button"
            >
              {step === 1 && "Send OTP"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Reset Password"}
            </button>

            <button 
              type="button"
              onClick={goBack}
              className="login-button"
              style={{ 
                marginTop: '10px', 
                background: 'transparent', 
                border: '1px solid #667eea', 
                color: '#667eea' 
              }}
            >
              Back
            </button>

            <div className="register-link">
              Remember your password? <a href="/login">Login here</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}