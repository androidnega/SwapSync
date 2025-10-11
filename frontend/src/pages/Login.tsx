import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import swapsyncImage from '../assets/img/swapsync.webp';
import { API_URL } from '../services/api';
import OTPLogin from '../components/OTPLogin';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [showResetModal, setShowResetModal] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md">
          {/* Welcome Modal Header */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-40 h-40 rounded-2xl shadow-2xl overflow-hidden bg-white p-2">
                <img 
                  src={swapsyncImage} 
                  alt="SwapSync" 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">SwapSync</h1>
            <p className="text-blue-100 text-base mb-6">
              Phone Swapping & Repair Shop Management System
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 space-y-2.5 text-left">
              <div className="flex items-start">
                <span className="mr-3 text-lg">✓</span>
                <span className="text-sm">Manage phone swaps and sales</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">✓</span>
                <span className="text-sm">Track repairs with SMS notifications</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">✓</span>
                <span className="text-sm">Automatic profit/loss calculation</span>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-lg">✓</span>
                <span className="text-sm">Complete analytics and reporting</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm text-center mb-4">Login to access your dashboard</p>
              
              {/* Login Method Toggle - Text Links */}
              <div className="flex items-center justify-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`transition-all ${
                    loginMethod === 'password'
                      ? 'text-blue-600 font-semibold underline decoration-2 underline-offset-4'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  🔑 Password
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`transition-all ${
                    loginMethod === 'otp'
                      ? 'text-blue-600 font-semibold underline decoration-2 underline-offset-4'
                      : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  📱 SMS OTP
                </button>
              </div>
            </div>

            {loginMethod === 'password' ? (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <div className="bg-red-50 text-red-800 p-2 sm:p-3 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline"
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
      </div>
      
      {/* Developer Credit - Below Card */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600 px-2">
        <p>
          System developed and managed by{' '}
          <a 
            href="https://www.manuelcode.info" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
          >
            Manuel
          </a>
        </p>
        <p className="mt-1 sm:mt-2 text-xs text-gray-500">© 2025 SwapSync v1.0.0</p>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowResetModal(false);
                setResetStep('request');
                setResetMessage('');
                setResetError('');
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 pr-8">Reset Password</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
              {resetStep === 'request' 
                ? 'Enter your account details to receive a reset code via SMS' 
                : 'Enter the code sent to your phone and your new password'}
            </p>

            {/* Messages */}
            {resetMessage && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 text-green-800 rounded-lg text-xs sm:text-sm">
                {resetMessage}
              </div>
            )}
            {resetError && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 text-red-800 rounded-lg text-xs sm:text-sm">
                {resetError}
              </div>
            )}

            {/* Step 1: Request Reset */}
            {resetStep === 'request' && (
              <form onSubmit={handleResetRequest} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetData.username}
                    onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                    placeholder="Your username"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={resetData.email}
                    onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                    placeholder="Email used during registration"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={resetData.phone_number}
                    onChange={(e) => setResetData({ ...resetData, phone_number: e.target.value })}
                    placeholder="Phone number used during registration"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Sending...' : '📱 Send Reset Code via SMS'}
                </button>
              </form>
            )}

            {/* Step 2: Verify and Reset */}
            {resetStep === 'verify' && (
              <form onSubmit={handleResetComplete} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Reset Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetData.reset_token}
                    onChange={(e) => setResetData({ ...resetData, reset_token: e.target.value })}
                    placeholder="6-digit code from SMS"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl sm:text-2xl tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetData.new_password}
                    onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetData.confirm_password}
                    onChange={(e) => setResetData({ ...resetData, confirm_password: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'Resetting...' : '✓ Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setResetStep('request')}
                  className="w-full text-xs sm:text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to request
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

