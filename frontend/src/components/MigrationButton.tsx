import React, { useState } from 'react';
import { API_URL } from '../services/api';
import { getToken } from '../services/authService';
import axios from 'axios';

interface MigrationButtonProps {
  onComplete?: () => void;
}

const MigrationButton: React.FC<MigrationButtonProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const runMigration = async () => {
    if (!confirm('This will add phone fields to the products table. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${API_URL}/migrations/add-phone-fields`,
        {},
        {
          headers: { Authorization: `Bearer ${getToken()}` }
        }
      );

      if (response.data.success) {
        setMessage(`✅ ${response.data.message}`);
        if (onComplete) {
          onComplete();
        }
      } else {
        setMessage(`❌ Migration failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      setMessage(`❌ Migration failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🔧 Database Migration
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Add phone-specific fields to the products table to enable the unified product system.
          This allows phones and accessories to be sold together in the POS system.
        </p>
        
        <button
          onClick={runMigration}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium text-sm ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? '🔄 Running Migration...' : '🚀 Run Phone Fields Migration'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default MigrationButton;
