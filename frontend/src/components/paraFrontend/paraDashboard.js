import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './parauser.css';

const DocDashboard = () => {
    const [doctorData, setDoctorData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                console.log('Fetching with token:', token); // Debug log

                const response = await axios.get('http://localhost:5000/para/paraDashboard', {
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
            await axios.post('http://localhost:5000/logout');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };
    const handleSettingsClick = () => {
        navigate('/settings');
      };

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
        <div className="dashboard-wrapper">
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
                src="" 
                alt="Profile" 
                className="profile-icon"
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
        </div>
    );
};

export default DocDashboard;

