import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./../styles/register.css"

// Add axios default configuration
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Access-Control-Allow-Credentials'] = true;

export default function RegisterPage() {
  const location = useLocation();
  const role = location.state?.role || 'patient';

  // Initialize form data with common fields
  const [formData, setFormData] = useState({
    // Common fields for all roles
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

  // Initialize role-specific data
  useEffect(() => {
    let roleSpecificData = {};
    
    switch(role) {
      case 'patient':
        roleSpecificData = {
          weight: "",
          height: "",
          height_unit: "cm",
          height_inches: "",
          medical_history: "",
          allergies: ""
        };
        break;
      case 'doctor':
        roleSpecificData = {
          license_number: "",
          specialization: "",
          years_of_experience: "",
          hospital_affiliation: ""
        };
        break;
      case 'paramedic':
        roleSpecificData = {
          emt_license: "",
          years_of_experience: "",
          additional_certifications: "",
          als_bls_training: ""
        };
        break;
      default:
        break;
    }
    
    setFormData(prevData => ({
      ...prevData,
      ...roleSpecificData
    }));
  }, [role]);

  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    verificationSent: false,
    verified: false,
    error: null
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user edits it
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
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
    if (!formData.primary_email) {
      setFormErrors({
        ...formErrors,
        primary_email: "Email is required to send verification code"
      });
      return;
    }

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
          verificationSent: true,
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
        verificationSent: true,
        verified: false,
        error: error.response?.data?.error || 'Failed to verify code'
      });
      alert(error.response?.data?.error || 'Failed to verify code');
    }
  };

  const validateStep = (step) => {
    let errors = {};
    let isValid = true;

    if (step === 1) {
      // Validate personal information
      if (!formData.first_name.trim()) {
        errors.first_name = "First name is required";
        isValid = false;
      }
      if (!formData.last_name.trim()) {
        errors.last_name = "Last name is required";
        isValid = false;
      }
      if (!formData.date_of_birth) {
        errors.date_of_birth = "Date of birth is required";
        isValid = false;
      }
      if (!formData.primary_contact.trim()) {
        errors.primary_contact = "Contact number is required";
        isValid = false;
      }
      if (!formData.primary_email.trim()) {
        errors.primary_email = "Email is required";
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.primary_email)) {
        errors.primary_email = "Email is invalid";
        isValid = false;
      }
      if (!formData.email_verified) {
        errors.email_verified = "Email verification is required";
        isValid = false;
      }
      if (!formData.password) {
        errors.password = "Password is required";
        isValid = false;
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
        isValid = false;
      }
      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = "Passwords do not match";
        isValid = false;
      }
      if (!formData.aadhar_ssn.trim()) {
        errors.aadhar_ssn = "Aadhar/SSN is required";
        isValid = false;
      }
    } else if (step === 2) {
      // Validate role-specific information
      if (role === 'patient') {
        // Patient validation is optional
      } else if (role === 'doctor') {
        if (!formData.license_number) {
          errors.license_number = "License number is required";
          isValid = false;
        }
        if (!formData.specialization) {
          errors.specialization = "Specialization is required";
          isValid = false;
        }
      } else if (role === 'paramedic') {
        if (!formData.emt_license) {
          errors.emt_license = "EMT License is required";
          isValid = false;
        }
        if (!formData.years_of_experience) {
          errors.years_of_experience = "Certification level is required";
          isValid = false;
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const prepareDataForSubmission = () => {
    // Create a copy of formData
    const dataToSubmit = { ...formData };
    
    // Remove confirm_password field as it's not needed for backend
    delete dataToSubmit.confirm_password;
    
    // Handle height conversions if needed
    if (role === 'patient' && dataToSubmit.height_unit === 'ft' && dataToSubmit.height && dataToSubmit.height_inches) {
      // Convert feet/inches to cm for backend storage
      const heightInCm = (parseFloat(dataToSubmit.height) * 30.48) + (parseFloat(dataToSubmit.height_inches) * 2.54);
      dataToSubmit.height = heightInCm.toFixed(2);
      delete dataToSubmit.height_unit;
      delete dataToSubmit.height_inches;
    }
    
    return dataToSubmit;
  };

  const registerUser = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const dataToSubmit = prepareDataForSubmission();

    try {
      const response = await axios.post("http://localhost:5000/register", dataToSubmit);
      
      if (response.data.success) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        alert(response.data.message || "Registration failed");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Registration failed. Please try again later.");
      }
      console.error("Registration error:", error);
    }
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
                  className={formErrors.first_name ? "error" : ""}
                />
                {formErrors.first_name && <span className="error-text">{formErrors.first_name}</span>}
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input 
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className={formErrors.last_name ? "error" : ""}
                />
                {formErrors.last_name && <span className="error-text">{formErrors.last_name}</span>}
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
                  className={formErrors.date_of_birth ? "error" : ""}
                />
                {formErrors.date_of_birth && <span className="error-text">{formErrors.date_of_birth}</span>}
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  name="primary_contact"
                  value={formData.primary_contact}
                  onChange={handleChange}
                  required
                  className={formErrors.primary_contact ? "error" : ""}
                />
                {formErrors.primary_contact && <span className="error-text">{formErrors.primary_contact}</span>}
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
                    className={formErrors.primary_email ? "error" : ""}
                  />
                  {formErrors.primary_email && <span className="error-text">{formErrors.primary_email}</span>}
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
                      {formErrors.email_verified && !formData.email_verified && (
                        <span className="error-text">{formErrors.email_verified}</span>
                      )}
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
                  className={formErrors.password ? "error" : ""}
                />
                {formErrors.password && <span className="error-text">{formErrors.password}</span>}
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className={formErrors.confirm_password ? "error" : ""}
                />
                {formErrors.confirm_password && <span className="error-text">{formErrors.confirm_password}</span>}
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
                className={formErrors.aadhar_ssn ? "error" : ""}
              />
              {formErrors.aadhar_ssn && <span className="error-text">{formErrors.aadhar_ssn}</span>}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="form-section">
            <h3>{role === 'patient' ? 'Health Information' : 'Professional Information'}</h3>
            {role === 'patient' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      min="0.5"
                      step="0.1"
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
                        step="0.1"
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
                          step="1"
                          placeholder="in"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Medical History</label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    placeholder="Any pre-existing conditions, surgeries, etc."
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Allergies</label>
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="List any allergies to medications, food, etc."
                    rows="2"
                  />
                </div>
              </>
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
                      className={formErrors.license_number ? "error" : ""}
                    />
                    {formErrors.license_number && <span className="error-text">{formErrors.license_number}</span>}
                  </div>
                  <div className="form-group">
                    <label>Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      required
                      className={formErrors.specialization ? "error" : ""}
                    />
                    {formErrors.specialization && <span className="error-text">{formErrors.specialization}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hospital Affiliation</label>
                    <input
                      type="text"
                      name="hospital_affiliation"
                      value={formData.hospital_affiliation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}
            {role === 'paramedic' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>EMT License Number *</label>
                    <input
                      type="text"
                      name="emt_license"
                      value={formData.emt_license}
                      onChange={handleChange}
                      required
                      className={formErrors.emt_license ? "error" : ""}
                    />
                    {formErrors.emt_license && <span className="error-text">{formErrors.emt_license}</span>}
                  </div>
                  <div className="form-group">
                    <label>years_of_experience *</label>
                    <input
                      name="years_of_experience"
                      value={formData.years_of_experience}
                      onChange={handleChange}
                      required
                      className={formErrors.years_of_experience}
                    >
                    </input>
                    {formErrors.years_of_experience && <span className="error-text">{formErrors.years_of_experience}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>additional_certifications</label>
                    <input
                      type="text"
                      name="additional_certifications"
                      value={formData.additional_certifications}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>als_bls_training</label>
                    <input
                      type="text"
                      name="als_bls_training"
                      value={formData.als_bls_training}
                      onChange={handleChange}
                      placeholder="City, County, or Region"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="form-section">
            <h3>Review & Submit</h3>
            <div className="review-section">
              <h4>Personal Information</h4>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{formData.first_name} {formData.last_name}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Date of Birth:</span>
                  <span className="review-value">{new Date(formData.date_of_birth).toLocaleDateString()}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Contact:</span>
                  <span className="review-value">{formData.primary_contact}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.primary_email}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Aadhar/SSN:</span>
                  <span className="review-value">{formData.aadhar_ssn}</span>
                </div>
              </div>
              
              <h4>{role === 'patient' ? 'Health Information' : 'Professional Information'}</h4>
              <div className="review-grid">
                {role === 'patient' && (
                  <>
                    {formData.weight && (
                      <div className="review-item">
                        <span className="review-label">Weight:</span>
                        <span className="review-value">{formData.weight} kg</span>
                      </div>
                    )}
                    {formData.height && (
                      <div className="review-item">
                        <span className="review-label">Height:</span>
                        <span className="review-value">
                          {formData.height_unit === 'cm'
                            ? `${formData.height} cm`
                            : `${formData.height}' ${formData.height_inches || 0}"`}
                        </span>
                      </div>
                    )}
                    {formData.medical_history && (
                      <div className="review-item review-full-width">
                        <span className="review-label">Medical History:</span>
                        <span className="review-value">{formData.medical_history}</span>
                      </div>
                    )}
                    {formData.allergies && (
                      <div className="review-item review-full-width">
                        <span className="review-label">Allergies:</span>
                        <span className="review-value">{formData.allergies}</span>
                      </div>
                    )}
                  </>
                )}
                {role === 'doctor' && (
                  <>
                    <div className="review-item">
                      <span className="review-label">License Number:</span>
                      <span className="review-value">{formData.license_number}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Specialization:</span>
                      <span className="review-value">{formData.specialization}</span>
                    </div>
                    {formData.years_of_experience && (
                      <div className="review-item">
                        <span className="review-label">Experience:</span>
                        <span className="review-value">{formData.years_of_experience} years</span>
                      </div>
                    )}
                    {formData.hospital_affiliation && (
                      <div className="review-item">
                        <span className="review-label">Hospital:</span>
                        <span className="review-value">{formData.hospital_affiliation}</span>
                      </div>
                    )}
                  </>
                )}
                {role === 'paramedic' && (
                  <>
                    <div className="review-item">
                      <span className="review-label">EMT License:</span>
                      <span className="review-value">{formData.emt_license}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Certification:</span>
                      <span className="review-value">{formData.years_of_experience}</span>
                    </div>
                    {formData.additional_certifications && (
                      <div className="review-item">
                        <span className="review-label">Certified On:</span>
                        <span className="review-value">{formData.additional_certifications}</span>
                      </div>
                    )}
                    {formData.als_bls_training && (
                      <div className="review-item">
                        <span className="review-label">Service Area:</span>
                        <span className="review-value">{formData.als_bls_training}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
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
            <div className="step-indicator">
              {[1, 2, 3].map(step => (
                <div 
                  key={step} 
                  className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <form className="registration-form" onSubmit={e => e.preventDefault()}>
            <div className="form-sections">
              {renderFormStep()}
            </div>

            <div className="form-navigation">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn-secondary">
                  Previous
                </button>
              )}
              {currentStep < 3 ? (
                <button type="button" onClick={nextStep} className="btn-primary">
                  Next
                </button>
              ) : (
                <button type="button" onClick={registerUser} className="btn-submit">
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