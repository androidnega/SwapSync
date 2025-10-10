import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faCheck, faFilter, faMobileAlt } from '@fortawesome/free-solid-svg-icons';

interface Phone {
  id: number;
  imei: string;
  brand: string;
  model: string;
  category_id?: number;
  condition: string;
  value: number;
  cost_price?: number;
  specs?: any;
  status: string;
  is_available: boolean;
}

interface PhoneSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (phone: Phone) => void;
  title?: string;
}

const PhoneSelectionModal: React.FC<PhoneSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Select Phone"
}) => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [allPhones, setAllPhones] = useState<Phone[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCondition, setSelectedCondition] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      searchPhones();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        filterPhones();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedBrand, minPrice, maxPrice, selectedCondition, allPhones]);

  const searchPhones = async () => {
    setLoading(true);
    try {
      const response = await api.get('/phones/search/available');
      setAllPhones(response.data);
      setPhones(response.data);
      
      // Extract unique brands
      const uniqueBrands = Array.from(new Set(response.data.map((p: Phone) => p.brand))).sort();
      setBrands(uniqueBrands as string[]);
    } catch (error) {
      console.error('Error searching phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPhones = () => {
    let filtered = [...allPhones];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.brand.toLowerCase().includes(query) ||
        p.model.toLowerCase().includes(query) ||
        (p.imei && p.imei.toLowerCase().includes(query))
      );
    }

    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(p => p.value >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(p => p.value <= parseFloat(maxPrice));
    }

    // Condition filter
    if (selectedCondition) {
      filtered = filtered.filter(p => p.condition === selectedCondition);
    }

    setPhones(filtered);
  };

  const handleSelect = () => {
    if (selectedPhone) {
      onSelect(selectedPhone);
      onClose();
      resetFilters();
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCondition('');
    setSelectedPhone(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            <FontAwesomeIcon icon={faMobileAlt} className="mr-2 text-blue-600" />
            {title}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetFilters();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Brand, Model, or IMEI..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phone List & Details */}
        <div className="flex-1 flex overflow-hidden">
          {/* Phone List */}
          <div className="w-2/3 p-6 overflow-y-auto border-r border-gray-200">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading phones...</div>
            ) : phones.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FontAwesomeIcon icon={faMobileAlt} className="text-5xl mb-4 opacity-30" />
                <p>No phones found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phones.map(phone => (
                  <div
                    key={phone.id}
                    onClick={() => setSelectedPhone(phone)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedPhone?.id === phone.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{phone.brand} {phone.model}</h3>
                        <p className="text-sm text-gray-500">IMEI: {phone.imei || 'N/A'}</p>
                      </div>
                      {selectedPhone?.id === phone.id && (
                        <FontAwesomeIcon icon={faCheck} className="text-blue-600 text-xl" />
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        phone.condition === 'New' ? 'bg-green-100 text-green-800' :
                        phone.condition === 'Refurbished' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {phone.condition}
                      </span>
                      <span className="text-lg font-bold text-blue-600">₵{phone.value.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phone Details */}
          <div className="w-1/3 p-6 bg-gray-50 overflow-y-auto">
            {selectedPhone ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Phone Details</h3>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-gray-600">Brand & Model</p>
                    <p className="font-semibold">{selectedPhone.brand} {selectedPhone.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">IMEI</p>
                    <p className="font-semibold font-mono">{selectedPhone.imei || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Condition</p>
                    <p className="font-semibold">{selectedPhone.condition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Value</p>
                    <p className="font-semibold text-blue-600">₵{selectedPhone.value.toFixed(2)}</p>
                  </div>
                </div>

                {selectedPhone.specs && (
                  <div className="bg-white rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Specifications</h4>
                    <div className="space-y-2 text-sm">
                      {selectedPhone.specs.cpu && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPU:</span>
                          <span className="font-medium">{selectedPhone.specs.cpu}</span>
                        </div>
                      )}
                      {selectedPhone.specs.ram && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">RAM:</span>
                          <span className="font-medium">{selectedPhone.specs.ram}</span>
                        </div>
                      )}
                      {selectedPhone.specs.storage && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Storage:</span>
                          <span className="font-medium">{selectedPhone.specs.storage}</span>
                        </div>
                      )}
                      {selectedPhone.specs.battery && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Battery:</span>
                          <span className="font-medium">{selectedPhone.specs.battery}</span>
                        </div>
                      )}
                      {selectedPhone.specs.color && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium">{selectedPhone.specs.color}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSelect}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Select This Phone
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <FontAwesomeIcon icon={faMobileAlt} className="text-5xl mb-4 opacity-20" />
                <p>Select a phone to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {phones.length} phone(s) available
            {selectedPhone && <span className="ml-4 font-semibold text-blue-600">• 1 selected</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                resetFilters();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedPhone}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneSelectionModal;

