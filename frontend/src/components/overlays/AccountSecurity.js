import React, { useState } from 'react';
import axios from 'axios';
import './styles/AccountSecurity.css';

const AccountSecurity = ({ onClose }) => {
    const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const validatePasswords = () => {
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const sendVerificationCode = async () => {
        try {
            setIsLoading(true);
            setError('');
            setMessage('');
    
            const response = await axios.post('http://localhost:5000/send-verification', 
                { 
                    email:email,
                    isForgotPassword: true  // Add this flag
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            if (response.data.success) {
                setMessage('Verification code sent to your email!');
                setStep(2);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyCode = async () => {
        try {
            setIsLoading(true);
            setError('');
            setMessage('');

            const response = await axios.post('http://localhost:5000/verify-email',
                {
                    email:email,
                    code: verificationCode
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setMessage('Email verified successfully!');
                setStep(3);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to verify code');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!validatePasswords()) {
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            setMessage('');

            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/password_change',
                {
                    email,
                    newPassword: newPassword
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage('Password updated successfully!');
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="security-overlay">
            <div className="security-modal">
                <div className="security-header">
                    <h2>Account Security</h2>
                    <button className="security-close-button" onClick={onClose}>&times;</button>
                </div>
    
                <div className="security-content">
                    <div className="security-section">
                        <h3>Change Password</h3>
    
                        {step === 1 && (
                            <div className="security-item">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                />
                                <button 
                                    onClick={sendVerificationCode}
                                    disabled={isLoading || !email}
                                    className="Security-verify-button"
                                >
                                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </div>
                        )}
    
                        {step === 2 && (
                            <div className="security-item">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    placeholder="Enter verification code"
                                    disabled={isLoading}
                                />
                                <button 
                                    onClick={verifyCode}
                                    disabled={isLoading || !verificationCode}
                                    className="Security-verify-button"
                                >
                                    {isLoading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </div>
                        )}
    
                        {step === 3 && (
                            <form onSubmit={handlePasswordChange} className="security-item">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    disabled={isLoading}
                                />
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit"
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    className="Security-save-button"
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        )}
    
                        {message && <div className="success-message">{message}</div>}
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSecurity;