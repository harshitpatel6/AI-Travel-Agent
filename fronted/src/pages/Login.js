import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../utils/api';
import './Auth.css';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('Login attempt with:', { email: formData.email });

    try {
      const response = await authAPI.login(formData);
      console.log('Login response:', response.data);
      
      const { access_token, user_id, email, role, first_name, last_name } = response.data;
      
      if (!access_token || !user_id) {
        throw new Error('Invalid response from server');
      }
      
      // Store token
      localStorage.setItem('access_token', access_token);
      console.log('Token stored:', access_token.substring(0, 20) + '...');
      
      // Store user data with all fields from backend
      const userData = { 
        user_id, 
        email: email || formData.email, 
        role: role || 'user',
        first_name: first_name || '',
        last_name: last_name || ''
      };
      localStorage.setItem('user_data', JSON.stringify(userData));
      console.log('User data stored:', userData);
      
      // Show success message
      setSuccess('✓ Login successful! Redirecting to chat...');
      
      // Update parent state
      setUser(userData);
      console.log('User state updated, navigating to chat...');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 800);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });
      
      // Better error handling
      let errorMessage;
      if (!err.response && err.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please check if backend is running on http://localhost:8000';
      } else if (err.response?.status === 401) {
        errorMessage = err.response?.data?.detail || 'Invalid email or password.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response) {
        errorMessage = err.response?.data?.detail || 'Login failed. Please try again.';
      } else {
        errorMessage = err.message || 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue your journey</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={18} />
                Password
              </label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-gradient btn-block" disabled={loading}>
              <LogIn size={20} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </p>
            <p>Don't have an account? <Link to="/register" className="auth-link">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
