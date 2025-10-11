import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';

import { API_URL } from '../services/api';

interface Backup {
  filename: string;
  size_mb: number;
  created_at: string;
}

const Settings: React.FC = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // SMS Configuration
  const [smsConfig, setSmsConfig] = useState({
    arkasel_api_key: '',
    arkasel_sender_id: 'SwapSync',
    hubtel_client_id: '',
    hubtel_client_secret: '',
    hubtel_sender_id: 'SwapSync',
    enabled: false
  });

  // System Cleanup (Super Admin)
  const [userRole, setUserRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dataCounts, setDataCounts] = useState<any>(null);
  const [deleteOptions, setDeleteOptions] = useState({
    delete_phones: false,
    delete_products: false,
    delete_customers: false,
    delete_swaps: false,
    delete_sales: false,
    delete_repairs: false,
    delete_product_sales: false,
    delete_all: false
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchMaintenanceStatus();
    fetchBackups();
    fetchSMSConfig();
    fetchUserRole();
  }, []);

  const fetchUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
  };

  const fetchDataCounts = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/system-cleanup/data-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDataCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch data counts:', error);
    }
  };

  const handleDeleteData = async () => {
    if (!confirmPassword) {
      alert('Please enter your password to confirm');
      return;
    }

    const selectedCount = Object.values(deleteOptions).filter(v => v).length;
    if (selectedCount === 0) {
      alert('Please select at least one data type to delete');
      return;
    }

    const confirmMessage = deleteOptions.delete_all 
      ? '⚠️ WARNING! This will delete ALL data from the system (except admin accounts). This action CANNOT be undone! Type YES to confirm.'
      : `Are you sure you want to delete selected data? This action CANNOT be undone!`;
    
    const userConfirm = deleteOptions.delete_all ? prompt(confirmMessage) : confirm(confirmMessage);
    
    if (deleteOptions.delete_all && userConfirm !== 'YES') {
      return;
    }
    
    if (!deleteOptions.delete_all && !userConfirm) {
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/system-cleanup/delete-data`,
        { ...deleteOptions, confirm_password: confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = response.data;
      setMessage(`✅ Successfully deleted ${result.total_deleted} record(s)`);
      setShowDeleteModal(false);
      setConfirmPassword('');
      setDeleteOptions({
        delete_phones: false,
        delete_products: false,
        delete_customers: false,
        delete_swaps: false,
        delete_sales: false,
        delete_repairs: false,
        delete_product_sales: false,
        delete_all: false
      });
      fetchDataCounts();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSMSConfig = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/sms-config/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create masked values that match the actual length
      const maskKey = (length: number = 32) => '•'.repeat(Math.max(length, 8)); // Minimum 8 dots
      
      setSmsConfig({
        arkasel_api_key: response.data.arkasel_api_key_set ? maskKey(response.data.arkasel_api_key_length || 32) : '',
        arkasel_sender_id: response.data.arkasel_sender_id || 'SwapSync',
        hubtel_client_id: response.data.hubtel_client_id_set ? maskKey(response.data.hubtel_client_id_length || 20) : '',
        hubtel_client_secret: response.data.hubtel_client_secret_set ? maskKey(response.data.hubtel_client_secret_length || 32) : '',
        hubtel_sender_id: response.data.hubtel_sender_id || 'SwapSync',
        enabled: response.data.enabled || false
      });
    } catch (error) {
      console.error('Failed to fetch SMS config:', error);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/maintenance/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaintenanceMode(response.data.maintenance_mode);
      setMaintenanceReason(response.data.reason || '');
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/maintenance/backup/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/maintenance/backup/create`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Backup created: ${response.data.backup_filename}`);
      fetchBackups();
    } catch (error: any) {
      setMessage(`❌ Failed to create backup: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`⚠️ Are you sure you want to restore from "${filename}"? This will overwrite your current database!`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const token = getToken();
      await axios.post(`${API_URL}/maintenance/backup/restore/${filename}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Database restored from ${filename}. Please restart the application.`);
    } catch (error: any) {
      setMessage(`❌ Failed to restore backup: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup "${filename}"?`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/maintenance/backup/delete/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Backup deleted: ${filename}`);
      fetchBackups();
    } catch (error: any) {
      setMessage(`❌ Failed to delete backup: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/maintenance/export/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`✅ Data exported to: ${response.data.file_path}`);
    } catch (error: any) {
      setMessage(`❌ Failed to export data: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = getToken();
      if (maintenanceMode) {
        await axios.post(`${API_URL}/maintenance/disable`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Maintenance mode disabled');
        setMaintenanceMode(false);
      } else {
        const reason = prompt('Enter maintenance reason:') || 'System maintenance';
        await axios.post(`${API_URL}/maintenance/enable?reason=${encodeURIComponent(reason)}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Maintenance mode enabled');
        setMaintenanceMode(true);
        setMaintenanceReason(reason);
      }
    } catch (error: any) {
      setMessage(`❌ Failed to toggle maintenance mode: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMSConfig = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = getToken();
      
      // Prepare data - CRITICAL: Only send API keys if user actually entered new values
      const payload: any = {
        enabled: smsConfig.enabled,
        arkasel_sender_id: smsConfig.arkasel_sender_id,
        hubtel_sender_id: smsConfig.hubtel_sender_id
      };
      
      // Only include API keys if they're NOT masked dots (•••) AND not empty
      // This prevents overwriting existing encrypted keys with the placeholder
      const isMasked = (value: string) => /^•+$/.test(value); // Check if only dots
      
      if (smsConfig.arkasel_api_key && 
          !isMasked(smsConfig.arkasel_api_key) && 
          smsConfig.arkasel_api_key.trim() !== '') {
        payload.arkasel_api_key = smsConfig.arkasel_api_key;
      }
      
      if (smsConfig.hubtel_client_id && 
          !isMasked(smsConfig.hubtel_client_id) && 
          smsConfig.hubtel_client_id.trim() !== '') {
        payload.hubtel_client_id = smsConfig.hubtel_client_id;
      }
      
      if (smsConfig.hubtel_client_secret && 
          !isMasked(smsConfig.hubtel_client_secret) && 
          smsConfig.hubtel_client_secret.trim() !== '') {
        payload.hubtel_client_secret = smsConfig.hubtel_client_secret;
      }
      
      console.log('💾 Saving SMS config (API keys excluded if masked):', {
        ...payload,
        arkasel_api_key: payload.arkasel_api_key ? '***' : 'not included',
        hubtel_client_id: payload.hubtel_client_id ? '***' : 'not included',
        hubtel_client_secret: payload.hubtel_client_secret ? '***' : 'not included'
      });
      
      const response = await axios.post(`${API_URL}/sms-config/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ SMS configuration saved successfully! Providers: ' + 
        (response.data.arkasel_enabled ? 'Arkasel ✓' : '') + 
        (response.data.hubtel_enabled ? ' Hubtel ✓' : '') +
        (!response.data.arkasel_enabled && !response.data.hubtel_enabled ? 'None configured' : '')
      );
      
      // Refresh config to show masked values
      fetchSMSConfig();
    } catch (error: any) {
      setMessage(`❌ Failed to save SMS config: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleTestSMS = async () => {
    const phoneNumber = prompt('Enter phone number to test SMS (e.g., +233241234567 or 0241234567):');
    if (!phoneNumber) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/sms-config/test?phone_number=${encodeURIComponent(phoneNumber)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(`✅ ${response.data.message} Provider: ${response.data.provider}`);
    } catch (error: any) {
      setMessage(`❌ Failed to send test SMS: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleShowDebugInfo = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/sms-config/debug`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebugInfo(response.data);
      setShowDebugInfo(true);
    } catch (error: any) {
      setMessage(`❌ Failed to get debug info: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">System Settings</h1>

        {/* Status Message */}
        {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* SMS Configuration */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">📱 SMS Configuration</h2>
        <p className="text-gray-600 mb-4 text-xs md:text-sm">Configure Arkasel (Primary) and Hubtel (Fallback)</p>
        
        {/* Arkasel Configuration (Primary) */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">PRIMARY</span>
            Arkasel SMS
          </h3>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                API Key {smsConfig.arkasel_api_key && /^•+$/.test(smsConfig.arkasel_api_key) && <span className="text-green-600 text-xs">✓ Configured</span>}
              </label>
              <input
                type="password"
                value={smsConfig.arkasel_api_key}
                onChange={(e) => setSmsConfig({ ...smsConfig, arkasel_api_key: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder={smsConfig.arkasel_api_key && /^•+$/.test(smsConfig.arkasel_api_key) ? 'API key saved (enter new one to update)' : 'Enter API key'}
              />
              {smsConfig.arkasel_api_key && /^•+$/.test(smsConfig.arkasel_api_key) && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ API key is securely stored ({smsConfig.arkasel_api_key.length} characters). Leave as-is to keep current key, or enter a new one to update.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Sender ID</label>
              <input
                type="text"
                value={smsConfig.arkasel_sender_id}
                onChange={(e) => setSmsConfig({ ...smsConfig, arkasel_sender_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="SwapSync"
              />
            </div>
          </div>
        </div>

        {/* Hubtel Configuration (Fallback) */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <h3 className="text-sm md:text-base font-semibold text-green-900 mb-3 flex items-center gap-2">
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">FALLBACK</span>
            Hubtel SMS
          </h3>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={smsConfig.hubtel_client_id}
                onChange={(e) => setSmsConfig({ ...smsConfig, hubtel_client_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="Client ID"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={smsConfig.hubtel_client_secret}
                onChange={(e) => setSmsConfig({ ...smsConfig, hubtel_client_secret: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="Secret"
              />
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Sender ID</label>
              <input
                type="text"
                value={smsConfig.hubtel_sender_id}
                onChange={(e) => setSmsConfig({ ...smsConfig, hubtel_sender_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                placeholder="SwapSync"
              />
            </div>
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={smsConfig.enabled}
              onChange={(e) => setSmsConfig({ ...smsConfig, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Enable SMS Notifications</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Customers will receive SMS updates for repairs, sales, and swaps via Arkasel (primary) or Hubtel (fallback)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>ℹ️ How it works:</strong> SwapSync tries Arkasel first. If it fails, it automatically uses Hubtel. This ensures 99.9% SMS delivery!
          </p>
        </div>

        <div className="mt-4 flex gap-3 flex-wrap">
          <button
            onClick={handleSaveSMSConfig}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : '💾 Save SMS Configuration'}
          </button>
          <button
            onClick={handleTestSMS}
            disabled={loading || !smsConfig.enabled}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
            title={!smsConfig.enabled ? 'Enable SMS first' : 'Send a test SMS'}
          >
            📱 Test SMS
          </button>
          <button
            onClick={handleShowDebugInfo}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
            title="Check SMS config status in database"
          >
            🔍 Debug Info
          </button>
          <a
            href="https://sms.arkesel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium inline-block"
          >
            Open Arkasel Dashboard
          </a>
        </div>

        {/* Debug Info Modal */}
        {showDebugInfo && debugInfo && (
          <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-bold">🔍 SMS Config Debug Info</h3>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-red-400 hover:text-red-300"
              >
                ✕ Close
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            
            {debugInfo.status === 'no_config' && (
              <div className="mt-3 bg-red-900 bg-opacity-50 border border-red-500 p-3 rounded text-red-200">
                <p className="font-bold">❌ Table Missing!</p>
                <p className="mt-1">{debugInfo.message}</p>
                <p className="mt-1 text-yellow-300">Solution: {debugInfo.solution}</p>
              </div>
            )}
            
            {debugInfo.status === 'config_exists' && debugInfo.arkasel_decrypted_length === 0 && (
              <div className="mt-3 bg-yellow-900 bg-opacity-50 border border-yellow-500 p-3 rounded text-yellow-200">
                <p className="font-bold">⚠️ API Key Not Saved!</p>
                <p className="mt-1">Table exists but API key is empty in database.</p>
                <p className="mt-1 text-green-300">Action: Enter your API key above and click Save.</p>
              </div>
            )}
            
            {debugInfo.status === 'config_exists' && debugInfo.arkasel_decrypted_length > 0 && (
              <div className="mt-3 bg-green-900 bg-opacity-50 border border-green-500 p-3 rounded text-green-200">
                <p className="font-bold">✅ API Key Saved!</p>
                <p className="mt-1">Encrypted: {debugInfo.arkasel_api_key_encrypted_length} chars → Decrypted: {debugInfo.arkasel_decrypted_length} chars</p>
                <p className="mt-1">Arkasel enabled: {debugInfo.arkasel_enabled ? '✅ Yes' : '❌ No'}</p>
                <p className="mt-1">SMS enabled: {debugInfo.sms_enabled ? '✅ Yes' : '❌ No'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Login Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">🔐 Login Controls</h2>
        
        <div className="space-y-4">
          {/* OTP Login Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm font-semibold text-gray-800">SMS OTP Login</p>
              <p className="text-xs text-gray-500">
                {smsConfig.enabled ? (
                  <span className="text-green-600 font-medium">✓ Enabled - Users can login with OTP</span>
                ) : (
                  <span className="text-gray-500">Disabled - Password only</span>
                )}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsConfig.enabled}
                onChange={async (e) => {
                  const newEnabled = e.target.checked;
                  setSmsConfig({ ...smsConfig, enabled: newEnabled });
                  
                  // Auto-save when toggled - ONLY send enabled status, NOT the masked API keys!
                  try {
                    const token = getToken();
                    await axios.post(`${API_URL}/sms-config/`, 
                      { 
                        enabled: newEnabled,
                        arkasel_sender_id: smsConfig.arkasel_sender_id,
                        hubtel_sender_id: smsConfig.hubtel_sender_id
                        // DON'T send masked API keys (********) - they're already in DB!
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setMessage(newEnabled ? '✅ OTP Login enabled' : '✅ OTP Login disabled');
                    setTimeout(() => setMessage(''), 3000);
                  } catch (err: any) {
                    setMessage('❌ Failed to update OTP setting');
                    setSmsConfig({ ...smsConfig, enabled: !newEnabled });
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {maintenanceMode ? (
                  <span className="text-red-600">Maintenance Mode ON</span>
                ) : (
                  <span className="text-gray-800">Maintenance Mode</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {maintenanceMode ? (
                  <span className="text-red-600 font-medium">⚠️ All users see maintenance page</span>
                ) : (
                  <span className="text-gray-500">System is operational</span>
                )}
              </p>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={loading}
              className={`px-4 py-1.5 rounded font-medium text-xs ${
                maintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              } disabled:opacity-50`}
            >
              {maintenanceMode ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">ℹ️ System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Application Version</p>
            <p className="font-medium">SwapSync v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Database</p>
            <p className="font-medium">SQLite (Local)</p>
          </div>
          <div>
            <p className="text-gray-500">Backend API</p>
            <p className="font-medium">FastAPI (Python)</p>
          </div>
          <div>
            <p className="text-gray-500">Frontend</p>
            <p className="font-medium">React + Electron</p>
          </div>
        </div>
      </div>

      {/* Danger Zone - Super Admin Only */}
      {userRole === 'super_admin' && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-2 flex items-center gap-2">
            ⚠️ Danger Zone
          </h2>
          <p className="text-red-700 mb-4">
            Delete system data. This action is irreversible. Admin accounts will NOT be deleted.
          </p>
          
          <button
            onClick={() => {
              setShowDeleteModal(true);
              fetchDataCounts();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            🗑️ Manage System Data
          </button>
        </div>
      )}

      {/* Delete Data Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 bg-red-600 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                ⚠️ Delete System Data
              </h2>
              <p className="text-red-100 mt-1">Select what to delete. This action CANNOT be undone!</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Data Counts */}
              {dataCounts && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Current Data in System:</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Phones:</span>
                      <span className="font-bold">{dataCounts.phones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Products:</span>
                      <span className="font-bold">{dataCounts.products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customers:</span>
                      <span className="font-bold">{dataCounts.customers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Swaps:</span>
                      <span className="font-bold">{dataCounts.swaps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales:</span>
                      <span className="font-bold">{dataCounts.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repairs:</span>
                      <span className="font-bold">{dataCounts.repairs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product Sales:</span>
                      <span className="font-bold">{dataCounts.product_sales}</span>
                    </div>
                    <div className="flex justify-between col-span-2 border-t pt-2 mt-2">
                      <span className="text-green-600 font-semibold">Protected Admin Users:</span>
                      <span className="font-bold text-green-600">{dataCounts.admin_users}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Deletion Options */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Select Data to Delete:</h3>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_phones}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_phones: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">📱 Delete All Phones ({dataCounts?.phones || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_products}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_products: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">🛍️ Delete All Products ({dataCounts?.products || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_customers}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_customers: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">👥 Delete All Customers ({dataCounts?.customers || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_swaps}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_swaps: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">🔄 Delete All Swap Transactions ({dataCounts?.swaps || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_sales}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_sales: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">💵 Delete All Phone Sales ({dataCounts?.sales || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_product_sales}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_product_sales: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">🛒 Delete All Product Sales ({dataCounts?.product_sales || 0})</span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteOptions.delete_repairs}
                    onChange={(e) => setDeleteOptions({...deleteOptions, delete_repairs: e.target.checked, delete_all: false})}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="font-medium">🔧 Delete All Repairs ({dataCounts?.repairs || 0})</span>
                </label>

                <div className="border-t-2 border-red-300 pt-4 mt-4">
                  <label className="flex items-center gap-3 p-4 border-2 border-red-500 bg-red-100 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteOptions.delete_all}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDeleteOptions({
                          delete_phones: checked,
                          delete_products: checked,
                          delete_customers: checked,
                          delete_swaps: checked,
                          delete_sales: checked,
                          delete_repairs: checked,
                          delete_product_sales: checked,
                          delete_all: checked
                        });
                      }}
                      className="w-6 h-6 text-red-600"
                    />
                    <div>
                      <span className="font-bold text-red-900 text-lg">⚠️ DELETE EVERYTHING</span>
                      <p className="text-xs text-red-700">This will delete ALL data above (admin accounts will be preserved)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Password Confirmation */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Confirm Your Password to Proceed:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border-2 border-red-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
              >
                {loading ? 'Deleting...' : '🗑️ Delete Selected Data'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Settings;

