import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './patientuser.css';
export default function PatientDashboard() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState({
    name: "",
    age: null,
    upcomingAppointments: [],
    recentPrescriptions: []
  });

  React.useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://127.0.0.1:5000/puser/dashboard', {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        setPatientData(response.data);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');  // Clear invalid token
          navigate('/login');
        }
      }
    };

    fetchPatientData();
  }, [navigate]);

  // Mock patient data - replace with actual API call

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:5000/logout', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'http://127.0.0.1:3000'
        }
      });
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/home');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Patient Dashboard</h1>
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
      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back, {patientData.name}!</h2>
        </div>

        <div className="dashboard-grid">
          {/* Appointments Section */}
          <div className="dashboard-card">
            <h3>Upcoming Appointments</h3>
            <div className="appointments-list">
              {patientData.upcomingAppointments.map(apt => (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-date">{apt.date}</div>
                  <div className="appointment-details">
                    <p>{apt.doctor}</p>
                    <p>{apt.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions Section */}
          <div className="dashboard-card">
            <h3>Current Prescriptions</h3>
            <div className="prescriptions-list">
              {patientData.recentPrescriptions.map(prescription => (
                <div key={prescription.id} className="prescription-item">
                  <h4>{prescription.medicine}</h4>
                  <p>Dosage: {prescription.dosage}</p>
                  <p>Frequency: {prescription.frequency}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Health Metrics Section */}
          <div className="dashboard-card">
            <h3>Health Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Blood Pressure</span>
                <span className="metric-value">120/80</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Heart Rate</span>
                <span className="metric-value">72 bpm</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Weight</span>
                <span className="metric-value">70 kg</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2024 Healthcare Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
