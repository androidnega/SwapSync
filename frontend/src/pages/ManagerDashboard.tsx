import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { API_URL } from '../services/api';
import Phones from './Phones';
import SwapManager from './SwapManager';
import PendingResales from './PendingResales';
import CompletedSwaps from './CompletedSwaps';

type TabType = 'analytics' | 'phones' | 'swaps' | 'pending-resales' | 'completed-swaps';

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

interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  color: string;
  visible_to: string[];
}

const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneCount, setPhoneCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    fetchStats();
    fetchCounts();
    fetchDashboardCards();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/staff/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch staff statistics');
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const token = getToken();
      const [pendingResponse, phonesResponse] = await Promise.all([
        axios.get(`${API_URL}/pending-resales/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status_filter: 'pending' }
        }),
        axios.get(`${API_URL}/phones/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      
      setPendingCount(pendingResponse.data.length);
      setPhoneCount(phonesResponse.data.length);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const fetchDashboardCards = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/dashboard/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardCards(response.data.cards || []);
    } catch (error) {
      console.error('Failed to fetch dashboard cards:', error);
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

  const tabs = [
    { id: 'analytics' as TabType, label: 'Analytics', icon: '📈', count: null },
    { id: 'phones' as TabType, label: 'Phone Inventory', icon: '📱', count: phoneCount },
    { id: 'swaps' as TabType, label: 'Phone Swaps', icon: '🔄', count: null },
    { id: 'pending-resales' as TabType, label: 'Pending Resales', icon: '⏳', count: pendingCount },
    { id: 'completed-swaps' as TabType, label: 'Completed Swaps', icon: '📊', count: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'phones':
        return <Phones onUpdate={fetchCounts} />;
      case 'swaps':
        return <SwapManager />;
      case 'pending-resales':
        return <PendingResales onUpdate={fetchCounts} />;
      case 'completed-swaps':
        return <CompletedSwaps />;
      case 'analytics':
      default:
        return renderAnalyticsContent();
    }
  };

  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card) => (
          <div key={card.id} className="bg-white p-4 md:p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">{card.title}</div>
                <div className={`text-3xl font-bold ${
                  card.color === 'blue' ? 'text-blue-600' :
                  card.color === 'green' ? 'text-green-600' :
                  card.color === 'red' ? 'text-red-600' :
                  card.color === 'purple' ? 'text-purple-600' :
                  card.color === 'yellow' ? 'text-yellow-600' :
                  card.color === 'indigo' ? 'text-indigo-600' :
                  card.color === 'teal' ? 'text-teal-600' :
                  'text-gray-600'
                }`}>
                  {card.value}
                </div>
              </div>
              <div className={`text-2xl ${
                card.color === 'blue' ? 'text-blue-500' :
                card.color === 'green' ? 'text-green-500' :
                card.color === 'red' ? 'text-red-500' :
                card.color === 'purple' ? 'text-purple-500' :
                card.color === 'yellow' ? 'text-yellow-500' :
                card.color === 'indigo' ? 'text-indigo-500' :
                card.color === 'teal' ? 'text-teal-500' :
                'text-gray-500'
              }`}>
                {card.icon === 'faUserCircle' && '👤'}
                {card.icon === 'faClock' && '⏰'}
                {card.icon === 'faCheckCircle' && '✅'}
                {card.icon === 'faPercent' && '💯'}
                {card.icon === 'faMobileAlt' && '📱'}
                {card.icon === 'faBox' && '📦'}
                {card.icon === 'faUserTie' && '👔'}
                {card.icon === 'faUsers' && '👥'}
                {card.icon === 'faServer' && '🖥️'}
                {card.icon === 'faDatabase' && '🗄️'}
                {card.icon === 'faTools' && '🔧'}
                {card.icon === 'faWrench' && '🔨'}
                {card.icon === 'faCheck' && '✓'}
                {card.icon === 'faExclamationTriangle' && '⚠️'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Total Staff</div>
          <div className="text-3xl font-bold text-blue-600">{stats!.total_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Active Staff</div>
          <div className="text-3xl font-bold text-green-600">{stats!.active_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Inactive Staff</div>
          <div className="text-3xl font-bold text-red-600">{stats!.inactive_staff}</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <div className="text-sm text-gray-500 mb-1">Total Activities</div>
          <div className="text-3xl font-bold text-purple-600">{stats!.total_activities}</div>
        </div>
      </div>

      {/* Staff by Role */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Staff by Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats!.by_role).map(([role, count]) => (
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
              {stats!.staff_list.map((staff) => (
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
              {stats!.staff_list.length === 0 && (
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Comprehensive view of operations, staff, swaps, and inventory
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-w-fit
                    ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded-full ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
