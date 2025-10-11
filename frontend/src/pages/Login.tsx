import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import swapsyncImage from '../assets/img/swapsyng.png';
import { API_URL } from '../services/api';
import OTPLogin from '../components/OTPLogin';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetData, setResetData] = useState({
    username: '',
    phone_number: '',
    email: '',
    reset_token: '',
    new_password: '',
    confirm_password: ''
  });
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      console.log('Login successful:', response.user);
      
      // Redirect to dashboard
      navigate('/');
      window.location.reload(); // Reload to update auth state
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetData.username,
          phone_number: resetData.phone_number,
          email: resetData.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to request password reset');
      }

      setResetMessage('✅ Reset code sent via SMS! Check your phone.');
      setResetStep('verify');
    } catch (err: any) {
      setResetError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');

    if (resetData.new_password !== resetData.confirm_password) {
      setResetError('Passwords do not match');
      return;
    }

    if (resetData.new_password.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/password-reset/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: resetData.reset_token,
          new_password: resetData.new_password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setResetMessage('✅ Password reset successfully! You can now login.');
      setTimeout(() => {
        setShowResetModal(false);
        setResetStep('request');
        setResetData({
          username: '',
          phone_number: '',
          email: '',
          reset_token: '',
          new_password: '',
          confirm_password: ''
        });
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-sm">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6 text-center relative">
            <h1 className="text-2xl font-bold text-gray-800">SwapSync</h1>
            <p className="text-sm text-gray-500 mt-1">Login to your account</p>
            
            {/* Info Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition text-sm font-bold"
              title="About SwapSync"
            >
              i
            </button>
          </div>

          {/* Login Form Container - Fixed Height */}
          <div className="p-6" style={{ minHeight: '320px', maxHeight: '320px' }}>
            {/* Login Method Toggle */}
            <div className="flex items-center justify-center gap-3 text-sm mb-4">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`transition-all ${
                  loginMethod === 'password'
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
                style={{ textDecoration: 'none' }}
              >
                🔑 Password
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`transition-all ${
                  loginMethod === 'otp'
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
                style={{ textDecoration: 'none' }}
              >
                📱 SMS OTP
              </button>
            </div>

            {loginMethod === 'password' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="bg-red-50 text-red-800 p-2 rounded text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50 text-sm"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
            ) : (
              <OTPLogin
                onSuccess={(token, user) => {
                  authService.setToken(token);
                  authService.setUser(user);
                  navigate('/');
                  window.location.reload();
                }}
                onCancel={() => setLoginMethod('password')}
              />
            )}

          </div>

          {/* Copyright - Right after form */}
          <p className="text-center text-xs text-gray-500 pt-4 pb-6 border-t border-gray-100 mt-4">
            © 2025 SwapSync v1.0.0 · Developed by{' '}
            <a 
              href="tel:+233257940791" 
              className="text-gray-700 hover:text-blue-600 transition"
              style={{ textDecoration: 'none' }}
            >
              Manuel
            </a>
          </p>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">SwapSync</h2>
              <p className="text-sm text-gray-600 mt-1">
                Phone Swapping & Repair Shop Management System
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Manage phone swaps and sales</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Track repairs with SMS notifications</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Automatic profit/loss calculation</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Complete analytics and reporting</span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full relative">
            <div className="bg-white border-b border-gray-200 p-4 relative">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetStep('request');
                  setResetMessage('');
                  setResetError('');
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
              <h2 className="text-lg font-bold text-gray-800 pr-6">Reset Password</h2>
              <p className="text-xs text-gray-600 mt-1">
                {resetStep === 'request' 
                  ? 'Receive reset code via SMS' 
                  : 'Enter code and new password'}
              </p>
            </div>
            
            <div className="p-6" style={{ minHeight: '320px', maxHeight: '320px', overflowY: 'auto' }}>

            {resetMessage && (
              <div className="mb-3 p-2 bg-green-50 text-green-800 rounded text-xs">
                {resetMessage}
              </div>
            )}
            {resetError && (
              <div className="mb-3 p-2 bg-red-50 text-red-800 rounded text-xs">
                {resetError}
              </div>
            )}

            {/* Step 1: Request Reset */}
            {resetStep === 'request' && (
              <form onSubmit={handleResetRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={resetData.username}
                    onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                    placeholder="Your username"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={resetData.phone_number}
                    onChange={(e) => setResetData({ ...resetData, phone_number: e.target.value })}
                    placeholder="024XXXXXXX"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {/* Step 2: Verify and Reset */}
            {resetStep === 'verify' && (
              <form onSubmit={handleResetComplete} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetData.reset_token}
                    onChange={(e) => setResetData({ ...resetData, reset_token: e.target.value })}
                    placeholder="Code from SMS"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetData.new_password}
                    onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetData.confirm_password}
                    onChange={(e) => setResetData({ ...resetData, confirm_password: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  className="w-full text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  ← Back
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
  
  export default Login;

