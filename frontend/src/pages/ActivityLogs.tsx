import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';

interface Activity {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    role: string;
  };
  action: string;
  module: string;
  target_id: number | null;
  details: string | null;
  timestamp: string;
  action_summary: string;
}

const ActivityLogs: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/staff/activities?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch activity logs');
      setLoading(false);
    }
  };

  const modules = ['all', ...new Set(activities.map(a => a.module))];
  
  const filteredActivities = filterModule === 'all' 
    ? activities 
    : activities.filter(a => a.module === filterModule);

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterModule]);

  const getModuleColor = (module: string) => {
    const colors: { [key: string]: string } = {
      users: 'bg-purple-100 text-purple-800',
      customers: 'bg-blue-100 text-blue-800',
      phones: 'bg-green-100 text-green-800',
      swaps: 'bg-yellow-100 text-yellow-800',
      sales: 'bg-red-100 text-red-800',
      repairs: 'bg-indigo-100 text-indigo-800'
    };
    return colors[module] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-red-100 text-red-800',
      ceo: 'bg-purple-100 text-purple-800',
      shop_keeper: 'bg-blue-100 text-blue-800',
      repairer: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading activity logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 md:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-sm md:text-base">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Activity Logs</h1>
        <button
          onClick={fetchActivities}
          className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
        >
          🔄 <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 rounded-xl shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:w-auto">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Filter by Module</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full md:w-auto px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {modules.map(module => (
                <option key={module} value={module}>
                  {module === 'all' ? 'All Modules' : module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs md:text-sm text-gray-600">
            Showing {paginatedActivities.length} of {filteredActivities.length} activities
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white p-3 md:p-6 rounded-xl shadow">
          <div className="text-xs md:text-sm text-gray-500 mb-1">Total</div>
          <div className="text-xl md:text-3xl font-bold text-blue-600">{activities.length}</div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-xl shadow">
          <div className="text-xs md:text-sm text-gray-500 mb-1">Users</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">
            {new Set(activities.map(a => a.user.id)).size}
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-xl shadow">
          <div className="text-xs md:text-sm text-gray-500 mb-1">Modules</div>
          <div className="text-xl md:text-3xl font-bold text-purple-600">
            {new Set(activities.map(a => a.module)).size}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white p-3 md:p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-2">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Recent Activities ({filteredActivities.length})
          </h2>
          {totalPages > 1 && (
            <div className="text-xs md:text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {paginatedActivities.map((activity) => (
            <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {activity.user.full_name}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(activity.user.role)}`}>
                      {activity.user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getModuleColor(activity.module)}`}>
                      {activity.module.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700">{activity.action_summary}</p>
                  
                  {activity.details && (
                    <p className="text-sm text-gray-500 mt-1">
                      Details: {activity.details}
                    </p>
                  )}
                </div>
                
                <div className="text-right text-sm text-gray-500 ml-4">
                  <div>{new Date(activity.timestamp).toLocaleDateString()}</div>
                  <div>{new Date(activity.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          ))}

          {paginatedActivities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No activities found for the selected filter.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredActivities.length)} of {filteredActivities.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity by Module Chart */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Activities by Module</h2>
        <div className="space-y-3">
          {modules.filter(m => m !== 'all').map(module => {
            const count = activities.filter(a => a.module === module).length;
            const percentage = activities.length > 0 ? (count / activities.length * 100).toFixed(1) : 0;
            
            return (
              <div key={module} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 capitalize">{module}</span>
                  <span className="text-gray-600">{count} ({percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ActivityLogs;

