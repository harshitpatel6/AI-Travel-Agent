import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { profileAPI } from '../utils/api';
import './Profile.css';

const Profile = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      const userData = response.data.user;
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await profileAPI.updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update user in context
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await profileAPI.changePassword(
        passwordData.current_password,
        passwordData.new_password
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>

        <div className="profile-container">
          <div className="profile-sidebar">
            <button
              className={`sidebar-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('profile');
                setMessage({ type: '', text: '' });
              }}
            >
              <User size={20} />
              Profile Information
            </button>
            <button
              className={`sidebar-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('password');
                setMessage({ type: '', text: '' });
              }}
            >
              <Lock size={20} />
              Change Password
            </button>
          </div>

          <div className="profile-content card">
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <h2 className="form-title">Profile Information</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <User size={18} />
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      className="form-input"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <User size={18} />
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      className="form-input"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <h2 className="form-title">Change Password</h2>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    className="form-input"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    className="form-input"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                  />
                  <small className="form-hint">Minimum 8 characters</small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Lock size={18} />
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    className="form-input"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
