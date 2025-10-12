import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { API_URL } from '../services/api';

interface SoldPhone {
  id: number;
  unique_id: string;
  brand: string;
  model: string;
  condition: string;
  value: number;
  status: string;
  sale_type: string; // 'direct', 'swapped', 'resold'
  sold_date: string;
  swapped_from_id?: number;
}

const SoldPhones: React.FC = () => {
  const [soldPhones, setSoldPhones] = useState<SoldPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'direct', 'swapped', 'resold'

  useEffect(() => {
    fetchSoldPhones();
  }, []);

  const fetchSoldPhones = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/phones/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter for sold phones only
      const sold = response.data.filter((phone: any) => 
        phone.status === 'SOLD' || !phone.is_available
      ).map((phone: any) => ({
        ...phone,
        sale_type: phone.status === 'SWAPPED' ? 'swapped' : 
                   phone.swapped_from_id ? 'resold' : 'direct',
        sold_date: phone.created_at || phone.updated_at
      }));
      
      setSoldPhones(sold);
    } catch (error) {
      console.error('Failed to fetch sold phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhones = soldPhones.filter(phone => {
    // Filter by type
    if (filterType !== 'all' && phone.sale_type !== filterType) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        phone.brand.toLowerCase().includes(query) ||
        phone.model.toLowerCase().includes(query) ||
        phone.unique_id?.toLowerCase().includes(query) ||
        phone.id.toString().includes(query)
      );
    }
    
    return true;
  });

  const counts = {
    all: soldPhones.length,
    direct: soldPhones.filter(p => p.sale_type === 'direct').length,
    swapped: soldPhones.filter(p => p.sale_type === 'swapped').length,
    resold: soldPhones.filter(p => p.sale_type === 'resold').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading sold phones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sold Phones</h2>
        <p className="text-sm text-gray-600 mt-1">View all sold phone transactions</p>
      </div>

      {/* Stats Cards - Simple */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Total Sold</p>
          <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Direct Sales</p>
          <p className="text-2xl font-bold text-gray-900">{counts.direct}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Swapped</p>
          <p className="text-2xl font-bold text-gray-900">{counts.swapped}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Resold</p>
          <p className="text-2xl font-bold text-gray-900">{counts.resold}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sales</option>
              <option value="direct">Direct Sales Only</option>
              <option value="swapped">Swapped Only</option>
              <option value="resold">Resold Only</option>
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

      {/* Sold Phones Grid */}
      {filteredPhones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4 opacity-20">📱</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sold Phones</h3>
          <p className="text-sm text-gray-600">
            {searchQuery ? 'No phones match your search' : 'No phones have been sold yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhones.map((phone) => (
            <div key={phone.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200">
                <div>
                  <p className="font-bold text-gray-900">{phone.brand}</p>
                  <p className="text-sm text-gray-700">{phone.model}</p>
                  <p className="text-xs text-gray-500 mt-1">{phone.unique_id || `PHON-${phone.id.toString().padStart(4, '0')}`}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  phone.sale_type === 'direct' ? 'bg-blue-100 text-blue-800' :
                  phone.sale_type === 'swapped' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {phone.sale_type === 'direct' ? 'Sold' :
                   phone.sale_type === 'swapped' ? 'Swapped' :
                   'Resold'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Condition:</span>
                  <span className="text-sm text-gray-900">{phone.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Value:</span>
                  <span className="text-sm font-bold text-gray-900">₵{phone.value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Sale Date:</span>
                  <span className="text-sm text-gray-900">{new Date(phone.sold_date).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SoldPhones;

