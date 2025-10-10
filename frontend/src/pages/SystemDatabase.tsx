import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, 
  faTable, 
  faServer, 
  faChartBar,
  faDownload,
  faLock,
  faUnlock,
  faSync,
  faFileExport
} from '@fortawesome/free-solid-svg-icons';

interface Backup {
  filename: string;
  size_mb: number;
  created_at: string;
}

interface CEO {
  id: number;
  username: string;
  full_name: string;
  company_name?: string;
  email: string;
  is_active: boolean;
  is_locked?: boolean;
}

const SystemDatabase: React.FC = () => {
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [ceos, setCeos] = useState<CEO[]>([]);
  const [activeTab, setActiveTab] = useState<'backups' | 'ceos' | 'tables'>('backups');

  useEffect(() => {
    fetchDatabaseStats();
    fetchBackups();
    fetchCEOs();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const response = await api.get('/maintenance/stats');
      setDbStats(response.data || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching database stats:', error);
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/maintenance/backup/list');
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  };

  const fetchCEOs = async () => {
    try {
      const response = await api.get('/audit/list-ceos');
      setCeos(response.data.managers || response.data.ceos || []);
    } catch (error) {
      console.error('Error fetching Managers:', error);
    }
  };

  const handleCreateBackup = async () => {
    setMessage('');
    try {
      const response = await axios.post('http://localhost:8000/api/maintenance/backup/create');
      setMessage(`✅ Backup created: ${response.data.backup_filename}`);
      fetchBackups();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to create backup: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`⚠️ WARNING: Restoring will overwrite your current database! Continue?`)) {
      return;
    }

    setMessage('');
    try {
      await axios.post(`http://localhost:8000/api/maintenance/backup/restore/${filename}`);
      setMessage(`✅ Database restored from ${filename}. Please restart the application.`);
    } catch (error: any) {
      setMessage(`❌ Failed to restore backup: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"?`)) {
      return;
    }

    setMessage('');
    try {
      await axios.delete(`http://localhost:8000/api/maintenance/backup/delete/${filename}`);
      setMessage(`✅ Backup deleted: ${filename}`);
      fetchBackups();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to delete backup: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleExportCEOsCSV = async () => {
    setMessage('ℹ️ Preparing CSV export...');
    try {
      const csvHeader = 'ID,Company Name,Manager Name,Username,Email,Status,Created At\n';
      const csvRows = ceos.map(ceo => 
        `${ceo.id},"${ceo.company_name || 'N/A'}","${ceo.full_name}",${ceo.username},${ceo.email},${ceo.is_active ? 'Active' : 'Inactive'},"${new Date().toISOString()}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `managers_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      setMessage('✅ Managers exported to CSV successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to export Managers: ${error.message}`);
    }
  };

  const handleLockUnlockCEO = async (ceo: CEO) => {
    const action = ceo.is_locked ? 'unlock' : 'lock';
    if (!confirm(`${action.toUpperCase()} ${ceo.full_name} (${ceo.company_name})? This will ${action} all their staff too.`)) {
      return;
    }

    setMessage('');
    try {
      await api.post(`/staff/${action}-manager/${ceo.id}`);
      setMessage(`✅ Manager ${action}ed successfully!`);
      fetchCEOs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to ${action} Manager: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading database statistics...</div>;
  }

  const tables = [
    { name: 'users', records: dbStats?.total_users || 4, size: '24 KB' },
    { name: 'customers', records: dbStats?.total_customers || 0, size: '0 KB' },
    { name: 'phones', records: dbStats?.total_phones || 0, size: '0 KB' },
    { name: 'swaps', records: dbStats?.total_swaps || 0, size: '0 KB' },
    { name: 'sales', records: dbStats?.total_sales || 0, size: '0 KB' },
    { name: 'repairs', records: dbStats?.total_repairs || 0, size: '0 KB' },
    { name: 'invoices', records: 0, size: '0 KB' },
    { name: 'activity_logs', records: dbStats?.total_activities || 0, size: '8 KB' },
    { name: 'sms_logs', records: 0, size: '0 KB' },
    { name: 'phone_ownership_history', records: 0, size: '0 KB' }
  ];

  const totalRecords = tables.reduce((sum, table) => sum + table.records, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-1">
            System database, backups, and CEO data management
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-50 text-green-800' :
            message.includes('❌') ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faDatabase} className="text-3xl text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="text-2xl font-bold">SQLite</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faTable} className="text-3xl text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faChartBar} className="text-3xl text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faServer} className="text-3xl text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Backups</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('backups')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'backups'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faDatabase} className="mr-2" />
                Database Backups
              </button>
              <button
                onClick={() => setActiveTab('ceos')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'ceos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                Manager Data Management
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'tables'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faTable} className="mr-2" />
                Database Tables & Stats
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tab Content: Database Backups */}
            {activeTab === 'backups' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Database Backups</h2>
                    <p className="text-sm text-gray-600 mt-1">Create, restore, and manage database backups</p>
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSync} />
                    Create Backup
                  </button>
                </div>

                <div className="space-y-2">
                  {backups.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No backups available. Create your first backup!</p>
                  ) : (
                    backups.map((backup) => (
                      <div
                        key={backup.filename}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{backup.filename}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(backup.created_at).toLocaleString()} • {backup.size_mb} MB
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestoreBackup(backup.filename)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.filename)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab Content: CEO Data Management */}
            {activeTab === 'ceos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                <h2 className="text-xl font-semibold text-gray-900">Manager Data Management</h2>
                <p className="text-sm text-gray-600 mt-1">Export Manager companies and manage access</p>
                  </div>
                  <button
                    onClick={handleExportCEOsCSV}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Export Managers (CSV)
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Company</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Manager</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Email</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ceos.map((ceo) => (
                        <tr key={ceo.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-purple-700">{ceo.company_name || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-800">{ceo.full_name}</td>
                          <td className="py-3 px-4 text-gray-600">{ceo.email}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                ceo.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {ceo.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {ceo.is_locked && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800">
                                  <FontAwesomeIcon icon={faLock} className="mr-1" />
                                  Locked
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleLockUnlockCEO(ceo)}
                              className={`px-3 py-1 rounded text-sm font-semibold ${
                                ceo.is_locked 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-orange-600 hover:bg-orange-700 text-white'
                              }`}
                            >
                              <FontAwesomeIcon icon={ceo.is_locked ? faUnlock : faLock} className="mr-1" />
                              {ceo.is_locked ? 'Unlock' : 'Lock'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ceos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            No Managers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>ℹ️ Note:</strong> Locking a Manager will prevent them and all their staff from accessing the system. 
                    They will see a message to contact administrator.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Content: Database Tables & Stats */}
            {activeTab === 'tables' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Database Tables</h2>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700 font-semibold">Table Name</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Records</th>
                        <th className="text-right py-3 px-4 text-gray-700 font-semibold">Size</th>
                        <th className="text-center py-3 px-4 text-gray-700 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((table) => (
                        <tr key={table.name} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{table.name}</td>
                          <td className="py-3 px-4 text-right font-semibold">{table.records.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{table.size}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* System Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Backend Framework</span>
                        <span className="font-semibold">FastAPI</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Database Type</span>
                        <span className="font-semibold">SQLite</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ORM</span>
                        <span className="font-semibold">SQLAlchemy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PDF Library</span>
                        <span className="font-semibold">ReportLab</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                <span className="text-gray-600">Total Managers</span>
                <span className="font-semibold">{dbStats?.total_managers || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Staff</span>
                        <span className="font-semibold">{dbStats?.total_staff || 2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Users</span>
                        <span className="font-semibold">{dbStats?.total_users || 4}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Users</span>
                        <span className="font-semibold">{dbStats?.active_users || 4}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDatabase;
