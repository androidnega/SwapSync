import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';

import { API_URL } from '../services/api';

interface PendingResale {
  id: number;
  unique_id: string;
  sold_phone_id: number;
  sold_phone_brand: string;
  sold_phone_model: string;
  sold_phone_value: number;
  sold_phone_status: string;
  incoming_phone_id: number | null;
  incoming_phone_brand: string | null;
  incoming_phone_model: string | null;
  incoming_phone_condition: string | null;
  incoming_phone_value: number | null;
  incoming_phone_status: string;
  transaction_type: string;
  customer_id: number;
  attending_staff_id: number;
  transaction_date: string;
  balance_paid: number;
  discount_amount: number;
  final_price: number;
  profit_status: string;
  profit_amount: number;
  resale_value: number;
  swap_id: number | null;
  sale_id: number | null;
  created_at: string;
  updated_at: string;
}

interface PendingResalesProps {
  onUpdate?: () => void;
}

const PendingResales: React.FC<PendingResalesProps> = ({ onUpdate }) => {
  const [pendingResales, setPendingResales] = useState<PendingResale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedResale, setSelectedResale] = useState<PendingResale | null>(null);
  const [resaleValue, setResaleValue] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending'); // 'pending', 'sold', 'all'

  useEffect(() => {
    fetchResales();
  }, []);

  const fetchResales = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/pending-resales/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status_filter: filterStatus }
      });
      setPendingResales(response.data);
    } catch (error) {
      console.error('Failed to fetch pending resales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResales();
  }, [filterStatus]);

  const handleViewDetails = (resale: PendingResale) => {
    setSelectedResale(resale);
    setShowViewModal(true);
  };

  const handleSellPhone = (resale: PendingResale) => {
    setSelectedResale(resale);
    setResaleValue('');
    setShowSellModal(true);
  };

  const handleSubmitResale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResale) return;

    const value = parseFloat(resaleValue);
    if (isNaN(value) || value <= 0) {
      setMessage('❌ Please enter a valid resale value');
      return;
    }

    try {
      const token = getToken();
      await axios.put(`${API_URL}/pending-resales/${selectedResale.id}/mark-sold`, {
        incoming_phone_status: 'sold',
        resale_value: value,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`✅ Phone sold successfully! Profit calculated.`);
      setShowSellModal(false);
      setSelectedResale(null);
      setResaleValue('');
      fetchResales();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Apply search filter if query exists
  const filteredResales = searchQuery.trim()
    ? pendingResales.filter(resale => {
        const query = searchQuery.toLowerCase();
        return (
          resale.sold_phone_brand?.toLowerCase().includes(query) ||
          resale.sold_phone_model?.toLowerCase().includes(query) ||
          resale.incoming_phone_brand?.toLowerCase().includes(query) ||
          resale.incoming_phone_model?.toLowerCase().includes(query) ||
          resale.unique_id?.toLowerCase().includes(query) ||
          resale.id.toString().includes(query)
        );
      })
    : pendingResales;

  // Stats based on ALL data (regardless of current filter, since backend handles filtering)
  const pendingCount = pendingResales.length;
  const soldCount = pendingResales.filter(r => r.incoming_phone_status === 'sold').length;
  const totalValue = pendingResales.reduce((sum, r) => sum + (r.incoming_phone_value || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading pending resales...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Pending Resales</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track phone resales and swap transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Resale</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Sold</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-700">{soldCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Value (Pending)</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">₵{totalValue.toFixed(2)}</p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg border ${message.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending Only</option>
                <option value="sold">Sold Only</option>
                <option value="all">All Resales</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by brand, model, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (₵)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No resales match your search' : 'No pending resales found'}
                    </td>
                  </tr>
                ) : (
                  filteredResales.map((resale) => {
                    // Show incoming phone details if it exists (swap transaction)
                    const displayBrand = resale.incoming_phone_brand || resale.sold_phone_brand;
                    const displayModel = resale.incoming_phone_model || resale.sold_phone_model;
                    const displayValue = resale.incoming_phone_value || resale.sold_phone_value;
                    const displayStatus = resale.transaction_type === 'swap' 
                      ? (resale.incoming_phone_status === 'available' ? 'Swapped' : resale.incoming_phone_status)
                      : resale.sold_phone_status;

                    return (
                      <tr key={resale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{displayBrand}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{displayModel}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₵{displayValue?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            displayStatus === 'available' || displayStatus === 'Swapped'
                              ? 'bg-yellow-100 text-yellow-800'
                              : displayStatus === 'sold'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleViewDetails(resale)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            View
                          </button>
                          {resale.transaction_type === 'swap' && resale.incoming_phone_status === 'available' && (
                            <button
                              onClick={() => handleSellPhone(resale)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                              Sell
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && selectedResale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Resale Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Sold Phone Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Sold Phone</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Brand</p>
                    <p className="text-gray-900">{selectedResale.sold_phone_brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Model</p>
                    <p className="text-gray-900">{selectedResale.sold_phone_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Value</p>
                    <p className="text-gray-900">₵{selectedResale.sold_phone_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Status</p>
                    <p className="text-gray-900 capitalize">{selectedResale.sold_phone_status}</p>
                  </div>
                </div>
              </div>

              {/* Swapped/Incoming Phone Section */}
              {selectedResale.incoming_phone_id && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Swapped/Incoming Phone</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Brand</p>
                      <p className="text-gray-900">{selectedResale.incoming_phone_brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Model</p>
                      <p className="text-gray-900">{selectedResale.incoming_phone_model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Condition</p>
                      <p className="text-gray-900">{selectedResale.incoming_phone_condition}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Value</p>
                      <p className="text-gray-900">₵{selectedResale.incoming_phone_value?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Current Status</p>
                      <p className="text-gray-900 capitalize">{selectedResale.incoming_phone_status}</p>
                    </div>
                    {selectedResale.incoming_phone_status === 'sold' && (
                      <div>
                        <p className="text-sm text-green-700 font-medium">Resale Value</p>
                        <p className="text-gray-900">₵{selectedResale.resale_value.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Info Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Type</p>
                    <p className="text-gray-900 capitalize">{selectedResale.transaction_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Date</p>
                    <p className="text-gray-900">{new Date(selectedResale.transaction_date).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Staff ID</p>
                    <p className="text-gray-900">#{selectedResale.attending_staff_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Balance Paid</p>
                    <p className="text-gray-900">₵{selectedResale.balance_paid.toFixed(2)}</p>
                  </div>
                  {selectedResale.discount_amount > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Discount</p>
                      <p className="text-gray-900">₵{selectedResale.discount_amount.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Final Price</p>
                    <p className="text-gray-900 font-semibold">₵{selectedResale.final_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Profit Status</p>
                    <p className={`capitalize font-semibold ${
                      selectedResale.profit_status === 'profit_made' ? 'text-green-600' :
                      selectedResale.profit_status === 'loss' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {selectedResale.profit_status.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedResale.profit_amount !== 0 && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Profit/Loss</p>
                      <p className={`font-semibold ${selectedResale.profit_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₵{selectedResale.profit_amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Sell Modal */}
        {showSellModal && selectedResale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sell Incoming Phone</h2>
              <p className="text-sm text-gray-600 mb-1">{selectedResale.incoming_phone_brand} {selectedResale.incoming_phone_model}</p>
              <p className="text-xs text-gray-500 mb-4">{selectedResale.unique_id}</p>

              <form onSubmit={handleSubmitResale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resale Amount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={resaleValue}
                    onChange={(e) => setResaleValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    autoFocus
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Original Value:</p>
                  <p className="text-lg font-semibold text-gray-900">₵{selectedResale.incoming_phone_value?.toFixed(2)}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellModal(false);
                      setSelectedResale(null);
                      setResaleValue('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Record Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingResales;
