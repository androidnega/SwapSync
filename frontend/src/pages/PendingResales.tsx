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

        {/* Stats Cards - Simple & Clean */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending Resale</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Sold</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{soldCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Value (Pending)</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">₵{totalValue.toFixed(2)}</p>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg border ${message.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
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

        {/* Resale Cards */}
        {filteredResales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4 opacity-20">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resales Found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery ? 'No resales match your search' : 'No pending resales available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredResales.map((resale) => {
              const isAvailable = resale.transaction_type === 'swap' && resale.incoming_phone_status === 'available';
              
              return (
                <div key={resale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  {/* Transaction Header */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="font-semibold text-gray-900">{resale.unique_id || `PRSL-${resale.id.toString().padStart(4, '0')}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm text-gray-700">{new Date(resale.transaction_date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  {/* Two Phone Details - 2 Column Layout */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Sold Phone */}
                    <div className="border-r border-gray-200 pr-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sold Phone</h4>
                      <p className="font-bold text-gray-900 text-sm mb-1">{resale.sold_phone_brand}</p>
                      <p className="text-sm text-gray-700 mb-1">{resale.sold_phone_model}</p>
                      <p className="text-lg font-bold text-gray-900">₵{resale.sold_phone_value.toFixed(2)}</p>
                    </div>
                    
                    {/* Incoming/Value Phone */}
                    <div className="pl-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        {resale.transaction_type === 'swap' ? 'Incoming Phone' : 'Payment'}
                      </h4>
                      {resale.incoming_phone_brand ? (
                        <>
                          <p className="font-bold text-gray-900 text-sm mb-1">{resale.incoming_phone_brand}</p>
                          <p className="text-sm text-gray-700 mb-1">{resale.incoming_phone_model}</p>
                          <p className="text-xs text-gray-600 mb-1">{resale.incoming_phone_condition}</p>
                          <p className="text-lg font-bold text-gray-900">₵{resale.incoming_phone_value?.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">₵{resale.balance_paid.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAvailable && (
                    <div className="mb-4">
                      <span className="inline-block w-full text-center px-3 py-2 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-lg">
                        ✓ Available for Purchase
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(resale)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium text-sm transition-colors"
                    >
                      View Details
                    </button>
                    {isAvailable && (
                      <button
                        onClick={() => handleSellPhone(resale)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Sell Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Modal - Compact 2-Column Layout */}
        {showViewModal && selectedResale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-5 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Resale Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Both Phones Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Sold Phone */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Sold Phone</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Brand:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedResale.sold_phone_brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Model:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedResale.sold_phone_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Value:</span>
                      <span className="text-sm font-bold text-gray-900">₵{selectedResale.sold_phone_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Status:</span>
                      <span className="text-sm capitalize text-gray-900">{selectedResale.sold_phone_status}</span>
                    </div>
                  </div>
                </div>

                {/* Incoming Phone (Trade-In) */}
                {selectedResale.incoming_phone_id && (
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-3 uppercase flex items-center gap-2">
                      📲 Trade-In Phone Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Phone Description:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedResale.incoming_phone_brand} {selectedResale.incoming_phone_model}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Condition:</span>
                        <span className="text-sm text-gray-900">{selectedResale.incoming_phone_condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Trade-In Value (₵):</span>
                        <span className="text-sm font-bold text-yellow-900">₵{selectedResale.incoming_phone_value?.toFixed(2)}</span>
                      </div>
                      
                      {/* Phone Specs Section */}
                      <div className="pt-2 mt-2 border-t border-yellow-300">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Additional Details:</p>
                        
                        {/* Note: These come from the incoming phone's specs */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">IMEI:</span>
                            <span className="text-gray-900 font-mono text-xs">
                              {selectedResale.incoming_phone_id ? 'See phone ID ' + selectedResale.incoming_phone_id : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="text-sm capitalize text-gray-900">{selectedResale.incoming_phone_status}</span>
                          </div>
                        </div>
                        
                        <div className="bg-white bg-opacity-70 rounded p-2 mt-2">
                          <p className="text-xs text-gray-700">
                            💡 Full specs (Color, Storage, RAM) are stored with the incoming phone record (ID: {selectedResale.incoming_phone_id})
                          </p>
                        </div>
                      </div>
                      
                      {selectedResale.incoming_phone_status === 'sold' && (
                        <div className="flex justify-between pt-2 border-t border-yellow-300">
                          <span className="text-xs text-gray-600">Resale Value:</span>
                          <span className="text-sm font-bold text-green-700">₵{selectedResale.resale_value.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Info - Compact Grid */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Transaction Info</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Type:</span>
                    <span className="text-sm capitalize text-gray-900">{selectedResale.transaction_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">{new Date(selectedResale.transaction_date).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Staff ID:</span>
                    <span className="text-sm text-gray-900">#{selectedResale.attending_staff_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Balance Paid:</span>
                    <span className="text-sm text-gray-900">₵{selectedResale.balance_paid.toFixed(2)}</span>
                  </div>
                  {selectedResale.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Discount:</span>
                      <span className="text-sm text-gray-900">₵{selectedResale.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Final Price:</span>
                    <span className="text-sm font-semibold text-gray-900">₵{selectedResale.final_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-600">Profit Status:</span>
                    <span className={`text-sm capitalize font-semibold ${
                      selectedResale.profit_status === 'profit_made' ? 'text-green-600' :
                      selectedResale.profit_status === 'loss' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {selectedResale.profit_status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedResale.profit_amount !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-600">Profit/Loss:</span>
                      <span className={`text-sm font-semibold ${selectedResale.profit_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₵{selectedResale.profit_amount.toFixed(2)}
                      </span>
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
