import React, { useState } from "react";
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import "../styles/LoginPage.css";
 
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
                        navigate('/doc/docDashboard');
                    } else if (response.data.role === 'paramedic') {
                        navigate('/para/paradashboard');
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
 
    // let imgs = [
    //   'https://as1.ftcdn.net/v2/jpg/03/39/70/90/1000_F_339709048_ZITR4wrVsOXCKdjHncdtabSNWpIhiaR7.jpg',
    // ];
     
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
              <a href="/forgot-password" className="forgot-password">Forgot Password?</a>
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
    </div>
  );
}