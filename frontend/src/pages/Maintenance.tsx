/**
 * Maintenance Page
 * Shown when system is in maintenance mode
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MaintenanceProps {
  reason?: string;
}

const Maintenance: React.FC<MaintenanceProps> = ({ reason = 'System maintenance in progress' }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">🔧</div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Under Maintenance
        </h1>
        
        {/* Reason */}
        <p className="text-gray-600 mb-6">
          {reason}
        </p>
        
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-sm text-blue-900 font-medium mb-2">
            What's happening?
          </p>
          <p className="text-xs text-blue-800">
            We're performing system updates to improve your experience. 
            This usually takes just a few minutes.
          </p>
        </div>

        {/* Status */}
        <div className="space-y-2 text-sm text-gray-600 mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span>System updates in progress</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Login still available</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium text-sm"
          >
            🔄 Refresh Page
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-medium text-sm"
          >
            ← Back to Login
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-6">
          Thank you for your patience
        </p>
      </div>
    </div>
  );
};

export default Maintenance;

