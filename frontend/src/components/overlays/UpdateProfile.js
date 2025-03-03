import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import './styles/acc_preferences.css';
import SecureImage from '../common/SecureImage';
import { FaEdit } from 'react-icons/fa';

const UpdateProfile = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    primary_email: '',
    primary_contact: '',
    date_of_birth: '',
    house_no: '',
    apartment: '',
    colony: '',
    city: '',
    pin_code: '',
    state: '',
  });
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/default-profile.png');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    verificationSent: false,
    verified: false,
    error: null
  });
  const [originalEmail, setOriginalEmail] = useState('');

  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/comms/filldata');
        console.log('Fetched user data:', response.data);
        // const profilePicUrl = response.data.profile_pic ? 
        //   `http://127.0.0.1:5000${response.data.profile_pic}` :
        //   '/default-profile.png';
        if (response.data) {
          setProfileData(prevData => ({
            ...prevData,
            first_name: response.data.name || '',
            last_name: response.data.last_name || '',
            primary_email: response.data.primary_email || '',
            primary_contact: response.data.primary_contact || '',
            date_of_birth: response.data.date_of_birth || '',
            house_no: response.data.house_no || '',
            apartment: response.data.apartment || '',
            colony: response.data.colony || '',
            city: response.data.city || '',
            pin_code: response.data.pin_code || '',
            state: response.data.state || '',
            profile_pic: response.data.profile_pic ? `http://127.0.0.1:5000${response.data.profile_pic}` :'/default-profile.png'
          }));

          // Store the original email for comparison
          setOriginalEmail(response.data.primary_email || '');

          if (response.data.profile_pic) {
            setPreviewUrl(response.data.profile_pic);
          } else {
            setPreviewUrl('/default-profile.png');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData(); // This should only run once when the component mounts
  }, []); // Ensure the dependency array is empty
  
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Check if the email has changed
    if (name === 'primary_email' && value !== profileData.primary_email) {
      setIsEmailVerified(false); // Reset verification status
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
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

      const response = await axiosInstance.post('/send-verification', {
        email: profileData.primary_email,
      });

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
      const response = await axiosInstance.post('/verify-email', {
        email: profileData.primary_email,
        code: code
      });

      if (response.data.success) {
        setVerificationStatus({
          isVerifying: false,
          verified: true,
          error: null
        });
        setIsEmailVerified(true); // Set email as verified
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

  // const handleKeyDown = (index, e) => {
  //   if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
  //     const prevInput = document.getElementById(`otp-${index - 1}`);
  //     if (prevInput) prevInput.focus();
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Check if email is verified before submitting
    if (!isEmailVerified) {
      setMessage('Please verify your email before saving changes.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Debug log
      console.log('Profile data being sent:', profileData);
      
      // Explicitly add each field to formData
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      formData.append('primary_email', profileData.primary_email);
      formData.append('primary_contact', profileData.primary_contact);
      formData.append('date_of_birth', profileData.date_of_birth);
      formData.append('house_no', profileData.house_no);
      formData.append('apartment', profileData.apartment);
      formData.append('colony', profileData.colony);
      formData.append('city', profileData.city);
      formData.append('pin_code', profileData.pin_code);
      formData.append('state', profileData.state);

      // Add profile pic if it exists
      if (profilePic) {
        formData.append('profile_pic', profilePic);
      }

      // Debug log
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]); 
      }

      // const response = await axiosInstance.post('/puser/profile_update', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      setMessage('Profile updated successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Loading...</h2>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Update Profile</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`setting-item ${message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-content">
          {/* Profile Picture */}
          <div className="settings-section">
            <h3 className="settings-section-title">Profile Picture</h3>
            <div className="setting-item" style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <SecureImage 
                src={previewUrl}
                alt="Profile Preview" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label 
                htmlFor="file-input"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  padding: '5px',
                  boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
              >
                <FaEdit style={{ color: '#007bff' }} />
              </label>
            </div>
          </div>
          {/* Basic Information */}
          <div className="settings-section">
            <h3 className="settings-section-title">Basic Information</h3>
            <div className="setting-item">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={profileData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={profileData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="setting-item">
              <input
                type="email"
                name="primary_email"
                placeholder="Email Address"
                value={profileData.primary_email}
                onChange={handleInputChange}
                required
              />
              {/* Show the verification button only if the email has changed */}
              {profileData.primary_email !== originalEmail && !isEmailVerified && (
                <button 
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={verificationStatus.isVerifying}
                  style={{ marginTop: '5px' }}
                >
                  {verificationStatus.isVerifying ? 'Sending...' : 'Get Verification Code'}
                </button>
              )}
            </div>
            {verificationStatus.verificationSent && (
              <div className="setting-item">
                <label>Verification Code *</label>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      value={verificationCode[index]}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
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
            )}
            <div className="setting-item">
              <input
                type="tel"
                name="primary_contact"
                placeholder="Phone"
                value={profileData.primary_contact}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="setting-item">
              <input
                type="date"
                name="date_of_birth"
                value={profileData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="settings-section">
            <h3 className="settings-section-title">Address</h3>
            <div className="setting-item">
              <input
                type="text"
                name="house_no"
                placeholder="House No"
                value={profileData.house_no}
                onChange={handleInputChange}
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="apartment"
                placeholder="Apartment"
                value={profileData.apartment}
                onChange={handleInputChange}
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="colony"
                placeholder="Colony/Street"
                value={profileData.colony}
                onChange={handleInputChange}
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={profileData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="pin_code"
                placeholder="PIN Code"
                value={profileData.pin_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="setting-item">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={profileData.state}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;