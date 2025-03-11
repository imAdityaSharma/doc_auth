import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './docuser.css';
import Settings from '../overlays/Settings';
import UpdateProfile from '../overlays/UpdateProfile';
import SecureImage from '../common/SecureImage'; 
import AccountSecurity from '../overlays/AccountSecurity';
import { useAuth } from '../../contexts/AuthContext';

const DocDashboard = () => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showUpdateProfile, setShowUpdateProfile] = useState(false); 
    const [showAccountSecurity, setAccountSecurity] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('/default-profile.png');
    const [doctorData, setDoctorData] = useState(null);
    const [error] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const fetchDoctorData = async () => {
            console.log('Fetching doctor data...');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, navigating to login...');
                    navigate('/login');
                    return;
                }
        
                const response = await axios.get('http://127.0.0.1:5000/doc/docDashboard', {
                  withCredentials: true,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                });
                // Set profile pic URL from response
                // const profilePicUrl = response.data.profile_pic ? 
                //   `http://127.0.0.1:5000${response.data.profile_pic}` :
                //   '/default-profile.png';
        
                setDoctorData({
                  ...response.data,
                  profile_pic: response.data.profile_pic ? `http://127.0.0.1:5000${response.data.profile_pic}` :'/default-profile.png',
                  first_name: response.data.first_name,
                  last_name: response.data.last_name,
                  primary_contact: response.data.primary_contact,
                  email: response.data.email,
                  upcomingAppointments: response.data.upcomingAppointments,
                  recentPrescriptions:response.data.recentPrescriptions,
                  dob:response.data.dob
                });
                
                if (response.data.profile_pic) {
                  setPreviewUrl(response.data.profile_pic);
                } else {
                  setPreviewUrl('/default-profile.png');
                }
        
              } catch (error) {
                console.error('Error fetching patient data:', error);
                if (error.response && error.response.status === 401) {
                  localStorage.removeItem('token');  // Clear invalid token
                  navigate('/login');
                }
              } finally {
                setLoading(false);
                console.log('Loading state set to false');
              }
            };

        fetchDoctorData();
    }, []);

    const handleLogout = async () => {
      try {
          await logout();
          navigate('/login');
      } catch (error) {
          console.error('Logout error:', error);
          navigate('/login');
      }
    };
    const handleSettingsClick = () => {
        setShowSettings(true);
      };
    const handleAccountSettingsClick = () => {
        setShowUpdateProfile(true);  // Updated function to use new state variable name
      };
    const handleAccountSecurityClick =() =>{
        setShowProfileMenu(false);
        setAccountSecurity(true);
    }
    const closeSettings = () => {
        setShowSettings(false);
    };

    const closeUpdateProfile = () => {
        setShowUpdateProfile(false);
    };
    const closeAccountSecurity = () => {
      setAccountSecurity(false);
  };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!doctorData) {
        return <div className="no-data">No doctor data available</div>;
    }

    return (
        <div className="dashboard-wrapper">
            {/* Header */}
            <header className="dashboard-header">
        <div className="header-left">
          <h1>Doctor Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="profile-section">
          <button 
              className="profile-button1"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <SecureImage 
                src={previewUrl}
                alt="Profile" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid #fff'  // Optional: adds a white border around the image
                }}
              />
            </button>
            {showProfileMenu && (
              <div className="profile-menu">
                <button onClick={() => { handleSettingsClick(); setShowProfileMenu(false); }}>Settings</button>
                <button onClick={() => { handleAccountSettingsClick(); setShowProfileMenu(false); }}>Account Preferences</button>
                <button onClick={() => { handleAccountSecurityClick(); setShowProfileMenu(false); }}>Account Security</button>
                <button onClick={() => { handleLogout(); setShowProfileMenu(false); }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

            {/* Main Content */}
            <div className="dashboard-container">
                <div className="doctor-info">
                    <h2>Personal Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Name:</label>
                            <span>{`${doctorData.first_name} ${doctorData.last_name}`}</span>
                        </div>
                        <div className="info-item">
                            <label>Email:</label>
                            <span>{doctorData.email || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Contact:</label>
                            <span>{doctorData.primary_contact || 'N/A'}</span>
                        </div>
                        </div>
                        <div className="info-grid">
                        <div className="info-item">
                            <label>upcoming Appointments:</label>
                            <span>{doctorData.upcomingAppointments || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>DoB:</label>
                            <span>{doctorData.dob || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>recentPrescriptions:</label>
                            <span>{doctorData.recentPrescriptions || 'N/A'}</span>
                        </div>

                        {/* {doctorData.specialization && (
                            <div className="info-item">
                                <label>Specialization:</label>
                                <span>{doctorData.specialization}</span>
                            </div>
                        )}
                        {doctorData.experience && (
                            <div className="info-item">
                                <label>Experience:</label>
                                <span>{doctorData.experience} years</span>
                            </div>
                        )}
                        {doctorData.hospital && (
                            <div className="info-item">
                                <label>Hospital:</label>
                                <span>{doctorData.hospital}</span>
                            </div>
                        )}
                        {doctorData.availability && (
                            <div className="info-item">
                                <label>Availability:</label>
                                <span>{doctorData.availability}</span>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
            {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={closeSettings} />
      )}
      {/* UpdateProfile Modal */}
      {showUpdateProfile && (  // Updated condition
        <UpdateProfile onClose={closeUpdateProfile} />  // Updated handler
      )}
       {showAccountSecurity && (
                <AccountSecurity onClose={closeAccountSecurity} />
            )}
        </div>
    );
};

export default DocDashboard;

