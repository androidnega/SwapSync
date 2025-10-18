import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { API_URL } from '../services/api';
import OTPLogin from '../components/OTPLogin';
import WelcomeToast from '../components/WelcomeToast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for session timeout
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'timeout') {
      setError('⏰ Your session has expired due to inactivity. Please login again.');
      // Clear the query parameter
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      console.log('Login successful:', response.user);
      
      // Show welcome toast
      setLoggedInUser(response.user);
      setShowWelcomeToast(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Reload to update auth state
      }, 1500);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
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
      {/* Welcome Toast on Login Success */}
      {showWelcomeToast && loggedInUser && (
        <WelcomeToast
          userName={loggedInUser.full_name || loggedInUser.username}
          userRole={loggedInUser.role}
          onClose={() => setShowWelcomeToast(false)}
          duration={1500}
        />
      )}
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        {/* Login Form - Centered */}
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Login to continue to your account</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-8">
              {/* Login Method Toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    loginMethod === 'password'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    loginMethod === 'otp'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  SMS OTP
                </button>
              </div>

              {loginMethod === 'password' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
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
                    
                    // Show welcome toast
                    setLoggedInUser(user);
                    setShowWelcomeToast(true);
                    
                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                      navigate('/');
                      window.location.reload();
                    }, 1500);
                  }}
                  onCancel={() => setLoginMethod('password')}
                />
              )}
            </div>
            
            {/* Copyright - Below card */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                © 2025 SwapSync v1.0.0 · Developed by{' '}
                <a 
                  href="tel:+233257940791" 
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                  style={{ textDecoration: 'none' }}
                >
                  Manuel
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

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

