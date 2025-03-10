import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import './styles/updateProfile.css';
import { FaEdit } from 'react-icons/fa';
import ImageCropper from './ImageCropper';
import SecureImage from '../common/SecureImage';

const UpdateProfile = ({ onClose }) => {
  // Basic state management
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  // Profile data state
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

  // Profile picture states
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/default-profile.png');

  // Email verification states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    verificationSent: false,
    verified: false,
    error: null
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/comms/filldata');
        
        if (response.data) {
          const userData = response.data;
          setProfileData({
            first_name: userData.name || '',
            last_name: userData.last_name || '',
            primary_email: userData.primary_email || '',
            primary_contact: userData.primary_contact || '',
            date_of_birth: userData.date_of_birth || '',
            house_no: userData.house_no || '',
            apartment: userData.apartment || '',
            colony: userData.colony || '',
            city: userData.city || '',
            pin_code: userData.pin_code || '',
            state: userData.state || '',
            profile_pic: response.data.profile_pic ? `http://127.0.0.1:5000${response.data.profile_pic}` :'/default-profile.png'
          });

          setOriginalEmail(userData.primary_email || '');

          // Handle profile picture URL
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

    fetchUserData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));

    if (name === 'primary_email' && value !== originalEmail) {
      setIsEmailVerified(false);
    }
  };

  // Handle profile picture selection
  const handleFileSelect = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCroppedImage = (newImageUrl) => {
    
    setShowCropper(false);
    setImageToCrop(null);
    setMessage('Profile picture updated successfully!');
  };

  // Email verification functions
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
        setMessage('Verification code sent! Please check your email.');
      }
    } catch (error) {
      setVerificationStatus({
        isVerifying: false,
        verificationSent: false,
        verified: false,
        error: error.response?.data?.error || 'Failed to send verification code'
      });
      setMessage(error.response?.data?.error || 'Failed to send verification code');
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
          verificationSent: true,
          verified: true,
          error: null
        });
        setIsEmailVerified(true);
        setMessage('Email verified successfully!');
      }
    } catch (error) {
      setVerificationStatus({
        isVerifying: false,
        verificationSent: true,
        verified: false,
        error: error.response?.data?.error || 'Failed to verify code'
      });
      setMessage(error.response?.data?.error || 'Failed to verify code');
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newVerificationCode = [...verificationCode];
    newVerificationCode[index] = value;
    setVerificationCode(newVerificationCode);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };
  const handleCropperClose = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (profileData.primary_email !== originalEmail && !isEmailVerified) {
        setMessage('Please verify your new email address before saving changes.');
        return;
    }

    try {
        setLoading(true);
        
        // Create FormData object
        const formData = new FormData();
        
        // Append all profile data fields to FormData
        Object.keys(profileData).forEach(key => {
            if (profileData[key]) { // Only append if value exists
                formData.append(key, profileData[key]);
            }
        });

        const response = await axiosInstance.post('/comms/user_data_update', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        
        console.log('API Response:', response.data);

        if (response.data.message === "Profile updated successfully") {
            setMessage('Profile updated successfully!');
            setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            setMessage('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
        setLoading(false);
    }
};

  if (loading) {
    return (
      <div className="Update_profile-overlay">
        <div className="Update_profile-modal">
          <div className="Update_profile-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="Update_profile-overlay">
      <div className="Update_profile-modal">
        <div className="Update_profile-header">
          <h2>Update Profile</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

          {showCropper && imageToCrop && (
            <ImageCropper
              imageToCrop={imageToCrop}
              onImageCropped={handleCroppedImage}
              onCancel={handleCropperClose}
            />
          )}
        <form onSubmit={handleSubmit} className="Update_profile-content">
          {/* Profile Picture Section */}
          <div className="Update_profile-section">
            <h3>Profile Picture</h3>
            <div className="profile-picture-container">
            <div className="Update_profile-item" style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <SecureImage 
                src={previewUrl}
                alt="Profile Preview" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="profile-pic-input"
              />
              
                <label 
                  htmlFor="profile-pic-input" 
                  className="edit-profile-pic-button"
                  style={{position:'absolute', bottom:'0', right:'0'}} 
                >
                <FaEdit />
              </label>
            </div>
          </div>
          </div>

          {/* Basic Information Section */}
          <div className="Update_profile-section">
            <h3>Basic Information</h3>
            <div className="Update_profile-item">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={profileData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={profileData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="email"
                name="primary_email"
                placeholder="Email Address"
                value={profileData.primary_email}
                onChange={handleInputChange}
                required
              />
              {profileData.primary_email !== originalEmail && !isEmailVerified && (
                <button 
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={verificationStatus.isVerifying}
                  className="verification-button"
                >
                  {verificationStatus.isVerifying ? 'Sending...' : 'Verify Email'}
                </button>
              )}
            </div>

            {/* Verification Code Input */}
            {verificationStatus.verificationSent && !verificationStatus.verified && (
              <div className="Update_profile-item verification-code-container">
                <label>Enter Verification Code</label>
                <div className="otp-inputs">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      maxLength={1}
                      className="otp-input"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={verificationCode.some(digit => digit === '') || 
                           verificationStatus.isVerifying}
                  className="verify-code-button"
                >
                  {verificationStatus.isVerifying ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}

            <div className="Update_profile-item">
              <input
                type="tel"
                name="primary_contact"
                placeholder="Phone Number"
                value={profileData.primary_contact}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="date"
                name="date_of_birth"
                value={profileData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="Update_profile-section">
            <h3>Address</h3>
            <div className="Update_profile-item">
              <input
                type="text"
                name="house_no"
                placeholder="House No"
                value={profileData.house_no}
                onChange={handleInputChange}
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="apartment"
                placeholder="Apartment"
                value={profileData.apartment}
                onChange={handleInputChange}
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="colony"
                placeholder="Colony/Street"
                value={profileData.colony}
                onChange={handleInputChange}
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={profileData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="pin_code"
                placeholder="PIN Code"
                value={profileData.pin_code}
                onChange={handleInputChange}
              />
            </div>
            <div className="Update_profile-item">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={profileData.state}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="Update_profile-actions">
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