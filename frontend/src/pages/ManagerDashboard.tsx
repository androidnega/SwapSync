import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { API_URL } from '../services/api';
import Phones from './Phones';
import SwapManager from './SwapManager';
import PendingResales from './PendingResales';
import CompletedSwaps from './CompletedSwaps';

type TabType = 'phones' | 'swaps' | 'pending-resales' | 'completed-swaps';

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
  const [activeTab, setActiveTab] = useState<TabType>('phones');
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
      default:
        return <Phones onUpdate={fetchCounts} />;
    }
  };


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
