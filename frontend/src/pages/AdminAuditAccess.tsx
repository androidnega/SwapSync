import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserShield, faKey, faChartPie, faUsers, faEye, faLock } from '@fortawesome/free-solid-svg-icons';

interface Manager {
  id: number;
  username: string;
  full_name: string;
  company_name?: string;
  email: string;
  has_audit_code: boolean;
  is_active: number;
  created_at: string;
  last_login: string | null;
}

const AdminAuditAccess: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [auditCode, setAuditCode] = useState('');
  const [managerData, setManagerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await api.get('/audit/list-ceos');
      setManagers(response.data.managers || response.data.ceos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Managers:', error);
      setLoading(false);
    }
  };

  const requestAuditAccess = async () => {
    if (!selectedManager) {
      setMessage('❌ Please select a Manager first');
      return;
    }

    if (!auditCode || auditCode.length !== 6) {
      setMessage('❌ Please enter a valid 6-digit audit code');
      return;
    }

    try {
      // Validate expiring audit code
      const validateResponse = await api.post('/audit/expiring/validate', {
        manager_id: selectedManager.id,
        code: auditCode
      });

      console.log('✅ Audit code validated:', validateResponse.data);

      // Fetch Manager data using staff admin/companies endpoint
      const response = await api.get('/staff/admin/companies');
      
      // Find the manager's data
      const managerCompany = response.data.companies?.find((c: any) => c.manager.id === selectedManager.id);
      
      if (!managerCompany) {
        throw new Error('Manager data not found');
      }

      // Format data to match expected structure
      const formattedData = {
        manager_info: {
          id: managerCompany.manager.id,
          username: managerCompany.manager.username,
          full_name: managerCompany.manager.full_name,
          email: managerCompany.manager.email,
          created_at: managerCompany.manager.created_at,
          last_login: managerCompany.manager.last_login
        },
        business_stats: {
          total_customers: 0,  // Not available in staff endpoint
          total_phones: 0,  
          total_swaps: 0,   
          total_sales: 0,   
          total_repairs: 0, 
          sales_revenue: 0.0,
          repair_revenue: 0.0,
          total_revenue: 0.0
        },
        staff: managerCompany.staff.map((s: any) => ({
          id: s.id,
          username: s.username,
          full_name: s.full_name,
          role: s.role,
          email: s.email || '',
          is_active: s.is_active
        })),
        recent_activity: managerCompany.recent_activities || []
      };

      setManagerData(formattedData);
      setMessage('✅ Audit access granted! Viewing Manager data...');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Audit access error:', error);
      const errorDetail = error.response?.data?.detail || error.message || 'Invalid audit code or access denied';
      setMessage(`❌ ${errorDetail}`);
      setManagerData(null);
    }
  };

  const closeManagerDataView = () => {
    setManagerData(null);
    setAuditCode('');
    setSelectedManager(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="mx-0 md:mx-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Manager Audit Access</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Access Manager data (requires audit code)
          </p>
        </div>

        {message && (
          <div className={`p-3 md:p-4 rounded-lg text-sm md:text-base ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {!managerData ? (
          <>
            {/* Manager Selection */}
            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Select Manager to Audit</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {managers.map(manager => (
                  <div
                    key={manager.id}
                    onClick={() => setSelectedManager(manager)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedManager?.id === manager.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {manager.full_name.charAt(0)}
                      </div>
                      <div>
                        {manager.company_name && (
                          <div className="font-bold text-purple-700 text-sm">{manager.company_name}</div>
                        )}
                        <div className="font-semibold text-gray-900">{manager.full_name}</div>
                        <div className="text-sm text-gray-500">@{manager.username}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Email: {manager.email}</div>
                      <div className="mt-1">
                        Status: {manager.is_active ? '✅ Active' : '❌ Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Code Entry */}
            {selectedManager && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-4 md:p-8 border-2 border-purple-200">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-4 md:mb-6">
                    <div className="bg-purple-600 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                      <FontAwesomeIcon icon={faLock} className="text-xl md:text-2xl" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Enter 90-Second Expiring Code</h3>
                    <p className="text-gray-600 text-xs md:text-sm mt-2">
                      Request the expiring audit code from <strong>{selectedManager.full_name}</strong>
                      {selectedManager.company_name && <> ({selectedManager.company_name})</>}
                    </p>
                    <p className="text-red-600 text-xs mt-1 font-semibold">
                      ⏰ Code expires in 90 seconds - use immediately!
                    </p>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={auditCode}
                      onChange={(e) => setAuditCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-4 text-center text-3xl font-mono font-bold border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Enter the 6-digit code provided by the Manager
                    </p>
                  </div>

                  <button
                    onClick={requestAuditAccess}
                    disabled={auditCode.length !== 6}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faKey} className="mr-2" />
                    Verify & Access Manager Data
                  </button>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>⚠️ Audit Access:</strong> This action is logged. Only use for legitimate auditing purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Manager Data View */
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  <FontAwesomeIcon icon={faUserShield} className="mr-3 text-purple-600" />
                  {managerData.manager_info.full_name}'s Business Data
                </h2>
                <button
                  onClick={closeManagerDataView}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close Audit View
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-semibold">{managerData.manager_info.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold">{managerData.manager_info.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-semibold">{new Date(managerData.manager_info.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-semibold">
                    {managerData.manager_info.last_login ? new Date(managerData.manager_info.last_login).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Statistics */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faChartPie} className="mr-2 text-blue-600" />
                Business Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-blue-600">{managerData.business_stats.total_customers}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Phones</p>
                  <p className="text-2xl font-bold text-green-600">{managerData.business_stats.total_phones}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Swaps</p>
                  <p className="text-2xl font-bold text-purple-600">{managerData.business_stats.total_swaps}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Sales</p>
                  <p className="text-2xl font-bold text-indigo-600">{managerData.business_stats.total_sales}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Repairs</p>
                  <p className="text-2xl font-bold text-orange-600">{managerData.business_stats.total_repairs}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Sales Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₵{managerData.business_stats.sales_revenue.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Repair Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">₵{managerData.business_stats.repair_revenue.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">₵{managerData.business_stats.total_revenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Staff Members */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-green-600" />
                Staff Members ({managerData.staff.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managerData.staff.map((staff: any) => (
                  <div key={staff.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        staff.role === 'shop_keeper' ? 'bg-blue-600' : 'bg-green-600'
                      }`}>
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{staff.full_name}</div>
                        <div className="text-sm text-gray-500">@{staff.username}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Role: {staff.role.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity (Last 50)</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {managerData.recent_activity.map((log: any) => (
                  <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{log.action}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Module: {log.module}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditAccess;
