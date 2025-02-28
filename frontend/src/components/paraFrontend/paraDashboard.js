import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './parauser.css';
import Settings from '../overlays/Settings';
import axiosInstance from '../../utils/axios';
// Replace axios with axiosInstance in all API calls
const DocDashboard = () => {
    const [doctorData, setDoctorData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                console.log('Fetching with token:', token); // Debug log

                const response = await axios.get('http://127.0.0.1:5000/para/paraDashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Access data from response.data
                const responseData = response.data;
                console.log('Response data:', responseData);

                if (!responseData) {
                    throw new Error('No data received from server');
                }

                // Set the doctor data directly from response.data
                setDoctorData(responseData);

            } catch (err) {
                console.error('Error details:', {
                    message: err.message,
                    response: err.response,
                    data: err.response?.data
                });
                setError(err.response?.data?.error || err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorData();
    }, []);

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/logout');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleSettingsClick = () => {
        setShowSettings(true);
        setShowProfileMenu(false); // Close profile menu when settings opens
    };

    // Handle clicking outside profile menu to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('.profile-section')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    if (!doctorData) {
        return <div className="no-data">No doctor data available</div>;
    }

    return (
        <div className={`dashboard-wrapper ${showSettings ? 'blur-background' : ''}`}>
            {/* Header */}
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
                            <img 
                                src="/path-to-default-avatar.png" 
                                alt="Profile"
                                className="profile-icon"
                                onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                                }}
                            />
                        </button>
                        {showProfileMenu && (
                            <div className="profile-menu">
                                <button onClick={handleSettingsClick}>Settings</button>
                                <button onClick={() => navigate('/preferences')}>Preferences</button>
                                <button onClick={handleLogout}>Logout</button>
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
                            <span>{`${doctorData.first_name || 'N/A'} ${doctorData.last_name || 'N/A'}`}</span>
                        </div>
                        <div className="info-item">
                            <label>Email:</label>
                            <span>{doctorData.primary_email || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Contact:</label>
                            <span>{doctorData.primary_contact || 'N/A'}</span>
                        </div>
                        {doctorData.specialization && (
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
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <Settings onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};

export default DocDashboard;

