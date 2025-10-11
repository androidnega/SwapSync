import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import DashboardCard from '../components/DashboardCard';
import Breadcrumb from '../components/Breadcrumb';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faBell } from '@fortawesome/free-solid-svg-icons';

interface DashboardCardData {
  id: string;
  title: string;
  value: string | number;
  icon: string;
  color: string;
  visible_to: string[];
}

interface DashboardData {
  cards: DashboardCardData[];
  user_role: string;
  total_cards: number;
}

interface Product {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  min_stock_level: number;
}

const RoleDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchStockAlerts();
  }, []);

  const fetchStockAlerts = async () => {
    try {
      const token = getToken();
      
      // Fetch low stock products
      const lowStockResponse = await axios.get(`${API_URL}/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLowStockProducts(lowStockResponse.data);
      
      // Fetch out of stock products
      const outOfStockResponse = await axios.get(`${API_URL}/products/out-of-stock`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutOfStockProducts(outOfStockResponse.data);
    } catch (err) {
      console.error('Failed to fetch stock alerts:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/dashboard/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    // Navigate to relevant page based on card ID
    const routes: { [key: string]: string } = {
      'pending_resales': '/pending-resales',
      'completed_swaps': '/swaps',
      'pending_repairs': '/repairs',
      'completed_repairs': '/repairs',
      'available_phones': '/phones',
      'total_customers': '/customers'
    };
    
    if (routes[cardId]) {
      navigate(routes[cardId]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const totalStockIssues = lowStockProducts.length + outOfStockProducts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb />
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-[1600px] mx-auto">
        {/* Header with Stock Alert Badge */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Welcome! Here's your overview
            </p>
          </div>
          
          {/* Stock Alert Badge */}
          {totalStockIssues > 0 && (dashboardData.user_role === 'shop_keeper' || dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo') && (
            <div className="relative">
              <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className="animate-pulse" />
                <span>{totalStockIssues} Alert{totalStockIssues > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {dashboardData.cards.map((card) => (
            <DashboardCard
              key={card.id}
              id={card.id}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {dashboardData.cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No dashboard cards available for your role.</p>
          </div>
        )}

        {/* Quick Actions - Role-Based */}
        {(dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo' || dashboardData.user_role === 'shop_keeper' || dashboardData.user_role === 'repairer') && (
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* CEO & Shop Keeper Only - Swapping Hub */}
              {(dashboardData.user_role === 'shop_keeper' || dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo') && (
                <button
                  onClick={() => navigate('/swapping-hub')}
                  className="p-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-center transition"
                >
                  <div className="text-3xl mb-2">🔄</div>
                  <div className="font-semibold text-blue-700">Swapping Hub</div>
                  <div className="text-xs text-gray-600 mt-1">Phone swaps</div>
                </button>
              )}
              
              {/* CEO & Shop Keeper Only - Products Hub */}
              {(dashboardData.user_role === 'shop_keeper' || dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo') && (
                <button
                  onClick={() => navigate('/products-hub')}
                  className="p-4 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg text-center transition"
                >
                  <div className="text-3xl mb-2">🛒</div>
                  <div className="font-semibold text-green-700">Products Hub</div>
                  <div className="text-xs text-gray-600 mt-1">Product sales</div>
                </button>
              )}
              
              {/* CEO & Shop Keeper Only - Customer Action */}
              {(dashboardData.user_role === 'shop_keeper' || dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo') && (
                <button
                  onClick={() => navigate('/customers')}
                  className="p-4 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg text-center transition"
                >
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold text-purple-700">Customers</div>
                  <div className="text-xs text-gray-600 mt-1">Manage customers</div>
                </button>
              )}
              
              {/* Repairer & CEO Only - Repair Action */}
              {(dashboardData.user_role === 'repairer' || dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo') && (
                <button
                  onClick={() => navigate('/repairs')}
                  className="p-4 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg text-center transition"
                >
                  <div className="text-3xl mb-2">🔧</div>
                  <div className="font-semibold text-orange-700">Repairs</div>
                  <div className="text-xs text-gray-600 mt-1">Repair services</div>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* System Admin Info Section (No Quick Actions) */}
        {(dashboardData.user_role === 'admin' || dashboardData.user_role === 'super_admin') && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm p-4 md:p-6 border border-indigo-100">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2 md:mb-3">System Administrator</h2>
            <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
              Manage companies, view logs, and configure settings.
            </p>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <button
                onClick={() => navigate('/staff-management')}
                className="p-2 md:p-4 bg-white hover:bg-indigo-50 rounded-lg text-center transition border border-indigo-200"
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">🏢</div>
                <div className="text-xs md:text-sm font-semibold text-indigo-700">Companies</div>
                <div className="text-xs text-gray-600 hidden md:block">View companies & staff</div>
              </button>
              
              <button
                onClick={() => navigate('/activity-logs')}
                className="p-2 md:p-4 bg-white hover:bg-purple-50 rounded-lg text-center transition border border-purple-200"
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">🖥️</div>
                <div className="text-xs md:text-sm font-semibold text-purple-700">Logs</div>
                <div className="text-xs text-gray-600 hidden md:block">Platform activity</div>
              </button>
              
              <button
                onClick={() => navigate('/settings')}
                className="p-2 md:p-4 bg-white hover:bg-green-50 rounded-lg text-center transition border border-green-200"
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">⚙️</div>
                <div className="text-xs md:text-sm font-semibold text-green-700">Settings</div>
                <div className="text-xs text-gray-600 hidden md:block">Configuration</div>
              </button>
            </div>
          </div>
        )}
        {/* Stock Alerts - Manager & Shopkeeper Only */}
        {(dashboardData.user_role === 'manager' || dashboardData.user_role === 'ceo' || dashboardData.user_role === 'shop_keeper') && 
         (lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className="text-red-500" />
                Inventory Alerts
              </h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                {totalStockIssues} {totalStockIssues === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            
            {/* Out of Stock Alerts */}
            {outOfStockProducts.length > 0 && (
              <div className="bg-white border-2 border-red-300 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-red-900">Out of Stock</h3>
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {outOfStockProducts.length}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">Need immediate restocking</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {outOfStockProducts.slice(0, 6).map(product => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-lg p-4 border border-red-200 cursor-pointer hover:shadow-md transition"
                      onClick={() => navigate('/products')}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.brand && <div className="text-sm text-gray-600">{product.brand}</div>}
                      <div className="text-sm text-red-600 font-semibold mt-2">
                        Stock: 0 / Min: {product.min_stock_level}
                      </div>
                    </div>
                  ))}
                </div>
                {outOfStockProducts.length > 6 && (
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 text-red-700 hover:text-red-900 text-sm font-medium"
                  >
                    View all {outOfStockProducts.length} out of stock items →
                  </button>
                )}
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div className="bg-white border-2 border-yellow-300 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-yellow-900">Low Stock</h3>
                      <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {lowStockProducts.length}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">Running low on inventory</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockProducts.slice(0, 6).map(product => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-lg p-4 border border-yellow-200 cursor-pointer hover:shadow-md transition"
                      onClick={() => navigate('/products')}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.brand && <div className="text-sm text-gray-600">{product.brand}</div>}
                      <div className="text-sm text-yellow-700 font-semibold mt-2">
                        Stock: {product.quantity} / Min: {product.min_stock_level}
                      </div>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 6 && (
                  <button
                    onClick={() => navigate('/products')}
                    className="mt-4 text-yellow-700 hover:text-yellow-900 text-sm font-medium"
                  >
                    View all {lowStockProducts.length} low stock items →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RoleDashboard;

