import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles/patientuser.css';
import Settings from '../overlays/Settings';
import UpdateProfile from '../overlays/UpdateProfile';
import SecureImage from '../common/SecureImage'; 
import AccountSecurity from '../overlays/AccountSecurity';
import UpdateHealthMetrics from '../overlays/UpdateHealthMetrics';
import { FaEdit, FaComment, FaSearch, FaAngleDown, FaAngleUp, FaTimes } from 'react-icons/fa';

export default function PatientDashboard() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false); 
  const [showAccountSecurity, setAccountSecurity] = useState(false);
  const [showHealthMetricsModal, setShowHealthMetricsModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('/default-profile.png');
  const [showMessagesBox, setShowMessagesBox] = useState(false);
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState({
    name: "",
    age: null,
    profile_pic: '/default-profile.png',
    upcomingAppointments: [],
    recentPrescriptions: [],
    bloodPressure: '120/80',
    heartRate: '72 bpm',
    weight: '70 kg',
    messages: [
      { id: 1, sender: 'Dr. Smith', content: 'Your test results look good!', time: '2 hours ago', unread: true },
      { id: 2, sender: 'Dr. Johnson', content: 'Please remember to take your medication as prescribed.', time: 'Yesterday', unread: false },
      { id: 3, sender: 'Nurse Wilson', content: 'Your appointment has been confirmed for next Monday.', time: '2 days ago', unread: false },
    ]
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

        setPatientData({
          ...response.data,
          profile_pic: response.data.profile_pic ? `http://127.0.0.1:5000${response.data.profile_pic}` : '/default-profile.png',
          messages: response.data.messages || patientData.messages // Keep default messages if none in API
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
      }
    };

    fetchPatientData();
  }, [navigate]);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };
  const handleAccountSettingsClick = () => {
    setShowUpdateProfile(true);
  };
  const handleAccountSecurityClick = () => {
    setShowProfileMenu(false);
    setAccountSecurity(true);
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
  const closeHealthMetricsModal = () => {
    setShowHealthMetricsModal(false);
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

  const toggleMessagesBox = () => {
    setShowMessagesBox(!showMessagesBox);
  };

  const navigateToFindDoctors = () => {
    navigate('/find-doctors');
  };

  const getUnreadCount = () => {
    return patientData.messages.filter(msg => msg.unread).length;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Patient Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="navigation-icons">
            <button 
              className="nav-button"
              onClick={navigateToFindDoctors}
              title="Find Doctors"
            >
              <FaSearch /> Find Doctors
            </button>
          </div>
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

      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <ul>
          <li className="active"><a href="#">Dashboard</a></li>
          <li><a onClick={() => navigate('/appointments')}>Appointments</a></li>
          <li><a onClick={() => navigate('/prescriptions')}>Prescriptions</a></li>
          <li><a onClick={() => navigate('/medical-records')}>Medical Records</a></li>
          <li><a onClick={() => navigate('/find-doctors')}>Find Doctors</a></li>
          <li><a onClick={() => navigate('/messages')}>Messages</a></li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome back, {patientData.name}!</h2>
        </div>

        <div className="dashboard-grid">
          {/* Health Metrics Section */}
          <div className="dashboard-card">
            <h3>Health Metrics
              <FaEdit 
                style={{ cursor: 'pointer', float: 'right' }} 
                onClick={() => setShowHealthMetricsModal(true)} 
              />
            </h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Blood Pressure</span>
                <span className="metric-value">{patientData.bloodPressure}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Heart Rate</span>
                <span className="metric-value">{patientData.heartRate}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Weight</span>
                <span className="metric-value">{patientData.weight}</span>
              </div>
            </div>
          </div>

          {/* Appointments Section */}
          <div className="dashboard-card">
            <h3>Upcoming Appointments</h3>
            <div className="appointments-list">
              {patientData.upcomingAppointments && patientData.upcomingAppointments.length > 0 ? (
                patientData.upcomingAppointments.map(apt => (
                  <div key={apt.id} className="appointment-item">
                    <div className="appointment-date">{apt.date}</div>
                    <div className="appointment-details">
                      <p>{apt.doctor}</p>
                      <p>{apt.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No upcoming appointments</p>
              )}
              <button className="action-button" onClick={() => navigate('/appointments')}>
                Schedule Appointment
              </button>
            </div>
          </div>

          {/* Prescriptions Section */}
          <div className="dashboard-card">
            <h3>Current Prescriptions</h3>
            <div className="prescriptions-list">
              {patientData.recentPrescriptions && patientData.recentPrescriptions.length > 0 ? (
                patientData.recentPrescriptions.map(prescription => (
                  <div key={prescription.id} className="prescription-item">
                    <h4>{prescription.medicine}</h4>
                    <p>Dosage: {prescription.dosage}</p>
                    <p>Frequency: {prescription.frequency}</p>
                  </div>
                ))
              ) : (
                <p>No current prescriptions</p>
              )}
              <button className="action-button" onClick={() => navigate('/prescriptions')}>
                View All Prescriptions
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2024 Healthcare Portal. All rights reserved.</p>
      </footer>

      {/* Fixed Messages Component */}
      <div className="fixed-chat-container">
        <div className="chat-launcher" onClick={toggleMessagesBox}>
          <FaComment />
          {getUnreadCount() > 0 && <span className="chat-notification-badge">{getUnreadCount()}</span>}
        </div>
        
        {showMessagesBox && (
          <div className="chat-box">
            <div className="chat-header">
              <h3>Messages</h3>
              <button onClick={toggleMessagesBox} className="chat-close-button">
                <FaTimes />
              </button>
            </div>
            <div className="chat-messages">
              {patientData.messages.length > 0 ? (
                patientData.messages.map(message => (
                  <div key={message.id} className={`chat-message-item ${message.unread ? 'unread' : ''}`}>
                    <div className="chat-message-sender">{message.sender}</div>
                    <div className="chat-message-content">{message.content}</div>
                    <div className="chat-message-time">{message.time}</div>
                  </div>
                ))
              ) : (
                <p className="no-messages">No messages</p>
              )}
            </div>
            <div className="chat-footer">
              <button onClick={() => navigate('/messages')}>View All Messages</button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
      {/* UpdateProfile Modal */}
      {showUpdateProfile && (
        <UpdateProfile onClose={() => setShowUpdateProfile(false)} />
      )}
      {/* Account Security Modal */}
      {showAccountSecurity && (
        <AccountSecurity onClose={closeAccountSecurity} />
      )}
      {/* Update Health Metrics Modal */}
      {showHealthMetricsModal && (
        <UpdateHealthMetrics onClose={closeHealthMetricsModal} />
      )}
    </div>
  );
}