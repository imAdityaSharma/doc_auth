import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./register.css";

// Add axios default configuration
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Access-Control-Allow-Credentials'] = true;

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
    role: role,
    email_verified: false
  });

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    verificationSent: false,
    verified: false,
    error: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^[0-9a-fA-F]$/.test(value) && value !== '') return;

    const newVerificationCode = [...verificationCode];
    newVerificationCode[index] = value;
    setVerificationCode(newVerificationCode);

    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const sendVerificationCode = async () => {
    try {
      setVerificationStatus({
        isVerifying: true,
        verificationSent: false,
        verified: false,
        error: null
      });

      const response = await axios.post(
        'http://localhost:5000/send-verification',
        { email: formData.primary_email },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      );

      if (response.data.success) {
        setVerificationStatus({
          isVerifying: false,
          verificationSent: true,
          verified: false,
          error: null
        });
        alert('Verification code sent! Please check your email.');
      }
    } catch (error) {
      setVerificationStatus({
        isVerifying: false,
        verificationSent: false,
        verified: false,
        error: error.response?.data?.error || 'Failed to send verification code'
      });
      alert(error.response?.data?.error || 'Failed to send verification code');
    }
  };

  const verifyCode = async () => {
    try {
      const code = verificationCode.join('');
      const response = await axios.post(
        'http://localhost:5000/verify-email',
        {
          email: formData.primary_email,
          code: code
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setVerificationStatus({
          isVerifying: false,
          verified: true,
          error: null
        });
        setFormData({
          ...formData,
          email_verified: true
        });
        alert('Email verified successfully!');
      }
    } catch (error) {
      setVerificationStatus({
        isVerifying: false,
        verified: false,
        error: error.response?.data?.error || 'Failed to verify code'
      });
      alert(error.response?.data?.error || 'Failed to verify code');
    }
  };

  const registerUser = () => {
    if (!formData.email_verified) {
      alert("Please verify your email before registering");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    axios
      .post("http://localhost:5000/register", formData)
      .then((response) => {
        if (response.data.success) {
          navigate("/login");
        } else {
          alert("Registration failed");
        }
      })
      .catch((error) => {
        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else {
          alert("Registration failed. Please try again later.");
        }
      });
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.email_verified) {
      alert("Please verify your email before proceeding");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Render form steps based on user role and current step
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    name="primary_email"
                    value={formData.primary_email}
                    onChange={handleChange}
                    required
                  />
                  <button 
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={!formData.primary_email || verificationStatus.isVerifying}
                    style={{ marginTop: '5px' }}
                  >
                    {verificationStatus.isVerifying ? 'Sending...' : 'Get Verification Code'}
                  </button>
                </div>
                
                {verificationStatus.verificationSent && (
                  <div style={{ flex: 1 }}>
                    <div className="form-group">
                      <label>Verification Code *</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              value={verificationCode[index]}
                              onChange={(e) => handleOTPChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              maxLength={1}
                              style={{
                                width: '40px',
                                height: '40px',
                                textAlign: 'center',
                                fontSize: '1.2em',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                margin: '0 4px'
                              }}
                              disabled={verificationStatus.verified}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={verifyCode}
                          disabled={verificationCode.some(digit => digit === '') || 
                                   verificationStatus.isVerifying || 
                                   verificationStatus.verified}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: verificationStatus.verified ? '#4CAF50' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          {verificationStatus.isVerifying ? 'Verifying...' : 
                           verificationStatus.verified ? 'Verified ✓' : 'Verify Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
        );
      
      case 2:
        return (
          <div className="form-section">
            <h3>{role === 'patient' ? 'Health Information' : 'Professional Information'}</h3>
            {role === 'patient' && (
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
            )}
            {role === 'doctor' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Medical License Number *</label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            {role === 'paramedic' && (
              <div className="form-row">
                <div className="form-group">
                  <label>EMT License Number *</label>
                  <input
                    type="text"
                    name="emt_license"
                    value={formData.emt_license}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Certification Level *</label>
                  <select
                    name="certification_level"
                    value={formData.certification_level}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="EMT-B">EMT-Basic</option>
                    <option value="EMT-I">EMT-Intermediate</option>
                    <option value="EMT-P">Paramedic</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="form-section">
            <h3>Review & Submit</h3>
            <div className="review-section">
              {/* Display entered information for review */}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-wrapper">
          <div className="form-header">
            <h1>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</h1>
            <p>Step {currentStep} of 3</p>
          </div>

          <form className="registration-form" onSubmit={e => e.preventDefault()}>
            <div className="form-sections">
              {renderFormStep()}
            </div>

            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep}>
                  Previous
                </button>
              )}
              {currentStep < 3 ? (
                <button type="button" onClick={nextStep}>
                  Next
                </button>
              ) : (
                <button type="button" onClick={registerUser}>
                  Register
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
