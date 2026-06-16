import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Key, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.forgotPassword(email);
      console.log('Forgot password response:', response.data);
      
      setSuccess('✓ Password reset code sent! Check your email or backend console.');
      setStep(2);
    } catch (err) {
      console.error('Forgot password error:', err);
      
      if (err.response?.status === 404) {
        setError('Email not found. Please check and try again.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword(email, otp, newPassword);
      console.log('Reset password response:', response.data);
      
      setSuccess('✓ Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      
      if (err.response?.status === 400) {
        setError('Invalid or expired OTP. Please request a new code.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Failed to reset password. Please try again.');
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
      await authAPI.forgotPassword(email);
      setSuccess('✓ New code sent! Check your email or backend console.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to send new code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1 className="auth-title">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h1>
            <p className="auth-subtitle">
              {step === 1 
                ? 'Enter your email to receive a password reset code' 
                : 'Enter the code and your new password'}
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
            <form onSubmit={handleSendOTP} className="auth-form">
              <div className="form-group">
                <label className="form-label">
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-gradient btn-block" disabled={loading}>
                <Key size={20} />
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>

              <div className="auth-footer" style={{ marginTop: '20px' }}>
                <Link to="/login" className="auth-link">
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label className="form-label">Reset Code</label>
                <input
                  type="text"
                  className="form-input otp-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  required
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                />
                <small className="form-hint">
                  Check your email for the 6-digit code.
                  <br />
                  <strong>Development Mode:</strong> Code is also in backend console.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={18} />
                  New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
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
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>

              <button type="submit" className="btn btn-gradient btn-block" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button 
                type="button" 
                className="btn btn-outline btn-block" 
                onClick={handleResendOTP}
                disabled={loading}
              >
                Resend Code
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
                  If you don't receive the email, check the backend terminal for the code.
                  <br />
                  Or run: <code style={{
                    background: '#e9ecef',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>python3 check_otp.py {email}</code>
                </p>
              </div>

              <div className="auth-footer" style={{ marginTop: '20px' }}>
                <Link to="/login" className="auth-link">
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
