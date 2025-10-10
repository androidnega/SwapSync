import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSync, faCopy, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

const CEOAuditCode: React.FC = () => {
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAuditCode();
  }, []);

  const fetchAuditCode = async () => {
    try {
      const response = await api.get('/audit/my-audit-code');
      setAuditData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching audit code:', error);
      setLoading(false);
    }
  };

  const regenerateCode = async () => {
    if (!confirm('Are you sure you want to regenerate your audit code? The old code will no longer work.')) {
      return;
    }

    try {
      const response = await api.post('/audit/regenerate-audit-code');
      setMessage('✅ Audit code regenerated successfully!');
      fetchAuditCode();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to regenerate audit code');
    }
  };

  const copyToClipboard = () => {
    if (auditData?.audit_code) {
      navigator.clipboard.writeText(auditData.audit_code);
      setMessage('✅ Audit code copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Code</h1>
          <p className="text-gray-600 mt-1">
            Your audit code allows System Administrators to access your business data for auditing purposes
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Audit Code Card */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white p-3 rounded-full">
                <FontAwesomeIcon icon={faKey} className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Audit Code</h2>
                <p className="text-sm text-gray-600">Share this only when audit access is needed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 mb-6 border-2 border-purple-300">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Current Audit Code:</p>
              <div className="text-5xl font-bold text-purple-600 tracking-wider mb-4 font-mono">
                {auditData?.audit_code || 'NOT SET'}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                Copy Code
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={regenerateCode}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
            >
              <FontAwesomeIcon icon={faSync} className="mr-2" />
              Regenerate Code
            </button>
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-start gap-3 mb-4">
            <FontAwesomeIcon icon={faShieldAlt} className="text-blue-600 text-xl mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is an Audit Code?</h3>
              <p className="text-gray-600 text-sm mb-3">
                The audit code is a security measure that allows System Administrators to access your complete business data when needed for:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                <li>Financial audits</li>
                <li>Troubleshooting system issues</li>
                <li>Compliance reviews</li>
                <li>Data verification</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Security Note:</strong> Only share your audit code with authorized System Administrators when required. 
              All audit access is logged for your records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOAuditCode;

