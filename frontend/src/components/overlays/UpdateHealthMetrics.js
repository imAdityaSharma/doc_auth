import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import './styles/UpdateHealthMetrics.css';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

const UpdateHealthMetrics = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [medicalDoc, setMedicalDoc] = useState(null);

  // Basic health metrics (single values)
  const [healthData, setHealthData] = useState({
    weight: '',
    height: '',
    bloodPressure: '',
    bloodGlucose: '',
  });

  // Multi-entry health data (arrays of items)
  const [chronicConditions, setChronicConditions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [pastSurgeries, setPastSurgeries] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [additionalMetrics, setAdditionalMetrics] = useState([]);
  const [currentMedicalDoc, setCurrentMedicalDoc] = useState('');

  // New item inputs
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newSurgery, setNewSurgery] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMetric, setNewMetric] = useState({ name: '', value: '' });

  // Helper function to parse data safely
  const safelyParseData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [data];
    } catch (e) {
      // If it's not valid JSON, treat it as a single item
      return data.trim() ? [data] : [];
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/puser/update-healthmetrics');
        console.log('Fetched user data:', response.data);
        
        if (response.data) {
          // Set single value metrics
          setHealthData({
            weight: response.data.weight || '',
            height: response.data.height || '',
            bloodPressure: response.data.bloodPressure || '',
            bloodGlucose: response.data.bloodGlucose || '',
          });
          
          // Store current medical doc path
          setCurrentMedicalDoc(response.data.medical_docs || '');

          // Set multi-entry data handling both JSON strings and raw values
          setChronicConditions(safelyParseData(response.data.chronic_conditions));
          setMedications(safelyParseData(response.data.medications));
          setPastSurgeries(safelyParseData(response.data.past_surgeries));
          setAllergies(safelyParseData(response.data.allergies));
          setAdditionalMetrics(safelyParseData(response.data.additional_metrics));
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHealthData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedicalDoc(file);
    }
  };

  // Handlers for multi-entry data
  const addCondition = () => {
    if (newCondition.trim()) {
      setChronicConditions([...chronicConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const addSurgery = () => {
    if (newSurgery.trim()) {
      setPastSurgeries([...pastSurgeries, newSurgery.trim()]);
      setNewSurgery('');
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const addMetric = () => {
    if (newMetric.name.trim() && newMetric.value.trim()) {
      setAdditionalMetrics([...additionalMetrics, { ...newMetric }]);
      setNewMetric({ name: '', value: '' });
    }
  };

  // Handlers to remove items
  const removeCondition = (index) => {
    setChronicConditions(chronicConditions.filter((_, i) => i !== index));
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const removeSurgery = (index) => {
    setPastSurgeries(pastSurgeries.filter((_, i) => i !== index));
  };

  const removeAllergy = (index) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const removeMetric = (index) => {
    setAdditionalMetrics(additionalMetrics.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      
      // Add basic health metrics
      Object.keys(healthData).forEach(key => {
        formData.append(key, healthData[key]);
      });
      
      // Add multi-entry data as JSON strings
      formData.append('chronic_conditions', JSON.stringify(chronicConditions));
      formData.append('medications', JSON.stringify(medications));
      formData.append('past_surgeries', JSON.stringify(pastSurgeries));
      formData.append('allergies', JSON.stringify(allergies));
      formData.append('additional_metrics', JSON.stringify(additionalMetrics));
      
      // Add medical document if selected
      if (medicalDoc) {
        formData.append('medicalDocs', medicalDoc);
      }

      console.log('Sending profile data:', Object.fromEntries(formData));

      const response = await axiosInstance.post('/puser/update-healthmetrics', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Health update response:', response.data);

      setMessage('Health metrics updated successfully!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating health metrics:', error);
      setMessage(error.response?.data?.error || 'Failed to update health metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-overlay">
        <div className="settings-modal">
          <div className="settings-header">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Update Health Metrics</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`setting-item ${message.includes('Failed') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-content">
          {/* Basic Health Metrics */}
          <div className="settings-section">
            <h3 className="settings-section-title">Basic Health Metrics</h3>
            
            <div className="setting-item">
              <label>Weight (kg/lbs)</label>
              <input
                type="text"
                name="weight"
                placeholder="Enter your weight"
                value={healthData.weight}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="setting-item">
              <label>Height (cm/ft)</label>
              <input
                type="text"
                name="height"
                placeholder="Enter your height"
                value={healthData.height}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="setting-item">
              <label>Blood Pressure (mmHg)</label>
              <input
                type="text"
                name="bloodPressure"
                placeholder="e.g., 120/80"
                value={healthData.bloodPressure}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="setting-item">
              <label>Blood Glucose (mg/dL)</label>
              <input
                type="text"
                name="bloodGlucose"
                placeholder="Enter blood glucose level"
                value={healthData.bloodGlucose}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Chronic Conditions Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Chronic Conditions</h3>
            
            <div className="multi-entry-section">
              <div className="multi-entry-input">
                <input
                  type="text"
                  placeholder="Add a chronic condition"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                />
                <button 
                  type="button" 
                  className="add-button"
                  onClick={addCondition}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="multi-entry-list">
                {chronicConditions.map((condition, index) => (
                  <div key={index} className="multi-entry-item">
                    <span>{condition}</span>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeCondition(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {chronicConditions.length === 0 && (
                  <div className="empty-list-message">No chronic conditions added</div>
                )}
              </div>
            </div>
          </div>

          {/* Medications Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Medications</h3>
            
            <div className="multi-entry-section">
              <div className="multi-entry-input">
                <input
                  type="text"
                  placeholder="Add a medication"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                />
                <button 
                  type="button" 
                  className="add-button"
                  onClick={addMedication}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="multi-entry-list">
                {medications.map((medication, index) => (
                  <div key={index} className="multi-entry-item">
                    <span>{medication}</span>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeMedication(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {medications.length === 0 && (
                  <div className="empty-list-message">No medications added</div>
                )}
              </div>
            </div>
          </div>

          {/* Past Surgeries Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Past Surgeries</h3>
            
            <div className="multi-entry-section">
              <div className="multi-entry-input">
                <input
                  type="text"
                  placeholder="Add a past surgery"
                  value={newSurgery}
                  onChange={(e) => setNewSurgery(e.target.value)}
                />
                <button 
                  type="button" 
                  className="add-button"
                  onClick={addSurgery}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="multi-entry-list">
                {pastSurgeries.map((surgery, index) => (
                  <div key={index} className="multi-entry-item">
                    <span>{surgery}</span>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeSurgery(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {pastSurgeries.length === 0 && (
                  <div className="empty-list-message">No past surgeries added</div>
                )}
              </div>
            </div>
          </div>

          {/* Allergies Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Allergies</h3>
            
            <div className="multi-entry-section">
              <div className="multi-entry-input">
                <input
                  type="text"
                  placeholder="Add an allergy"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                />
                <button 
                  type="button" 
                  className="add-button"
                  onClick={addAllergy}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="multi-entry-list">
                {allergies.map((allergy, index) => (
                  <div key={index} className="multi-entry-item">
                    <span>{allergy}</span>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeAllergy(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {allergies.length === 0 && (
                  <div className="empty-list-message">No allergies added</div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Metrics Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Additional Metrics</h3>
            
            <div className="multi-entry-section">
              <div className="multi-entry-input custom-metric">
                <input
                  type="text"
                  placeholder="Metric name"
                  value={newMetric.name}
                  onChange={(e) => setNewMetric({...newMetric, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric({...newMetric, value: e.target.value})}
                />
                <button 
                  type="button" 
                  className="add-button"
                  onClick={addMetric}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="multi-entry-list">
                {additionalMetrics.map((metric, index) => (
                  <div key={index} className="multi-entry-item">
                    <span>
                      <strong>{typeof metric === 'object' ? metric.name : 'Custom Metric'}:</strong> 
                      {typeof metric === 'object' ? metric.value : metric}
                    </span>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeMetric(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                {additionalMetrics.length === 0 && (
                  <div className="empty-list-message">No additional metrics added</div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Documents Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Medical Documents</h3>
            <div className="setting-item">
              <label>Upload Medical Documents:</label>
              <input 
                type="file" 
                onChange={handleFileChange} 
                className="file-input"
              />
              {medicalDoc && (
                <div className="file-selected">
                  Selected file: {medicalDoc.name}
                </div>
              )}
              {!medicalDoc && currentMedicalDoc && (
                <div className="file-selected">
                  Current document: {currentMedicalDoc.split('/').pop()}
                </div>
              )}
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

export default UpdateHealthMetrics;