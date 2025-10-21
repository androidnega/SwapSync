import React, { useState, useEffect } from 'react';
import api, { phoneAPI, brandAPI, categoryAPI, authAPI, bulkUploadAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';

interface Phone {
  id: number;
  unique_id?: string;
  brand: string;
  model: string;
  condition: string;
  value: number;
  cost_price?: number;
  is_available: boolean;
  is_swappable?: boolean;
  status?: string;
  imei?: string;
  specs?: {
    cpu?: string;
    ram?: string;
    storage?: string;
    battery?: string;
    battery_health?: string;
    color?: string;
  };
  category_id?: number;
  added_at: string;
  created_at?: string;
  swapped_from_id?: number;
}

interface PhonesProps {
  onUpdate?: () => void;
}

const Phones: React.FC<PhonesProps> = ({ onUpdate }) => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPhone, setViewingPhone] = useState<Phone | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedPhones, setSelectedPhones] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    condition: 'New',
    value: '',
    category_id: '',
    cost_price: '',
    is_swappable: true,
    cpu: '',
    ram: '',
    storage: '',
    battery: '',
    battery_health: '',  // For iPhones only
    color: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPhones();
    fetchCategories();
    fetchBrands();
    fetchUserRole();
  }, [filterAvailable]);

  const fetchUserRole = async () => {
    try {
      const response = await authAPI.me();
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchPhones = async () => {
    try {
      const response = await phoneAPI.getAll(filterAvailable === 'available');
      setPhones(response.data);
    } catch (error) {
      console.error('Failed to fetch phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  // Get color style for phone icon based on phone color
  const getPhoneIconColor = (color?: string): string => {
    if (!color) return '#6B7280'; // Default gray

    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'rose gold': '#B76E79',
      'space gray': '#71797E',
      'midnight': '#191970',
      'blue': '#3B82F6',
      'green': '#10B981',
      'red': '#EF4444',
      'purple': '#A855F7',
      'pink': '#EC4899',
      'yellow': '#FACC15',
      'graphite': '#41424C',
      'sierra blue': '#A7C4D4',
      'pacific blue': '#4A90A4',
      'starlight': '#F5F5DC',
    };

    const lowerColor = color.toLowerCase();
    return colorMap[lowerColor] || '#6B7280';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validate value is a positive number
    const valueNum = parseFloat(formData.value);
    if (isNaN(valueNum) || valueNum <= 0) {
      setMessage('❌ Please enter a valid selling price greater than 0');
      return;
    }

    // Validate cost price is a positive number
    const costPriceNum = parseFloat(formData.cost_price);
    if (isNaN(costPriceNum) || costPriceNum <= 0) {
      setMessage('❌ Please enter a valid cost price greater than 0');
      return;
    }

    // Warn if cost price is higher than selling price
    if (costPriceNum > valueNum) {
      if (!confirm('⚠️ Warning: Cost price is higher than selling price. This will result in a loss. Continue?')) {
        return;
      }
    }

    // Build specs object
    const specs: any = {};
    if (formData.cpu) specs.cpu = formData.cpu.trim();
    if (formData.ram) specs.ram = formData.ram.trim();
    if (formData.storage) specs.storage = formData.storage.trim();
    if (formData.battery) specs.battery = formData.battery.trim();
    if (formData.battery_health) specs.battery_health = formData.battery_health.trim();  // For iPhones
    if (formData.color) specs.color = formData.color.trim();

    const phoneData: any = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      condition: formData.condition,
      value: valueNum,
      is_swappable: formData.is_swappable,
    };

    // Add optional fields
    if (formData.category_id) {
      phoneData.category_id = parseInt(formData.category_id);
    }
    // Cost price is now required
    phoneData.cost_price = costPriceNum;
    if (Object.keys(specs).length > 0) {
      phoneData.specs = specs;
    }

    console.log('Submitting phone data:', phoneData);

    try {
      if (editingId) {
        const response = await phoneAPI.update(editingId, phoneData);
        console.log('Update response:', response.data);
        setMessage('✅ Phone updated successfully!');
      } else {
        const response = await phoneAPI.create(phoneData);
        console.log('Create response:', response.data);
        setMessage('✅ Phone added successfully!');
      }
      
      setShowModal(false);
      setFormData({ 
        brand: '', 
        model: '', 
        condition: 'New', 
        value: '', 
        category_id: '', 
        cost_price: '',
        is_swappable: true,
        cpu: '', 
        ram: '', 
        storage: '', 
        battery: '', 
        battery_health: '',
        color: '' 
      });
      setEditingId(null);
      fetchPhones();
      if (onUpdate) onUpdate(); // Notify parent component
    } catch (error: any) {
      console.error('Phone submission error:', error);
      const errorDetail = error.response?.data?.detail || error.message;
      setMessage(`❌ Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
  };

  const handleEdit = (phone: Phone) => {
    setFormData({
      brand: phone.brand,
      model: phone.model,
      condition: phone.condition,
      value: phone.value.toString(),
      category_id: phone.category_id?.toString() || '',
      cost_price: phone.cost_price?.toString() || '',
      is_swappable: phone.is_swappable !== undefined ? phone.is_swappable : true,
      cpu: phone.specs?.cpu || '',
      ram: phone.specs?.ram || '',
      storage: phone.specs?.storage || '',
      battery: phone.specs?.battery || '',
      battery_health: phone.specs?.battery_health || '',
      color: phone.specs?.color || ''
    });
    setEditingId(phone.id);
    setShowModal(true);
  };

  const handleView = (phone: Phone) => {
    setViewingPhone(phone);
    setShowViewModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this phone?')) return;

    try {
      await phoneAPI.delete(id);
      setMessage('✅ Phone deleted successfully!');
      fetchPhones();
      if (onUpdate) onUpdate(); // Notify parent component
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSelectPhone = (phoneId: number) => {
    setSelectedPhones(prev => 
      prev.includes(phoneId) 
        ? prev.filter(id => id !== phoneId)
        : [...prev, phoneId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhones.length === filteredPhones.length) {
      setSelectedPhones([]);
    } else {
      setSelectedPhones(filteredPhones.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPhones.length === 0) {
      setMessage('❌ Please select phones to delete');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await phoneAPI.bulkDelete(selectedPhones);
      setMessage(`✅ ${response.data.message}`);
      setSelectedPhones([]);
      setShowBulkDeleteConfirm(false);
      fetchPhones();
      if (onUpdate) onUpdate(); // Notify parent component
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to delete phones: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const response = await bulkUploadAPI.uploadPhones(uploadFile);

      const result = response.data;
      if (result.success) {
        setMessage(`✅ Successfully uploaded ${result.added} phone(s)! ${result.errors > 0 ? `(${result.errors} errors)` : ''}`);
        setShowBulkUpload(false);
        setUploadFile(null);
        fetchPhones();
        if (onUpdate) onUpdate();
      }
    } catch (error: any) {
      setMessage(`❌ Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openNewModal = () => {
    setFormData({ 
      brand: '', 
      model: '', 
      condition: 'New', 
      value: '', 
      category_id: '', 
      cost_price: '',
      is_swappable: true,
      cpu: '', 
      ram: '', 
      storage: '', 
      battery: '', 
      battery_health: '',
      color: '' 
    });
    setEditingId(null);
    setShowModal(true);
  };

  // Apply availability filter
  let filteredPhones = filterAvailable === 'available'
    ? phones.filter(p => p.is_available && p.status !== 'SWAPPED')  // Exclude trade-ins waiting for resale
    : filterAvailable === 'sold'
    ? phones.filter(p => !p.is_available || p.status === 'SWAPPED' || p.status === 'SOLD')  // Include swapped/sold
    : phones;

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredPhones = filteredPhones.filter(p => 
      p.brand.toLowerCase().includes(query) ||
      p.model.toLowerCase().includes(query) ||
      p.condition.toLowerCase().includes(query)
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPhones = filteredPhones.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading phones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Phone Inventory</h1>
          {(userRole === 'manager' || userRole === 'ceo') && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openNewModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                + Add Phone
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                📤 Bulk Upload
              </button>
              {selectedPhones.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  🗑️ Delete Selected ({selectedPhones.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Shop Keeper Info Message */}
        {userRole === 'shop_keeper' && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📱 Phone Inventory (View Only)</h3>
            <p className="text-blue-800 mb-2">
              These phones are managed by <strong>Managers</strong> and are available for swap transactions.
            </p>
            <p className="text-blue-700 text-sm">
              💡 You can use these phones when recording swap transactions in the <strong>Phone Swaps</strong> tab.
            </p>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Phone Inventory Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Total Phones</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{phones.length}</p>
                <p className="text-xs text-gray-500 mt-1">In inventory</p>
              </div>
              <div className="text-gray-400 text-2xl sm:text-3xl">
                📱
              </div>
            </div>
          </div>
          <div className="bg-white border border-green-200 rounded-lg shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase mb-1">Available for Swap</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-900">{phones.filter(p => p.is_available).length}</p>
                <p className="text-xs text-green-600 mt-1">Ready to use</p>
              </div>
              <div className="text-green-400 text-2xl sm:text-3xl">
                ✅
              </div>
            </div>
          </div>
          <div className="bg-white border border-red-200 rounded-lg shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 uppercase mb-1">Sold/Swapped</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-900">{phones.filter(p => !p.is_available).length}</p>
                <p className="text-xs text-red-600 mt-1">No longer available</p>
              </div>
              <div className="text-red-400 text-2xl sm:text-3xl">
                ❌
              </div>
            </div>
          </div>
        </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search phones by brand, model, or condition..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to page 1 on search
                }}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Showing {paginatedPhones.length} of {filteredPhones.length} phones
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterAvailable('all')}
          className={`px-4 py-2 font-medium ${
            filterAvailable === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Phones
        </button>
        <button
          onClick={() => setFilterAvailable('available')}
          className={`px-4 py-2 font-medium ${
            filterAvailable === 'available'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setFilterAvailable('sold')}
          className={`px-4 py-2 font-medium ${
            filterAvailable === 'sold'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Sold/Swapped
        </button>
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {(userRole === 'manager' || userRole === 'ceo') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPhones.length === filteredPhones.length && filteredPhones.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price (₵)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPhones.length === 0 ? (
              <tr>
                <td colSpan={(userRole === 'manager' || userRole === 'ceo') ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                  {filteredPhones.length === 0 ? (
                    userRole === 'shop_keeper' 
                      ? 'No phones available yet. Manager will add phones for swapping.'
                      : 'No phones found. Click "Add Phone" to add inventory!'
                  ) : (
                    'No phones match your search criteria.'
                  )}
                </td>
              </tr>
            ) : (
              paginatedPhones.map((phone) => (
                <tr key={phone.id} className="hover:bg-gray-50">
                  {(userRole === 'manager' || userRole === 'ceo') && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPhones.includes(phone.id)}
                        onChange={() => handleSelectPhone(phone.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {phone.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {phone.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {phone.condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₵{phone.value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          phone.status === 'SWAPPED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : phone.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : phone.status === 'SOLD'
                            ? 'bg-red-100 text-red-800'
                            : phone.status === 'UNDER_REPAIR'
                            ? 'bg-blue-100 text-blue-800'
                            : phone.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {phone.status === 'SWAPPED' 
                          ? 'Swapped'
                          : phone.status === 'AVAILABLE'
                          ? 'Available'
                          : phone.status === 'SOLD'
                          ? 'Sold'
                          : phone.status === 'UNDER_REPAIR'
                          ? 'Under Repair'
                          : phone.is_available ? 'Available' : 'Sold/Swapped'}
                      </span>
                      {phone.status === 'SWAPPED' && phone.is_available && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          📋 Pending Resale
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleView(phone)}
                      className="text-green-600 hover:text-green-900"
                    >
                      View
                    </button>
                    {(userRole === 'manager' || userRole === 'ceo') && (
                      <>
                        <button
                          onClick={() => handleEdit(phone)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(phone.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Shown on Mobile */}
      <div className="md:hidden space-y-4">
        {paginatedPhones.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            {filteredPhones.length === 0 ? (
              userRole === 'shop_keeper' 
                ? 'No phones available yet. Manager will add phones for swapping.'
                : 'No phones found. Click "Add Phone" to add inventory!'
            ) : (
              'No phones match your search criteria.'
            )}
          </div>
        ) : (
          paginatedPhones.map((phone) => (
            <div key={phone.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">{phone.brand} {phone.model}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{phone.condition}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ID: {phone.unique_id || `PHON-${String(phone.id).padStart(4, '0')}`}</p>
                  {phone.status === 'SWAPPED' && phone.is_available && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                      📋 Pending Resale
                    </span>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    phone.status === 'SWAPPED'
                      ? 'bg-yellow-100 text-yellow-800'
                      : phone.status === 'AVAILABLE'
                      ? 'bg-green-100 text-green-800'
                      : phone.status === 'SOLD'
                      ? 'bg-red-100 text-red-800'
                      : phone.status === 'UNDER_REPAIR'
                      ? 'bg-blue-100 text-blue-800'
                      : phone.is_available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {phone.status === 'SWAPPED' 
                    ? 'Swapped'
                    : phone.status === 'AVAILABLE'
                    ? 'Available'
                    : phone.status === 'SOLD'
                    ? 'Sold'
                    : phone.status === 'UNDER_REPAIR'
                    ? 'Under Repair'
                    : phone.is_available ? 'Available' : 'Sold'}
                </span>
              </div>
              
              {/* Pricing */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 mb-3 border border-green-200">
                {phone.cost_price && (userRole === 'manager' || userRole === 'ceo') ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Selling Price:</span>
                      <span className="font-bold text-green-700 text-lg">₵{phone.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-green-200 pt-2">
                      <span className="text-xs text-gray-600">Cost Price:</span>
                      <span className="font-semibold text-gray-700">₵{phone.cost_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-100 -mx-3 px-3 py-2 rounded">
                      <span className="text-xs font-bold text-blue-900">Expected Profit:</span>
                      <span className="font-bold text-blue-700 text-base">
                        +₵{(phone.value - phone.cost_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Selling Price</p>
                    <p className="font-bold text-green-700 text-2xl">₵{phone.value.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                {phone.specs?.storage && (
                  <div>
                    <p className="text-gray-500 text-xs">Storage</p>
                    <p className="text-gray-700">{phone.specs.storage}</p>
                  </div>
                )}
                {phone.specs?.ram && (
                  <div>
                    <p className="text-gray-500 text-xs">RAM</p>
                    <p className="text-gray-700">{phone.specs.ram}</p>
                  </div>
                )}
                {phone.specs?.color && (
                  <div>
                    <p className="text-gray-500 text-xs">Color</p>
                    <p className="text-gray-700">{phone.specs.color}</p>
                  </div>
                )}
                {phone.specs?.battery_health && (
                  <div>
                    <p className="text-gray-500 text-xs">Battery</p>
                    <p className="text-green-600 font-medium">{phone.specs.battery_health}</p>
                  </div>
                )}
              </div>

              {/* IMEI if available */}
              {phone.imei && (
                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                  <p className="text-xs text-gray-500">IMEI</p>
                  <p className="text-xs text-gray-700 font-mono">{phone.imei}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleView(phone)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium border border-green-200"
                >
                  👁️ View
                </button>
                {(userRole === 'manager' || userRole === 'ceo') && (
                  <>
                    <button
                      onClick={() => handleEdit(phone)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium border border-blue-200"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(phone.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium border border-red-200"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} ({filteredPhones.length} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Phone' : 'Add New Phone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Basic Info - 2 columns on desktop, 1 on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((brand: any) => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                  {brands.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      No brands found. Add brands in "Phone Brands" page first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    placeholder="e.g., iPhone 13 Pro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    placeholder="e.g., 5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Price at which the phone will be sold to customers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price (₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    required
                    placeholder="e.g., 4000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Amount paid to acquire this phone</p>
                </div>

                {/* Swap Availability Toggle */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_swappable}
                      onChange={(e) => setFormData({ ...formData, is_swappable: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Available for Swapping</span>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formData.is_swappable 
                          ? 'Phone can be used in swap transactions' 
                          : 'Direct sale only - swap form will be disabled'}
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CPU</label>
                  <input
                    type="text"
                    value={formData.cpu}
                    onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                    placeholder="e.g., A15 Bionic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">RAM</label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    placeholder="e.g., 6GB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Storage</label>
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    placeholder="e.g., 128GB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Battery</label>
                  <input
                    type="text"
                    value={formData.battery}
                    onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
                    placeholder="e.g., 4500mAh"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Battery Health - iPhone ONLY */}
                {(formData.brand.toLowerCase().includes('iphone') || formData.brand.toLowerCase().includes('apple')) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Battery Health % <span className="text-blue-600">(iPhone)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.battery_health}
                      onChange={(e) => setFormData({ ...formData, battery_health: e.target.value })}
                      placeholder="e.g., 95"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter battery health percentage (0-100%)</p>
                  </div>
                )}

                <div className={`${(formData.brand.toLowerCase().includes('iphone') || formData.brand.toLowerCase().includes('apple')) ? 'col-span-1' : 'col-span-2'}`}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g., Graphite, Gold"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewingPhone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 md:p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">{viewingPhone.brand} {viewingPhone.model}</h2>
                  <p className="text-blue-100 text-sm mt-1">{viewingPhone.unique_id || `PHON-${String(viewingPhone.id).padStart(4, '0')}`}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 text-sm font-semibold rounded-full ${
                    viewingPhone.is_available
                      ? 'bg-green-100 text-green-800 border-2 border-green-300'
                      : 'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}
                >
                  {viewingPhone.is_available ? '✅ Available for Sale' : '❌ Sold/Swapped'}
                </span>
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                  📋 Basic Information
                  {viewingPhone.specs?.color && (
                    <span className="ml-auto flex items-center gap-2 text-xs normal-case font-normal">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={getPhoneIconColor(viewingPhone.specs.color)}
                        stroke={viewingPhone.specs.color.toLowerCase() === 'white' ? '#D1D5DB' : 'none'}
                        strokeWidth={viewingPhone.specs.color.toLowerCase() === 'white' ? 1 : 0}
                        className="w-6 h-6"
                      >
                        <path d="M10.5 18.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" />
                        <path fillRule="evenodd" d="M8.625.75A3.375 3.375 0 005.25 4.125v15.75a3.375 3.375 0 003.375 3.375h6.75a3.375 3.375 0 003.375-3.375V4.125A3.375 3.375 0 0015.375.75h-6.75zM7.5 4.125C7.5 3.504 8.004 3 8.625 3H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V3h1.125c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-6.75A1.125 1.125 0 017.5 19.875V4.125z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">{viewingPhone.specs.color}</span>
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Brand</p>
                    <p className="font-medium text-gray-900">{viewingPhone.brand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Model</p>
                    <p className="font-medium text-gray-900">{viewingPhone.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Condition</p>
                    <p className="font-medium text-gray-900">{viewingPhone.condition}</p>
                  </div>
                  {/* Pricing Information */}
                  <div className="col-span-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">💰 Selling Price</p>
                        <p className="font-bold text-green-700 text-2xl">₵{viewingPhone.value.toFixed(2)}</p>
                      </div>
                      {viewingPhone.cost_price && (userRole === 'manager' || userRole === 'ceo') && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">📊 Cost Price</p>
                          <p className="font-semibold text-gray-700 text-xl">₵{viewingPhone.cost_price.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                    {viewingPhone.cost_price && (userRole === 'manager' || userRole === 'ceo') && (
                      <div className="mt-3 pt-3 border-t border-green-300 bg-blue-100 -mx-4 px-4 py-2 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-blue-900">✅ Expected Profit per Sale:</span>
                          <span className="font-bold text-blue-700 text-xl">
                            +₵{(viewingPhone.value - viewingPhone.cost_price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Profit margin: {((viewingPhone.value - viewingPhone.cost_price) / viewingPhone.cost_price * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Display all specs in basic info */}
                  {viewingPhone.specs?.storage && (
                    <div>
                      <p className="text-xs text-gray-500">Internal Memory</p>
                      <p className="font-medium text-gray-900">{viewingPhone.specs.storage}</p>
                    </div>
                  )}
                  {viewingPhone.specs?.ram && (
                    <div>
                      <p className="text-xs text-gray-500">RAM</p>
                      <p className="font-medium text-gray-900">{viewingPhone.specs.ram}</p>
                    </div>
                  )}
                  {viewingPhone.specs?.cpu && (
                    <div>
                      <p className="text-xs text-gray-500">Processor</p>
                      <p className="font-medium text-gray-900">{viewingPhone.specs.cpu}</p>
                    </div>
                  )}
                  {viewingPhone.specs?.battery && (
                    <div>
                      <p className="text-xs text-gray-500">Battery</p>
                      <p className="font-medium text-gray-900">{viewingPhone.specs.battery}</p>
                    </div>
                  )}
                  {viewingPhone.specs?.battery_health && (
                    <div>
                      <p className="text-xs text-gray-500">Battery Health</p>
                      <p className="font-medium text-green-600">{viewingPhone.specs.battery_health}</p>
                    </div>
                  )}
                  {viewingPhone.imei && (
                    <div>
                      <p className="text-xs text-gray-500">IMEI</p>
                      <p className="font-mono font-medium text-gray-900">{viewingPhone.imei}</p>
                    </div>
                  )}
                </div>
              </div>


              {/* Swap Transaction Details (if swapped) */}
              {viewingPhone.status === 'SWAPPED' && viewingPhone.swapped_from_id && (
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-400">
                  <h3 className="text-sm font-semibold text-yellow-900 uppercase mb-3 flex items-center gap-2">
                    🔄 Swap Transaction Details
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    This phone was given to a customer through a swap transaction. 
                    <strong className="text-yellow-900"> Customer gave us a trade-in phone + cash in exchange.</strong>
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-yellow-300">
                    <p className="text-xs text-gray-600 mb-2">
                      📋 To view full swap details (trade-in phone, cash received, etc.):
                    </p>
                    <div className="flex flex-col gap-2">
                      <a 
                        href="/pending-resales" 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1"
                      >
                        → View in Pending Resales
                      </a>
                      <a 
                        href="/swap-manager" 
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1"
                      >
                        → View in Swap Manager
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 border-t-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
                  📅 Record Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {viewingPhone.created_at && (
                    <div>
                      <p className="text-xs text-gray-500">Added to System</p>
                      <p className="text-gray-900">{new Date(viewingPhone.created_at).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <p className="font-medium text-gray-900">
                      {viewingPhone.status?.replace('_', ' ').toUpperCase() || (viewingPhone.is_available ? 'AVAILABLE' : 'SOLD')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Close
                </button>
                {(userRole === 'manager' || userRole === 'ceo') && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(viewingPhone);
                    }}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Edit Phone
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBulkUpload(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Bulk Upload Phones</h2>
              <p className="text-sm text-gray-600 mt-1">Upload multiple phones at once using an Excel file</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📥 Step 1: Download Template</h3>
                <p className="text-sm text-blue-800 mb-3">Download the Excel template, fill in your phone data, then upload it here.</p>
                <button
                  onClick={async () => {
                    try {
                      const token = getToken();
                      const response = await axios.get(bulkUploadAPI.getPhoneTemplate(), {
                        headers: { 'Authorization': `Bearer ${token}` },
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'phones_template.xlsx');
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Failed to download template:', error);
                      alert('Failed to download template. Please try again.');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  📄 Download Template
                </button>
              </div>

              {/* Upload File */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">📤 Step 2: Upload Completed File</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                />
                {uploadFile && (
                  <p className="text-sm text-green-700 mt-2">✅ Selected: {uploadFile.name}</p>
                )}
              </div>

              {/* Upload Result */}
              {uploading && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                  <p className="text-yellow-800 mt-2">Uploading phones...</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setUploadFile(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={!uploadFile || uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? 'Uploading...' : 'Upload Phones'}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Bulk Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete {selectedPhones.length} selected phones? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete {selectedPhones.length} Phones
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Phones;

