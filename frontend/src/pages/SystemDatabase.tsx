import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  faFileExport,
  faTrash,
  faExclamationTriangle
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
  const [activeTab, setActiveTab] = useState<'backups' | 'ceos' | 'tables' | 'clear'>('backups');

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
      const response = await api.get('/maintenance/backup/list');
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
      const response = await api.post('/maintenance/backup/create');
      
      // Check if PostgreSQL (Railway)
      if (response.data.success === false) {
        setMessage(`ℹ️ ${response.data.message}\n\n💡 Tip: ${response.data.tip}\n\n📋 ${response.data.instructions}`);
      } else {
        setMessage(`✅ Backup created: ${response.data.backup_filename}`);
        fetchBackups();
      }
      
      setTimeout(() => setMessage(''), 8000);  // Longer timeout for Railway message
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
      await api.post(`/maintenance/backup/restore/${filename}`);
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
      await api.delete(`/maintenance/backup/delete/${filename}`);
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

  const handleClearAllData = async () => {
    // Simple double confirmation instead of typing text
    if (!confirm(`⚠️ WARNING: This will permanently delete ALL data from the system!\n\nThis includes:\n• All customers\n• All phones\n• All swaps\n• All sales\n• All repairs\n• All invoices\n• All activity logs\n\nAre you absolutely sure?`)) {
      return;
    }

    // Second confirmation
    if (!confirm(`⚠️ FINAL CONFIRMATION\n\nThis action CANNOT be undone!\n\nClick OK to proceed with deleting ALL data.`)) {
      setMessage('❌ Data clearing cancelled.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setMessage('🔄 Clearing all data...');
    try {
      await api.post('/maintenance/clear-all-data');
      setMessage('✅ All data cleared successfully! The system has been reset.');
      fetchDatabaseStats();
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to clear data: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleClearSpecificData = async (dataType: string) => {
    const dataTypes = {
      customers: 'All customers and their data',
      phones: 'All phone records',
      swaps: 'All swap transactions',
      sales: 'All sales records',
      repairs: 'All repair records',
      invoices: 'All invoices',
      activities: 'All activity logs',
      'pos-sales': 'All POS sales transactions',
      users: 'All user accounts (except Super Admins)'
    };

    const description = dataTypes[dataType as keyof typeof dataTypes];
    
    // Extra confirmation for users (critical action)
    if (dataType === 'users') {
      if (!confirm(`⚠️ CRITICAL WARNING: This will permanently delete ${description}!\n\nThis includes:\n• All Managers\n• All Shop Keepers\n• All Repairers\n\nSuper Admin accounts will be protected.\n\nAre you absolutely sure?`)) {
        return;
      }
      
      // Second confirmation for users
      if (!confirm(`⚠️ FINAL CONFIRMATION\n\nClick OK to DELETE ALL USERS (except Super Admins).\n\nThis action CANNOT be undone!`)) {
        return;
      }
    } else {
      // Simple confirmation for other data types
      if (!confirm(`⚠️ WARNING: This will permanently delete ${description}!\n\nContinue?`)) {
        return;
      }
    }

    setMessage('🔄 Clearing data...');
    try {
      await api.post(`/maintenance/clear-${dataType}`);
      setMessage(`✅ ${description} cleared successfully!`);
      fetchDatabaseStats();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to clear ${dataType}: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading database statistics...</div>;
  }

  const tables = [
    { name: 'users', records: dbStats?.total_users || 0, size: 'N/A' },
    { name: 'customers', records: dbStats?.total_customers || 0, size: 'N/A' },
    { name: 'phones', records: dbStats?.total_phones || 0, size: 'N/A' },
    { name: 'products', records: dbStats?.total_products || 0, size: 'N/A' },
    { name: 'swaps', records: dbStats?.total_swaps || 0, size: 'N/A' },
    { name: 'sales', records: dbStats?.total_sales || 0, size: 'N/A' },
    { name: 'product_sales', records: dbStats?.total_product_sales || 0, size: 'N/A' },
    { name: 'repairs', records: dbStats?.total_repairs || 0, size: 'N/A' },
    { name: 'activity_logs', records: dbStats?.total_activities || 0, size: 'N/A' }
  ];

  const totalRecords = tables.reduce((sum, table) => sum + table.records, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            System database, backups, and Manager data
          </p>
        </div>

        {message && (
          <div className={`p-3 md:p-4 rounded-lg text-sm md:text-base ${
            message.includes('✅') ? 'bg-green-50 text-green-800' :
            message.includes('❌') ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
          <div className="bg-white p-3 md:p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <FontAwesomeIcon icon={faDatabase} className="text-xl md:text-3xl text-blue-600" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Database</p>
                <p className="text-lg md:text-2xl font-bold">SQLite</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 md:p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <FontAwesomeIcon icon={faTable} className="text-xl md:text-3xl text-green-600" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Tables</p>
                <p className="text-lg md:text-2xl font-bold">{tables.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 md:p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <FontAwesomeIcon icon={faChartBar} className="text-xl md:text-3xl text-purple-600" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Records</p>
                <p className="text-lg md:text-2xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 md:p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
              <FontAwesomeIcon icon={faServer} className="text-xl md:text-3xl text-indigo-600" />
              <div>
                <p className="text-xs md:text-sm text-gray-600">Backups</p>
                <p className="text-lg md:text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex -mb-px min-w-max md:min-w-0">
              <button
                onClick={() => setActiveTab('backups')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'backups'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faDatabase} className="mr-1 md:mr-2" />
                <span className="hidden sm:inline">Database </span>Backups
              </button>
              <button
                onClick={() => setActiveTab('ceos')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'ceos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faFileExport} className="mr-1 md:mr-2" />
                <span className="hidden sm:inline">Manager </span>Data<span className="hidden lg:inline"> Management</span>
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'tables'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faTable} className="mr-1 md:mr-2" />
                <span className="hidden sm:inline">Database </span>Tables<span className="hidden lg:inline"> & Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('clear')}
                className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === 'clear'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-1 md:mr-2" />
                <span className="hidden sm:inline">Data </span>Clearing
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
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No backups available.</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                        <h4 className="font-semibold text-blue-900 mb-2">📦 Railway PostgreSQL Backups</h4>
                        <p className="text-sm text-blue-700">
                          Railway provides automatic daily backups for PostgreSQL databases.
                          Access them from: <strong>Railway Dashboard → PostgreSQL service → Backups tab</strong>
                        </p>
                      </div>
                    </div>
                  ) : (
                    backups.map((backup) => (
                      <div
                        key={backup.filename}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm md:text-base">{backup.filename}</p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {new Date(backup.created_at).toLocaleString()} • {backup.size_mb} MB
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <a
                            href={`/api/maintenance/backup/download/${backup.filename}`}
                            download
                            className="flex-1 md:flex-none px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium text-center"
                          >
                            📥 Download
                          </a>
                          <button
                            onClick={() => handleRestoreBackup(backup.filename)}
                            className="flex-1 md:flex-none px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                          >
                            🔄 Restore
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.filename)}
                            className="flex-1 md:flex-none px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                          >
                            🗑️ Delete
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total Users (All Roles)</span>
                        <span className="font-bold text-lg text-blue-600">{dbStats?.total_users || 0}</span>
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-600 text-sm">└ Super Admins</span>
                        <span className="font-semibold text-purple-600">{dbStats?.total_super_admins || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-600 text-sm">└ Managers</span>
                        <span className="font-semibold text-orange-600">{dbStats?.total_managers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-600 text-sm">└ Shop Keepers</span>
                        <span className="font-semibold text-teal-600">{dbStats?.total_shop_keepers || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-gray-600 text-sm">└ Repairers</span>
                        <span className="font-semibold text-indigo-600">{dbStats?.total_repairers || 0}</span>
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active Users</span>
                        <span className="font-semibold text-green-600">{dbStats?.active_users || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Inactive Users</span>
                        <span className="font-semibold text-red-600">{dbStats?.inactive_users || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Data Clearing */}
            {activeTab === 'clear' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-600" />
                    Data Clearing Operations
                  </h2>
                  <p className="text-sm text-gray-600">
                    ⚠️ WARNING: These operations will permanently delete data from the system. Use with extreme caution!
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-red-800 font-semibold mb-2">Important Safety Notice</h3>
                      <ul className="text-red-700 text-sm space-y-1">
                        <li>• All data clearing operations are PERMANENT and cannot be undone</li>
                        <li>• Always create a backup before clearing any data</li>
                        <li>• Consider clearing specific data types instead of all data</li>
                        <li>• User accounts and system settings will remain intact</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clear All Data */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-2xl mr-3" />
                      <div>
                        <h3 className="text-lg font-bold text-red-800">Clear All Data</h3>
                        <p className="text-sm text-red-600">Nuclear option - clears everything</p>
                      </div>
                    </div>
                    <p className="text-sm text-red-700 mb-4">
                      This will permanently delete ALL business data including customers, phones, swaps, sales, repairs, and invoices.
                    </p>
                    <button
                      onClick={handleClearAllData}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      Clear All Data
                    </button>
                  </div>

                  {/* Clear Specific Data Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Clear Specific Data</h3>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleClearSpecificData('customers')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Customers
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('phones')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Phone Records
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('swaps')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Swap Transactions
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('sales')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Sales Records
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('repairs')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Repair Records
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('invoices')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Invoices
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('activities')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Activity Logs
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('pos-sales')}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All POS Sales
                      </button>
                      
                      <button
                        onClick={() => handleClearSpecificData('users')}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition text-left"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Clear All Users (Keep Admins)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-yellow-800 font-semibold mb-2">Before Clearing Data:</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>1. Create a backup using the "Database Backups" tab</li>
                    <li>2. Export any important data you want to keep</li>
                    <li>3. Inform all users about the maintenance</li>
                    <li>4. Consider clearing during off-peak hours</li>
                  </ul>
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
