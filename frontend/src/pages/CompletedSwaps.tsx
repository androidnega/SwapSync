/**
 * Completed Swaps with Profit/Loss Analysis
 * Shows all completed swap transactions with final profit/loss calculations
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';

import { API_URL } from '../services/api';

interface Swap {
  id: number;
  customer_id: number;
  given_phone_description: string;
  given_phone_value: number;
  given_phone_imei: string | null;
  new_phone_id: number;
  balance_paid: number;
  discount_amount: number;
  final_price: number;
  resale_status: string;
  resale_value: number;
  profit_or_loss: number;
  invoice_number: string | null;
  created_at: string;
  total_transaction_value: number;
}

interface SwapWithDetails extends Swap {
  customer_name?: string;
  new_phone_description?: string;
}

const CompletedSwaps = () => {
  const [swaps, setSwaps] = useState<SwapWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchSwaps();
    fetchUserRole();
  }, []);

  const isManager = userRole === 'manager' || userRole === 'ceo';

  const fetchUserRole = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchSwaps = async () => {
    try {
      const token = getToken();
      // Fetch from pending-resales endpoint for accurate status
      const response = await axios.get(`${API_URL}/pending-resales/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status_filter: 'all' }  // Get all to calculate stats
      });
      
      // Map pending resales to swap-like format
      const mappedSwaps = response.data.map((pr: any) => ({
        id: pr.swap_id || pr.id,
        given_phone_description: `${pr.incoming_phone_brand || ''} ${pr.incoming_phone_model || ''}`.trim(),
        given_phone_value: pr.incoming_phone_value || 0,
        given_phone_imei: null,
        final_price: pr.final_price,
        resale_value: pr.resale_value || 0,
        profit_or_loss: pr.profit_amount || 0,
        invoice_number: pr.unique_id,
        created_at: pr.transaction_date,
        resale_status: pr.incoming_phone_status === 'sold' ? 'sold' : 'pending',
      }));
      
      setSwaps(mappedSwaps);
    } catch (error) {
      console.error('Failed to fetch swaps:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter swaps - ONLY show completed (not pending)
  const filteredSwaps = swaps.filter(swap => {
    // ONLY show completed swaps (exclude pending)
    if (swap.resale_status === 'pending') return false;
    
    // Status filter
    if (filterStatus === 'profit' && swap.profit_or_loss <= 0) return false;
    if (filterStatus === 'loss' && swap.profit_or_loss >= 0) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        swap.given_phone_description.toLowerCase().includes(query) ||
        swap.invoice_number?.toLowerCase().includes(query) ||
        swap.given_phone_imei?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const totalProfit = swaps
    .filter(s => s.resale_status === 'sold')
    .reduce((sum, s) => sum + s.profit_or_loss, 0);

  const completedCount = swaps.filter(s => s.resale_status === 'sold').length;
  const pendingCount = swaps.filter(s => s.resale_status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Completed Swaps & Profit/Loss</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track swap transactions and analyze profitability</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Swaps</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{swaps.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-700">{completedCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Resale</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{pendingCount}</p>
          </div>
          {isManager && (
            <div className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 ${totalProfit >= 0 ? 'border-green-600' : 'border-red-600'}`}>
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Profit/Loss</p>
              <p className={`text-2xl sm:text-3xl font-bold ${totalProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₵{totalProfit.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              >
                <option value="all">All Completed Swaps</option>
                {isManager && <option value="profit">Profitable Only</option>}
                {isManager && <option value="loss">Loss/Break-even Only</option>}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by phone description, invoice, IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Swaps List - Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade-In Phone</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade-In Value</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Paid</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resale Value</th>
                  {isManager && <th className="px-3 lg:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit/Loss</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Loading swaps...
                    </td>
                  </tr>
                ) : filteredSwaps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No swaps found
                    </td>
                  </tr>
                ) : (
                  filteredSwaps.map((swap) => (
                    <tr key={swap.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-4 py-3 text-xs whitespace-nowrap">
                        {new Date(swap.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 lg:px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{swap.given_phone_description}</div>
                        {swap.given_phone_imei && (
                          <div className="text-xs text-gray-500 font-mono">{swap.given_phone_imei}</div>
                        )}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm whitespace-nowrap">
                        ₵{swap.given_phone_value.toFixed(2)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm whitespace-nowrap">
                        ₵{swap.final_price.toFixed(2)}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm whitespace-nowrap">
                        {swap.resale_value > 0 ? `₵${swap.resale_value.toFixed(2)}` : '-'}
                      </td>
                      {isManager && (
                        <td className="px-3 lg:px-4 py-3 text-right">
                          <span className={`font-bold text-sm ${swap.profit_or_loss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {swap.profit_or_loss >= 0 ? '+' : ''}₵{swap.profit_or_loss.toFixed(2)}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              Loading swaps...
            </div>
          ) : filteredSwaps.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
              No swaps found
            </div>
          ) : (
            filteredSwaps.map((swap) => (
              <div key={swap.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{swap.given_phone_description}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(swap.created_at).toLocaleDateString()}
                    </p>
                    {swap.invoice_number && (
                      <p className="text-xs text-gray-400 mt-0.5">Invoice: {swap.invoice_number}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    swap.resale_status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {swap.resale_status === 'pending' ? 'Pending' : 'Completed'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Trade-In Value</p>
                    <p className="font-medium text-gray-900">₵{swap.given_phone_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cash Paid</p>
                    <p className="font-medium text-gray-900">₵{swap.final_price.toFixed(2)}</p>
                  </div>
                  {swap.resale_value > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Resale Value</p>
                      <p className="font-medium text-gray-900">₵{swap.resale_value.toFixed(2)}</p>
                    </div>
                  )}
                  {isManager && swap.resale_status !== 'pending' && (
                    <div>
                      <p className="text-xs text-gray-500">Profit/Loss</p>
                      <p className={`font-bold ${swap.profit_or_loss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {swap.profit_or_loss >= 0 ? '+' : ''}₵{swap.profit_or_loss.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {swap.given_phone_imei && (
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-500">IMEI</p>
                    <p className="text-xs font-mono text-gray-700">{swap.given_phone_imei}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedSwaps;

