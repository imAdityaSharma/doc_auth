import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './parauser.css';
import Settings from '../overlays/Settings';
import UpdateProfile from '../overlays/UpdateProfile';
import SecureImage from '../common/SecureImage';
import axiosInstance from '../../utils/axios'; // Import axiosInstance
import AccountSecurity from '../overlays/AccountSecurity';


const ParaDashboard = () => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showUpdateProfile, setShowUpdateProfile] = useState(false);
    const [showAccountSecurity, setAccountSecurity] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('/default-profile.png');
    const [paraData, setParaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchParaData = async () => {
            console.log('Fetching paramedic data...');
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No token found, navigating to login...');
                    navigate('/login');
                    return;
                }

                // Use axiosInstance instead of axios
                const response = await axiosInstance.get('/para/paraDashboard');
                console.log('Paramedic data fetched:', response.data);

                if (response.data) {
                    setParaData(response.data);
                    // Update preview URL only if profile_pic exists
                    if (response.data.profile_pic) {
                        setPreviewUrl(response.data.profile_pic);
                    }
                } else {
                    throw new Error('No data received from server');
                }

            } catch (error) {
                console.error('Error fetching paramedic data:', error);
                setError(error.response?.data?.message || 'Failed to load paramedic data.');
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
                console.log('Loading state set to false');
            }
        };

        fetchParaData();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            // Call logout endpoint
            await axios.post(`http://127.0.0.1:5000/logout`, {}, {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Clear any other stored data
            sessionStorage.clear();
            // Update auth context
            
            // Redirect to login
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local data even if server request fails
            localStorage.clear();
            sessionStorage.clear();
            navigate('/login');
        }
    };

    const handleSettingsClick = () => {
        setShowProfileMenu(false); // Close profile menu when opening settings
        setShowSettings(true);
    };
    const handleAccountSecurityClick =() =>{
        setShowProfileMenu(false);
        setAccountSecurity(true);
    }

    const handleAccountSettingsClick = () => {
        setShowProfileMenu(false); // Close profile menu when opening account settings
        setShowUpdateProfile(true);
    };

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
        return (
            <div className="loading-container">
                <div className="loading-spinner">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!paraData) {
        return (
            <div className="no-data-container">
                <div className="no-data-message">No paramedic data available</div>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Paramedic Dashboard</h1>
                </div>
                <div className="header-right">
                    <div className="profile-section">
                        <button 
                            className="profile-button"
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
                                    border: '2px solid #fff'
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

            <div className="dashboard-container">
                <div className="para-info">
                    <h2>Personal Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Name:</label>
                            <span>{`${paraData.first_name || 'N/A'} ${paraData.last_name || 'N/A'}`}</span>
                        </div>
                        <div className="info-item">
                            <label>Email:</label>
                            <span>{paraData.email || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Contact:</label>
                            <span>{paraData.primary_contact || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Upcoming Appointments:</label>
                            <span>{paraData.upcomingAppointments || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>DoB:</label>
                            <span>{paraData.dob || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Recent Prescriptions:</label>
                            <span>{paraData.recentPrescriptions || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <Settings onClose={closeSettings} />
            )}
            {/* UpdateProfile Modal */}
            {showUpdateProfile && (
                <UpdateProfile onClose={closeUpdateProfile} />
            )}
            {showAccountSecurity && (
                <AccountSecurity onClose={closeAccountSecurity} />
            )}
        </div>
    );
};

export default ParaDashboard;