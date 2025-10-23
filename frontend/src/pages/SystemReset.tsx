/**
 * System Reset Page - Manager Only
 * Allows managers to reset user data and system data
 */
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash, faExclamationTriangle, faShieldAlt, faUsers, faDatabase,
  faUndo, faCheck, faTimes, faLock, faKey
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

interface ResetOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  warning: string;
  endpoint: string;
}

const SystemReset: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedReset, setSelectedReset] = useState<ResetOption | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const resetOptions: ResetOption[] = [
    {
      id: 'customers',
      title: 'Reset Customer Data',
      description: 'Delete all customer records and related data',
      icon: faUsers,
      color: 'red',
      warning: 'This will permanently delete all customer records, phone numbers, and related transaction history.',
      endpoint: '/admin/reset/customers'
    },
    {
      id: 'repairs',
      title: 'Reset Repair Data',
      description: 'Delete all repair records and repair history',
      icon: faShieldAlt,
      color: 'orange',
      warning: 'This will permanently delete all repair records, repair items, and repair sales data.',
      endpoint: '/admin/reset/repairs'
    },
    {
      id: 'products',
      title: 'Reset Product Inventory',
      description: 'Delete all products and inventory data',
      icon: faDatabase,
      color: 'yellow',
      warning: 'This will permanently delete all products, stock movements, and inventory data.',
      endpoint: '/admin/reset/products'
    },
    {
      id: 'sales',
      title: 'Reset Sales Data',
      description: 'Delete all sales, swaps, and transaction records',
      icon: faUndo,
      color: 'purple',
      warning: 'This will permanently delete all sales, swaps, POS sales, and transaction history.',
      endpoint: '/admin/reset/sales'
    },
    {
      id: 'users',
      title: 'Reset User Accounts',
      description: 'Delete all user accounts except super admin',
      icon: faLock,
      color: 'red',
      warning: 'This will permanently delete all user accounts except super admin. You will need to recreate all users.',
      endpoint: '/admin/reset/users'
    },
    {
      id: 'all',
      title: 'Reset All System Data',
      description: 'Complete system reset - delete everything except super admin',
      icon: faTrash,
      color: 'red',
      warning: '⚠️ CRITICAL: This will permanently delete ALL data including customers, repairs, products, sales, and users (except super admin). This action cannot be undone!',
      endpoint: '/admin/reset/all'
    }
  ];

  const handleResetClick = (option: ResetOption) => {
    setSelectedReset(option);
    setShowPasswordModal(true);
    setManagerPassword('');
  };

  const handlePasswordVerification = async () => {
    if (!selectedReset || !managerPassword.trim()) {
      setMessage('❌ Please enter your manager password');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Verify manager password
      const response = await api.post('/admin/verify-manager-password', {
        password: managerPassword
      });

      if (response.data.verified) {
        setShowPasswordModal(false);
        setShowConfirmModal(true);
        setConfirmText('');
        setManagerPassword('');
      } else {
        setMessage('❌ Invalid manager password');
      }
    } catch (error: any) {
      console.error('Password verification error:', error);
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!selectedReset) return;

    // Require typing "RESET" for critical operations
    const requiredText = selectedReset.id === 'all' ? 'RESET ALL DATA' : 'RESET';
    if (confirmText !== requiredText) {
      setMessage(`❌ Please type "${requiredText}" to confirm`);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post(selectedReset.endpoint);
      setMessage(`✅ ${selectedReset.title} completed successfully`);
      setShowConfirmModal(false);
      setSelectedReset(null);
      setConfirmText('');
    } catch (error: any) {
      console.error('Reset error:', error);
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.red;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.red;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Reset</h1>
              <p className="text-gray-600">Reset system data and user accounts (Manager Only)</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Critical Warning</h3>
                <p className="text-red-700 text-sm">
                  These operations will permanently delete data and cannot be undone. 
                  Use with extreme caution and ensure you have proper backups before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Reset Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {resetOptions.map((option) => (
            <div
              key={option.id}
              className={`bg-white rounded-lg border-2 border-dashed p-6 transition-all hover:shadow-md ${getColorClasses(option.color)}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-white ${getIconColor(option.color)}`}>
                  <FontAwesomeIcon icon={option.icon} className="text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                  <p className="text-sm mb-4 opacity-80">{option.description}</p>
                  <button
                    onClick={() => handleResetClick(option)}
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      option.color === 'red'
                        ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                        : option.color === 'orange'
                        ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-300'
                        : option.color === 'yellow'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-yellow-300'
                        : 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300'
                    } disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processing...' : 'Reset'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Password Verification Modal */}
        {showPasswordModal && selectedReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FontAwesomeIcon icon={faLock} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Manager Password Required</h3>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedReset.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedReset.description}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-2" />
                    Please enter your manager password to proceed with this reset operation.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Password:
                </label>
                <input
                  type="password"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your manager password"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedReset(null);
                    setManagerPassword('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handlePasswordVerification}
                  disabled={loading || !managerPassword.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faKey} className="mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Verify Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Reset</h3>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedReset.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedReset.description}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{selectedReset.warning}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "{selectedReset.id === 'all' ? 'RESET ALL DATA' : 'RESET'}" to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={selectedReset.id === 'all' ? 'RESET ALL DATA' : 'RESET'}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedReset(null);
                    setConfirmText('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={loading || confirmText !== (selectedReset.id === 'all' ? 'RESET ALL DATA' : 'RESET')}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faKey} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      Confirm Reset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemReset;
