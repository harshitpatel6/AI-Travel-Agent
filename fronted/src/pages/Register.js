import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '../utils/api';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.register(formData);
      console.log('Registration response:', response.data);
      
      setSuccess('Registration successful! Check your email for OTP. (In development, OTP is also shown in backend console)');
      setStep(2);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      
      // Better error handling
      if (err.response?.status === 400) {
        setError(err.response?.data?.detail || 'Email already registered or invalid data.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again or contact support.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.verifyOTP(formData.email, otp);
      console.log('OTP verification response:', response.data);
      
      setSuccess('✓ Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('OTP verification error:', err);
      
      if (err.response?.status === 400) {
        setError('Invalid or expired OTP. Please check the code or request a new one.');
      } else {
        setError(err.response?.data?.detail || 'OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await authAPI.sendOTP(formData.email);
      setSuccess('✓ New OTP sent! Check your email or backend console.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to send OTP. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              {step === 1 ? 'Start your journey with TravelAI' : 'Verify your email address'}
            </p>
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

          {step === 1 ? (
            <form onSubmit={handleRegister} className="auth-form" autoComplete="off">
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
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
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
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
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
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  minLength={8}
                />
                <small className="form-hint">Minimum 8 characters</small>
              </div>

              <button type="submit" className="btn btn-gradient btn-block" disabled={loading}>
                <UserPlus size={20} />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                />
                <small className="form-hint">
                  Check your email for the 6-digit verification code.
                  <br />
                  <strong>Development Mode:</strong> OTP is also printed in backend console.
                </small>
              </div>

              <button type="submit" className="btn btn-gradient btn-block" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button 
                type="button" 
                className="btn btn-outline btn-block" 
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend OTP
              </button>

              <div className="dev-mode-notice" style={{
                marginTop: '20px',
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                fontSize: '13px',
                color: '#495057'
              }}>
                <strong>📝 Development Mode:</strong>
                <p style={{ margin: '8px 0 0 0' }}>
                  If you don't receive the email, check the backend terminal for the OTP code.
                  <br />
                  Or run: <code style={{
                    background: '#e9ecef',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>python3 check_otp.py {formData.email}</code>
                </p>
              </div>
            </form>
          )}

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
