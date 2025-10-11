/**
 * OTP Login Component
 * SMS-based authentication with 4-digit code
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/api';
import OTPInput from './OTPInput';

interface OTPLoginProps {
  onSuccess: (accessToken: string, user: any) => void;
  onCancel: () => void;
}

const OTPLogin: React.FC<OTPLoginProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'username' | 'otp'>('username');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp') return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/otp/request`, {
        username: username.trim()
      });

      if (response.data.success) {
        setMaskedPhone(response.data.phone_number_masked);
        setStep('otp');
        setCountdown(response.data.expires_in || 300);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        username: username.trim(),
        otp_code: otpCode
      });

      if (response.data.success) {
        onSuccess(response.data.access_token, response.data.user);
      } else {
        setError(response.data.message || 'Invalid OTP code');
        setOtp(''); // Clear OTP for retry
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Verification failed');
      setOtp(''); // Clear OTP for retry
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    setError('');
    setCanResend(false);
    setCountdown(300);
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/otp/request`, {
        username: username.trim()
      });
      
      if (response.data.success) {
        setMaskedPhone(response.data.phone_number_masked);
        setCountdown(response.data.expires_in || 300);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📱</div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          SMS Login
        </h2>
        <p className="text-gray-600">
          {step === 'username' 
            ? 'Enter your username to receive OTP'
            : 'Enter the 4-digit code sent to your phone'}
        </p>
      </div>

      {/* Username Step */}
      {step === 'username' && (
        <form onSubmit={handleRequestOTP} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending OTP...
              </span>
            ) : (
              'Send OTP Code'
            )}
          </button>
        </form>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <div className="space-y-6">
          {/* Phone Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-900 font-medium mb-1">
              Code sent to
            </p>
            <p className="text-lg font-bold text-blue-700">
              {maskedPhone}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center animate-shake">
              {error}
            </div>
          )}

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
              Enter 4-Digit Code
            </label>
            <OTPInput
              length={4}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOTP}
              disabled={loading || countdown === 0}
              error={!!error}
            />
          </div>

          {/* Status Info */}
          <div className="flex items-center justify-between text-sm">
            <span className={`font-mono font-bold ${countdown < 60 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
              ⏱️ {formatTime(countdown)}
            </span>
            <span className="text-gray-600">
              {otp.length}/4 digits
            </span>
          </div>

          {/* Resend Button */}
          {canResend || countdown === 0 ? (
            <button
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
            >
              🔄 Resend OTP
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500">
              Didn't receive code? Wait {formatTime(countdown)}
            </p>
          )}

          {/* Change Username */}
          <button
            onClick={() => {
              setStep('username');
              setOtp('');
              setError('');
            }}
            className="w-full text-gray-600 hover:text-gray-800 underline text-sm"
          >
            ← Change Username
          </button>
        </div>
      )}

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="w-full mt-6 text-gray-600 hover:text-gray-800 underline text-sm font-medium"
      >
        ← Use Password Instead
      </button>

      {/* Info Box */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-900 font-semibold mb-2">🔒 Secure Login</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>✓ Code valid for 5 minutes</li>
          <li>✓ Sent to your registered phone</li>
          <li>✓ Auto-submits after 4th digit</li>
        </ul>
      </div>
    </div>
  );
};

export default OTPLogin;

