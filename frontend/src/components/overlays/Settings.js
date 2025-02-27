import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Settings.css';

const Settings = ({ onClose }) => {
  const { userRole } = useAuth();
  const [settings, setSettings] = useState({
    notifications: false,
    darkMode: false,
    emailUpdates: false,
    showOnlineStatus: false,
    emergencyAlerts: false,
    soundAlerts: false
  });

  const handleChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3 className="settings-section-title">General</h3>
            <div className="setting-item">
              <label>
                <span>Dark Mode</span>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={() => handleChange('darkMode')}
                />
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span>Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleChange('notifications')}
                />
              </label>
            </div>

            <div className="setting-item">
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
            <div className="settings-section">
              <h3 className="settings-section-title">Paramedic Settings</h3>
              <div className="setting-item">
                <label>
                  <span>Show Online Status</span>
                  <input
                    type="checkbox"
                    checked={settings.showOnlineStatus}
                    onChange={() => handleChange('showOnlineStatus')}
                  />
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <span>Emergency Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.emergencyAlerts}
                    onChange={() => handleChange('emergencyAlerts')}
                  />
                </label>
              </div>
              <div className="setting-item">
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

        <div className="settings-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
