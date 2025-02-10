import React, { useState } from "react";
import axios from 'axios';
import {useNavigate} from "react-router-dom";
 
export default function LoginPage(){
 
    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');
   
    const navigate = useNavigate();
     
    const logInUser = () => {
        if(email.length === 0){
          alert("Email has left Blank!");
        }
        else if(password.length === 0){
          alert("password has left Blank!");
        }
        else{
            axios.post('http://localhost:5000/login', {
                email: email,
                password: password
            })
            .then(function (response) {
                console.log(response);
                console.log(response.data);
                
                // Store JWT token in localStorage
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    
                    // Set default Authorization header for future requests
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                }

                if (response.data.role) {
                    if (response.data.role === 'patient') {
                        navigate('/puser/dashboard');
                    } else if (response.data.role === 'doctor') {
                        navigate('/duser/dashboard');
                    } else if (response.data.role === 'paramedic') {
                        navigate('/parauser/dashboard');
                    }
                }
            })
            .catch(function (error) {
                console.log(error, 'error');
                if (error.response.status === 401) {
                    alert("Invalid credentials");
                }
            });
        }
    }
 
    let imgs = [
      'https://as1.ftcdn.net/v2/jpg/03/39/70/90/1000_F_339709048_ZITR4wrVsOXCKdjHncdtabSNWpIhiaR7.jpg',
    ];
     
  return (
    <div className="login-container">
      <div className="top-bar">
        <h1>Welcome Back</h1>
      </div>
      
      <div className="login-form-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Sign In</h2>
            <p>Please login to continue</p>
          </div>

          <form className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                className="form-input"
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button 
              type="button"
              onClick={logInUser}
              className="login-button"
            >
              Sign In
            </button>

            <div className="register-link">
              Don't have an account? <a href="/register">Register here</a>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .top-bar {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px 0;
          text-align: center;
          margin-bottom: 40px;
        }

        .top-bar h1 {
          color: white;
          margin: 0;
          font-size: 28px;
        }

        .login-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 150px);
        }

        .login-box {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .login-header p {
          color: #666;
          margin: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: #555;
        }

        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .form-input:focus {
          border-color: #667eea;
          outline: none;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
        }

        .forgot-password {
          color: #667eea;
          text-decoration: none;
        }

        .login-button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .login-button:hover {
          background: #5a6fd6;
        }

        .register-link {
          text-align: center;
          margin-top: 20px;
          color: #666;
        }

        .register-link a {
          color: #667eea;
          text-decoration: none;
          font-weight: bold;
        }

        .register-link a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}