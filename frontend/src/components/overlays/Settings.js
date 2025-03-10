import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/Theme';
import './styles/Settings.css';
import { FaAlignRight } from 'react-icons/fa';

const Settings = ({ onClose }) => {
  const { userRole } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  const [settings, setSettings] = useState({
    notifications: false,
    emailUpdates: false,
    showOnlineStatus: false,
    emergencyAlerts: false,
    soundAlerts: false
  });

  const handleChange = (setting) => {
    if (setting === 'darkMode') {
      toggleDarkMode();
    } else {
      setSettings(prev => ({
        ...prev,
        [setting]: !prev[setting]
      }));
    }
  };

  return (
    <div className="app-settings-overlay">
      <div className="app-settings-modal">
        <div className="app-settings-header">
          <h2>Settings</h2>
          <button className="app-close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="app-settings-content">
          <div className="app-settings-section">
            <h3 className="app-settings-section-title">General</h3>
            <div className="app-setting-item">
              <label>
                <span>Dark Mode</span>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={() => handleChange('darkMode')}
                />
              </label>
            </div>

            <div className="app-setting-item">
              <label>
                <span>Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleChange('notifications')}
                />
              </label>
            </div>

            <div className="app-setting-item">
              <label>
                <span>Email Updates</span>
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  onChange={() => handleChange('emailUpdates')}
                />
              </label>
            </div>
          </div>

          {userRole === 'paramedic' && (
            <div className="app-settings-section">
              <h3 className="app-settings-section-title">Paramedic Settings</h3>
              <div className="app-setting-item">
                <label>
                  <span>Show Online Status</span>
                  <input
                    type="checkbox"
                    checked={settings.showOnlineStatus}
                    onChange={() => handleChange('showOnlineStatus')}
                  />
                </label>
              </div>
              <div className="app-setting-item">
                <label>
                  <span>Emergency Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.emergencyAlerts}
                    onChange={() => handleChange('emergencyAlerts')}
                  />
                </label>
              </div>
              <div className="app-setting-item">
                <label>
                  <span>Sound Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.soundAlerts}
                    onChange={() => handleChange('soundAlerts')}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;