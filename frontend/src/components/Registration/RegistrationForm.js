import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./register.css";

export default function RegisterPage() {
  const location = useLocation();
  const role = location.state?.role || 'patient';

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    primary_contact: "", 
    primary_email: "",
    password: "",
    confirm_password: "",
    aadhar_ssn: "",
    weight: "",
    height: "",
    blood_pressure: "",
    blood_glucose: "",
    allergies: "",
    chronic_conditions: "",
    medications: "",
    past_surgeries: "",
    role: role,
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const registerUser = () => {
    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    axios
      .post("http://localhost:5000/register", formData)
      .then((response) => {
        console.log(response);
        if (response.data.success) {
          navigate("/home");
        } else {
          alert("Registration failed");
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert("Registration failed. Please try again later.");
        }
      });
  };

  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return role === 'patient' ? (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-wrapper">
          <div className="form-header">
            <h1>Create Patient Account</h1>
            <p>Step {currentStep} of 3</p>
          </div>

          <form className="registration-form" onSubmit={e => e.preventDefault()}>
            <div className="form-sections">
              {currentStep === 1 && (
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input 
                        type="text" 
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input 
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth *</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Number *</label>
                      <input
                        type="tel"
                        name="primary_contact"
                        value={formData.primary_contact}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="primary_email"
                      value={formData.primary_email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Aadhar/SSN *</label>
                    <input
                      type="text"
                      name="aadhar_ssn"
                      value={formData.aadhar_ssn}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="form-section">
                  <h3>Health Metrics</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        min="0.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Height</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          min="24"
                          placeholder={formData.height_unit === 'cm' ? 'cm' : 'ft'}
                        />
                        <select 
                          name="height_unit"
                          value={formData.height_unit}
                          onChange={handleChange}
                        >
                          <option value="cm">cm</option>
                          <option value="ft">ft/in</option>
                        </select>
                        {formData.height_unit === 'ft' && (
                          <input
                            type="number"
                            name="height_inches"
                            value={formData.height_inches}
                            onChange={handleChange}
                            min="0"
                            max="11"
                            placeholder="in"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Blood Pressure</label>
                      <input
                        type="text"
                        name="blood_pressure"
                        value={formData.blood_pressure}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Blood Glucose</label>
                      <input
                        type="text"
                        name="blood_glucose"
                        value={formData.blood_glucose}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="form-section">
                  <h3>Medical History</h3>
                  <div className="form-group">
                    <label>Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="List any allergies..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Chronic Conditions</label>
                    <textarea
                      name="chronic_conditions"
                      value={formData.chronic_conditions}
                      onChange={handleChange}
                      placeholder="List any chronic conditions..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Medications</label>
                    <textarea
                      name="medications"
                      value={formData.medications}
                      onChange={handleChange}
                      placeholder="List current medications..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Past Surgeries</label>
                    <textarea
                      name="past_surgeries"
                      value={formData.past_surgeries}
                      onChange={handleChange}
                      placeholder="List any past surgeries..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="nav-btn back-btn">
                  Back
                </button>
              )}
              
              {currentStep === 3 ? (
                <button 
                  type="button" 
                  onClick={registerUser} 
                  className="submit-btn"
                  disabled={!formData.first_name || !formData.last_name || !formData.primary_email || !formData.primary_contact || !formData.password || !formData.confirm_password || !formData.date_of_birth || !formData.aadhar_ssn}
                >
                  Create Account
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="nav-btn next-btn"
                  disabled={currentStep === 1 && (!formData.first_name || !formData.last_name || !formData.primary_email || !formData.primary_contact || !formData.password || !formData.confirm_password || !formData.date_of_birth || !formData.aadhar_ssn)}
                >
                  Next
                </button>
              )}

              <p className="login-link">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : role === 'doctor' ? (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-wrapper">
          <div className="form-header">
            <h1>Create Doctor Account</h1>
          </div>

          <form className="registration-form" onSubmit={e => e.preventDefault()}>
            <div className="form-sections">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input 
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input
                      type="tel"
                      name="primary_contact"
                      value={formData.primary_contact}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="primary_email"
                    value={formData.primary_email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Medical License Number *</label>
                  <input
                    type="text"
                    name="aadhar_ssn"
                    value={formData.aadhar_ssn}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={registerUser} 
                className="submit-btn"
                disabled={!formData.first_name || !formData.last_name || !formData.primary_email || !formData.primary_contact || !formData.password || !formData.confirm_password || !formData.date_of_birth || !formData.aadhar_ssn}
              >
                Create Account
              </button>

              <p className="login-link">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: #f5f5f5;
          padding: 40px 20px;
          overflow-y: auto;
          position: relative;
        }

        .register-container {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 30px;
          margin: auto;
        }

        @media (max-height: 800px) {
          .register-page {
            padding: 20px;
            height: auto;
            min-height: 100%;
          }
          
          .register-container {
            margin: 0 auto;
          }
        }

        .form-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .form-header h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .form-header p {
          font-size: 14px;
          color: #666;
        }

        .form-sections {
          margin-bottom: 20px;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-section h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .form-actions {
          text-align: center;
        }

        .nav-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          margin-right: 10px;
        }

        .back-btn {
          background-color: #6c757d;
        }

        .submit-btn {
          background-color: #28a745;
        }

        .submit-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .login-link {
          margin-top: 20px;
          font-size: 14px;
        }

        .login-link a {
          color: #007bff;
          text-decoration: none;
        }
      `}</style>
    </div>
  ) : (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-wrapper">
          <div className="form-header">
            <h1>Create Paramedic Account</h1>
          </div>

          <form className="registration-form" onSubmit={e => e.preventDefault()}>
            <div className="form-sections">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input 
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number *</label>
                    <input
                      type="tel"
                      name="primary_contact"
                      value={formData.primary_contact}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="primary_email"
                    value={formData.primary_email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Paramedic License Number *</label>
                  <input
                    type="text"
                    name="aadhar_ssn"
                    value={formData.aadhar_ssn}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={registerUser} 
                className="submit-btn"
                disabled={!formData.first_name || !formData.last_name || !formData.primary_email || !formData.primary_contact || !formData.password || !formData.confirm_password || !formData.date_of_birth || !formData.aadhar_ssn}
              >
                Create Account
              </button>

              <p className="login-link">
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: #f5f5f5;
          padding: 40px 20px;
          overflow-y: auto;
          position: relative;
        }

        .register-container {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 30px;
          margin: auto;
        }

        @media (max-height: 800px) {
          .register-page {
            padding: 20px;
            height: auto;
            min-height: 100%;
          }
          
          .register-container {
            margin: 0 auto;
          }
        }

        .form-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .form-header h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .form-header p {
          font-size: 14px;
          color: #666;
        }

        .form-sections {
          margin-bottom: 20px;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-section h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .form-actions {
          text-align: center;
        }

        .nav-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          margin-right: 10px;
        }

        .back-btn {
          background-color: #6c757d;
        }

        .submit-btn {
          background-color: #28a745;
        }

        .submit-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .login-link {
          margin-top: 20px;
          font-size: 14px;
        }

        .login-link a {
          color: #007bff;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
