import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotAuthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            Your current role does not allow access to this resource. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            🚪 Logout & Switch User
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>If you need additional permissions, please contact:</p>
          <p className="font-medium text-gray-700 mt-1">Your CEO or System Administrator</p>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;

