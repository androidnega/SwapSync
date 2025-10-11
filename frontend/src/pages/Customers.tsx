import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faEnvelope, faCalendar, faKey, faEye, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../services/api';

interface Customer {
  id: number;
  unique_id?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  created_at: string;
  deletion_code?: string;
  code_generated_at?: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
  });
  const [deletionCode, setDeletionCode] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [deletionCodes, setDeletionCodes] = useState<Map<number, {code: string, timestamp: number}>>(new Map());
  const [codeTimer, setCodeTimer] = useState<number>(0);

  useEffect(() => {
    fetchCustomers();
    fetchUserRole();
  }, []);

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

  const generateDeletionCode = (customerId: number): {code: string, timestamp: number} => {
    const existing = deletionCodes.get(customerId);
    const now = Date.now();
    
    // If code exists and is less than 5 minutes old, reuse it
    if (existing && (now - existing.timestamp < 5 * 60 * 1000)) {
      return existing;
    }
    
    // Generate simple code based only on customer ID (no timestamp in code itself)
    const code = `DEL${String(customerId).padStart(6, '0')}`;
    const newCode = { code, timestamp: now };
    
    // Store in map
    const newMap = new Map(deletionCodes);
    newMap.set(customerId, newCode);
    setDeletionCodes(newMap);
    
    return newCode;
  };

  const fetchCustomers = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/customers/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Add deletion codes to customers
      const customersWithCodes = response.data.map((customer: Customer) => {
        const codeData = generateDeletionCode(customer.id);
        return {
          ...customer,
          deletion_code: codeData.code,
          code_generated_at: new Date(codeData.timestamp).toISOString()
        };
      });
      setCustomers(customersWithCodes);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const customerData = {
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      email: formData.email.trim() || undefined,
    };

    try {
      const token = getToken();
      if (editingId) {
        await axios.put(`${API_URL}/customers/${editingId}`, customerData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Customer updated successfully!');
      } else {
        await axios.post(`${API_URL}/customers/`, customerData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ Customer created successfully!');
      }
      
      setShowModal(false);
      setFormData({ full_name: '', phone_number: '', email: '' });
      setEditingId(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Customer submission error:', error);
      const errorDetail = error.response?.data?.detail || error.message;
      setMessage(`❌ Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
  };

  const handleView = (customer: Customer) => {
    // Reuse deletion code from customer list (already has 5-minute timer)
    const codeData = deletionCodes.get(customer.id);
    if (codeData) {
      const timeLeft = Math.max(0, Math.floor((5 * 60 * 1000 - (Date.now() - codeData.timestamp)) / 1000));
      setCodeTimer(timeLeft);
      
      // Start countdown
      const interval = setInterval(() => {
        const newTimeLeft = Math.max(0, Math.floor((5 * 60 * 1000 - (Date.now() - codeData.timestamp)) / 1000));
        setCodeTimer(newTimeLeft);
        
        if (newTimeLeft === 0) {
          clearInterval(interval);
          // Regenerate code after 5 minutes
          fetchCustomers();
        }
      }, 1000);
      
      // Clear interval when modal closes
      setTimeout(() => clearInterval(interval), 300000); // 5 minutes
    }
    
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      full_name: customer.full_name,
      phone_number: customer.phone_number,
      email: customer.email || '',
    });
    setEditingId(customer.id);
    setShowModal(true);
  };

  const handleDeleteRequest = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeletionCode('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    // Get the current valid code from the map (with timer)
    const codeData = deletionCodes.get(selectedCustomer.id);
    
    if (!codeData) {
      setMessage('❌ No deletion code found! Please view customer details first.');
      return;
    }
    
    // Check if code has expired (5 minutes)
    const ageInMs = Date.now() - codeData.timestamp;
    if (ageInMs > 5 * 60 * 1000) {
      setMessage('❌ Deletion code has expired! Please view customer details to get a new code.');
      return;
    }
    
    const expectedCode = codeData.code;
    const enteredCode = deletionCode.trim().toUpperCase();
    const expectedCodeUpper = expectedCode.toUpperCase();
    
    console.log('Entered code:', enteredCode);
    console.log('Expected code:', expectedCodeUpper);
    console.log('Code age (seconds):', Math.floor(ageInMs / 1000));
    
    if (enteredCode !== expectedCodeUpper) {
      setMessage(`❌ Invalid deletion code! Expected: ${expectedCode}`);
      return;
    }

    try {
      const token = getToken();
      await axios.delete(`${API_URL}/customers/${selectedCustomer.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Customer deleted successfully!');
      setShowDeleteModal(false);
      setSelectedCustomer(null);
      setDeletionCode('');
      fetchCustomers();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const openNewModal = () => {
    setFormData({ full_name: '', phone_number: '', email: '' });
    setEditingId(null);
    setShowModal(true);
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Filter customers
  const filteredCustomers = searchQuery.trim()
    ? customers.filter(customer =>
        customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone_number.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your customer database</p>
          </div>
        <button
          onClick={openNewModal}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Customer</span>
        </button>
      </div>

      {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Showing {paginatedCustomers.length} of {filteredCustomers.length} customers
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {filteredCustomers.length === 0 && customers.length === 0
                        ? 'No customers yet. Click "Add Customer" to get started!'
                        : 'No customers match your search.'}
                </td>
              </tr>
            ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {customer.unique_id || `#${customer.id}`}
                        </span>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{customer.full_name}</span>
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.email || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(customer.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleView(customer)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          View
                        </button>
                        {userRole === 'shop_keeper' && (
                          <span className="text-gray-400" title="Shop keepers cannot edit customers">
                            Edit
                          </span>
                        )}
                        {(userRole === 'manager' || userRole === 'ceo' || userRole === 'admin') && (
                    <button
                      onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Edit
                    </button>
                        )}
                        {(userRole === 'manager' || userRole === 'ceo') && (
                    <button
                            onClick={() => handleDeleteRequest(customer)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Delete
                    </button>
                        )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </div>

        {/* Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {paginatedCustomers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 border border-gray-200">
              {filteredCustomers.length === 0 && customers.length === 0
                ? 'No customers yet. Click "Add Customer" to get started!'
                : 'No customers match your search.'}
            </div>
          ) : (
            paginatedCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">{customer.full_name}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {customer.unique_id || `#${customer.id}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                    <span>{customer.phone_number}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                    <span>{formatDate(customer.created_at)}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleView(customer)}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      View
                    </button>
                    {(userRole === 'manager' || userRole === 'ceo' || userRole === 'admin') && (
                      <button
                        onClick={() => handleEdit(customer)}
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {(userRole === 'manager' || userRole === 'ceo') && (
                      <button
                        onClick={() => handleDeleteRequest(customer)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm px-4 sm:px-6 py-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">
                    {selectedCustomer.unique_id || `#${selectedCustomer.id}`}
                  </span>
                  <FontAwesomeIcon icon={faEye} className="text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Full Name</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.full_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faPhone} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Phone Number</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{selectedCustomer.phone_number}</p>
                </div>

                {selectedCustomer.email && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-600" />
                      <span className="text-sm text-gray-600">Email</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{selectedCustomer.email}</p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-600" />
                    <span className="text-sm text-gray-600">Created Date</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedCustomer.created_at)}</p>
                </div>

                {/* Deletion Code - Only visible to Shop Keeper and Repairer, NOT Manager or Admin */}
                {(userRole === 'shop_keeper' || userRole === 'repairer') && (
                  <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faKey} className="text-yellow-600" />
                        <span className="text-sm text-yellow-700 font-semibold">Deletion Code</span>
                      </div>
                      {codeTimer > 0 && (
                        <div className="bg-yellow-200 px-3 py-1.5 rounded-lg text-sm font-bold text-yellow-900">
                          ⏱️ {Math.floor(codeTimer / 60)}:{String(codeTimer % 60).padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-yellow-900 tracking-wider mb-3">{selectedCustomer.deletion_code}</p>
                    <div className="bg-yellow-100 rounded p-2 mb-2">
                      <p className="text-xs text-yellow-800 font-medium">
                        ⏱️ Valid for: <span className="font-bold">{Math.floor(codeTimer / 60)} minutes {codeTimer % 60} seconds</span>
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700">
                      ⚠️ Share this code with Manager to delete this customer
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal - Only for Managers */}
        {showDeleteModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delete Customer</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 mb-2">
                  <strong>⚠️ Warning:</strong> You are about to delete:
                </p>
                <p className="text-lg font-semibold text-red-900">{selectedCustomer.full_name}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Deletion Code (Get from Staff)
                </label>
                <input
                  type="text"
                  value={deletionCode}
                  onChange={(e) => setDeletionCode(e.target.value.toUpperCase())}
                  placeholder="e.g., DEL000123"
                  className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-lg uppercase"
                  maxLength={10}
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Shopkeeper/Repairer can see this code in the customer's "View" details
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  ⏱️ Code is valid for 5 minutes from generation
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Update' : 'Create'}
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

export default Customers;
