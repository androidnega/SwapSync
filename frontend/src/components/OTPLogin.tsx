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
  const [step, setStep] = useState<'userid' | 'otp'>('userid');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Debounced user ID validation
  useEffect(() => {
    if (!userId.trim() || userId.length < 3) {
      setIsValid(false);
      setError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setValidating(true);
      setError('');
      
      try {
        const response = await axios.post(`${API_URL}/auth/otp/validate-userid`, {
          user_id: userId.trim()
        });
        
        if (response.data.valid && response.data.has_phone) {
          setIsValid(true);
          setError('');
        } else if (response.data.valid && !response.data.has_phone) {
          setIsValid(false);
          setError('No phone number registered. Use password login.');
        } else {
          setIsValid(false);
          setError('User ID not found');
        }
      } catch (err) {
        setIsValid(false);
        setError('');
      } finally {
        setValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [userId]);

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
    if (!userId.trim() || !isValid) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/otp/request`, {
        username: userId.trim()
      });

      if (response.data.success) {
        setMaskedPhone(response.data.phone_number_masked);
        setStep('otp');
        setCountdown(response.data.expires_in || 300);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        setError('OTP login is currently disabled by administrator');
      } else {
        setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/otp/verify`, {
        username: userId.trim(),
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
        username: userId.trim()
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
    <div className="w-full">
      {/* Compact Header */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">
          {step === 'userid' 
            ? 'Enter your user ID to receive OTP'
            : 'Enter the 4-digit code'}
        </p>
      </div>

      {/* User ID Step */}
      {step === 'userid' && (
        <form onSubmit={handleRequestOTP} className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              User ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                placeholder="e.g., ADM-0001"
                required
                disabled={loading}
                maxLength={9}
                className={`w-full px-3 py-2 text-sm border-2 rounded focus:outline-none transition-all ${
                  !userId.trim()
                    ? 'border-gray-300 focus:border-blue-500'
                    : validating
                    ? 'border-blue-400 bg-blue-50'
                    : isValid
                    ? 'border-green-500 bg-green-50 focus:border-green-600'
                    : userId.length < 3
                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                    : 'border-yellow-400 bg-yellow-50 focus:border-yellow-500'
                }`}
                autoFocus
              />
              {validating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {isValid && !validating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                  ✓
                </div>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isValid || validating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition disabled:opacity-50 text-sm"
          >
            {loading ? 'Sending...' : 'Request'}
          </button>
        </form>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
            <p className="text-xs text-blue-900">
              Code sent to {maskedPhone}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs text-center">
              {error}
            </div>
          )}

          <div>
            <OTPInput
              length={4}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOTP}
              disabled={loading || countdown === 0}
              error={!!error}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className={countdown < 60 ? 'text-red-600 font-bold' : ''}>
              ⏱️ {formatTime(countdown)}
            </span>
            <span>{otp.length}/4</span>
          </div>

          {canResend || countdown === 0 ? (
            <button
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-sm"
            >
              🔄 Resend
            </button>
          ) : null}

          <button
            onClick={() => {
              setStep('userid');
              setOtp('');
              setError('');
            }}
            className="w-full text-gray-600 hover:text-gray-800 underline text-xs"
          >
            ← Change User ID
          </button>
        </div>
      )}

    </div>
  );
};

export default OTPLogin;

