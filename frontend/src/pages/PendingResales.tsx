import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import PendingResaleReceipt from '../components/PendingResaleReceipt';

import { API_URL } from '../services/api';

interface PendingSwap {
  id: number;
  customer_id: number;
  given_phone_description: string;
  given_phone_value: number;
  given_phone_imei?: string;
  new_phone_id: number;
  balance_paid: number;
  resale_status: string;
  created_at: string;
  total_transaction_value: number;
}

interface PendingResalesProps {
  onUpdate?: () => void;
}

const PendingResales: React.FC<PendingResalesProps> = ({ onUpdate }) => {
  const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<PendingSwap | null>(null);
  const [resaleValue, setResaleValue] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyName, setCompanyName] = useState<string>('SwapSync Shop');

  useEffect(() => {
    fetchResales();
    fetchCompanyName();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyName(response.data.company_name || 'SwapSync Shop');
    } catch (error) {
      console.error('Failed to fetch company name:', error);
    }
  };

  const fetchResales = async () => {
    try {
      const token = getToken();
      const pendingResponse = await axios.get(`${API_URL}/swaps/pending-resales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingSwaps(pendingResponse.data);
    } catch (error) {
      console.error('Failed to fetch resales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = (swap: PendingSwap) => {
    setSelectedSwap(swap);
    setResaleValue('');
    setShowResaleModal(true);
  };

  const handleSubmitResale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwap) return;

    const value = parseFloat(resaleValue);
    if (isNaN(value) || value <= 0) {
      setMessage('❌ Please enter a valid resale value');
      return;
    }

    try {
      const token = getToken();
      await axios.put(`${API_URL}/swaps/${selectedSwap.id}/resale`, {
        resale_value: value,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`✅ Resale recorded successfully!`);
      setShowResaleModal(false);
      setSelectedSwap(null);
      setResaleValue('');
      fetchResales();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const filteredSwaps = searchQuery.trim()
    ? pendingSwaps.filter(swap => 
        swap.given_phone_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        swap.id.toString().includes(searchQuery) ||
        swap.given_phone_imei?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pendingSwaps;

  const totalValue = pendingSwaps.reduce((sum, s) => sum + s.given_phone_value, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4">
        {/* Simple Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Pending Resales</h1>
              <p className="text-sm text-gray-600 mt-1">Trade-in phones awaiting resale</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingSwaps.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">₵{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg border ${message.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <input
            type="text"
            placeholder="Search by phone model, ID, or IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchQuery && (
            <p className="text-xs text-gray-600 mt-2">
              Showing {filteredSwaps.length} of {pendingSwaps.length} phones
            </p>
          )}
        </div>

        {/* Phone Cards Grid */}
        {filteredSwaps.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-3 opacity-40">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Phones Available</h3>
            <p className="text-sm text-gray-600">
              {searchQuery ? 'No phones match your search' : 'All trade-in phones have been sold'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredSwaps.map((swap) => (
              <div
                key={swap.id}
                className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Card Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium text-gray-700">SWAP-{String(swap.id).padStart(4, '0')}</p>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Pending</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3">
                  {/* Phone Description */}
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {swap.given_phone_description}
                    </h3>
                    {swap.given_phone_imei && (
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {swap.given_phone_imei}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Value</span>
                      <span className="font-semibold text-sm text-gray-900">₵{swap.given_phone_value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Trade-in Date</span>
                      <span className="text-xs text-gray-700">
                        {new Date(swap.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Customer</span>
                      <span className="text-xs text-gray-700">#{swap.customer_id}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <PendingResaleReceipt
                      swapData={{
                        id: swap.id,
                        customer_name: `Customer #${swap.customer_id}`,
                        given_phone_description: swap.given_phone_description,
                        given_phone_value: swap.given_phone_value,
                        given_phone_imei: swap.given_phone_imei,
                        created_at: swap.created_at
                      }}
                      companyName={companyName}
                    />
                    <button
                      onClick={() => handleMarkAsSold(swap)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      Mark as Sold
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resale Modal */}
        {showResaleModal && selectedSwap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-5 max-w-md w-full border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Record Resale</h2>
                <p className="text-sm text-gray-600">{selectedSwap.given_phone_description}</p>
                <p className="text-xs text-gray-500 mt-1">SWAP-{String(selectedSwap.id).padStart(4, '0')}</p>
              </div>

              <form onSubmit={handleSubmitResale} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resale Amount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={resaleValue}
                    onChange={(e) => setResaleValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                    required
                    autoFocus
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Original Value:</p>
                  <p className="text-lg font-semibold text-gray-900">₵{selectedSwap.given_phone_value.toFixed(2)}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResaleModal(false);
                      setSelectedSwap(null);
                      setResaleValue('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
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
