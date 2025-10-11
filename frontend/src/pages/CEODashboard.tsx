import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { API_URL } from '../services/api';

interface StaffMember {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

interface StaffStats {
  total_staff: number;
  active_staff: number;
  inactive_staff: number;
  by_role: { [key: string]: number };
  total_activities: number;
  staff_list: StaffMember[];
}

const CEODashboard: React.FC = () => {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await axios.get('${API_URL}/staff/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch staff statistics');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-6 space-y-6">
        <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">CEO Dashboard</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Total Staff</div>
          <div className="text-3xl font-bold text-blue-600">{stats.total_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Active Staff</div>
          <div className="text-3xl font-bold text-green-600">{stats.active_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Inactive Staff</div>
          <div className="text-3xl font-bold text-red-600">{stats.inactive_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Total Activities</div>
          <div className="text-3xl font-bold text-purple-600">{stats.total_activities}</div>
        </div>
      </div>

      {/* Staff by Role */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff by Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.by_role).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium capitalize">
                {role.replace('_', ' ')}
              </span>
              <span className="text-2xl font-bold text-blue-600">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Staff Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Username</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Role</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {stats.staff_list.map((staff) => (
                <tr key={staff.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-800">{staff.full_name}</td>
                  <td className="p-3 text-gray-600">{staff.username}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      staff.role === 'shop_keeper' ? 'bg-blue-100 text-blue-800' :
                      staff.role === 'repairer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {staff.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 text-sm">
                    {staff.last_login ? new Date(staff.last_login).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
              {stats.staff_list.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 md:p-6 text-center text-gray-500">
                    No staff members yet. Create your first staff member!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/staff-management"
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-semibold text-blue-700">Manage Staff</div>
            <div className="text-sm text-gray-600">Create & edit staff accounts</div>
          </a>
          
          <a
            href="/activity-logs"
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-green-700">Activity Logs</div>
            <div className="text-sm text-gray-600">View staff activities</div>
          </a>
          
          <a
            href="/admin"
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition"
          >
            <div className="text-3xl mb-2">📈</div>
            <div className="font-semibold text-purple-700">Analytics</div>
            <div className="text-sm text-gray-600">View shop analytics</div>
          </a>
        </div>
      </div>
      </div>
    </div>
  );
};

export default CEODashboard;

