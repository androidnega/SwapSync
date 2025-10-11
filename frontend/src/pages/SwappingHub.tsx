import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import SwapManager from './SwapManager';
import PendingResales from './PendingResales';
import CompletedSwaps from './CompletedSwaps';
import Phones from './Phones';
import Breadcrumb from '../components/Breadcrumb';
import axios from 'axios';
import { getToken } from '../services/authService';

type TabType = 'swaps' | 'pending-resales' | 'completed-swaps' | 'phones';

const SwappingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('phones');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [phoneCount, setPhoneCount] = useState<number>(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const token = getToken();
      const [pendingResponse, phonesResponse] = await Promise.all([
        axios.get('${API_URL}/swaps/pending-resales', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('${API_URL}/phones/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      
      setPendingCount(pendingResponse.data.length);
      setPhoneCount(phonesResponse.data.length);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const tabs = [
    { id: 'phones' as TabType, label: 'Phone Inventory', icon: '📱', count: phoneCount },
    { id: 'swaps' as TabType, label: 'Phone Swaps', icon: '🔄', count: null },
    { id: 'pending-resales' as TabType, label: 'Pending Resales', icon: '⏳', count: pendingCount },
    { id: 'completed-swaps' as TabType, label: 'Completed Swaps', icon: '📊', count: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'swaps':
        return <SwapManager />;
      case 'pending-resales':
        return <PendingResales onUpdate={fetchCounts} />;
      case 'completed-swaps':
        return <CompletedSwaps />;
      case 'phones':
        return <Phones onUpdate={fetchCounts} />;
      default:
        return <SwapManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb />
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Swapping Hub</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage phone swaps, resales, and inventory all in one place
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

export default SwappingHub;
