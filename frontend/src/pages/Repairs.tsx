import React, { useState, useEffect } from 'react';
import api, { API_URL, repairAPI } from '../services/api';
import { getToken } from '../services/authService';

interface Repair {
  id: number;
  customer_id: number;
  phone_description: string;
  issue: string;
  cost: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email?: string;
}

const Repairs: React.FC = () => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [userRole, setUserRole] = useState<string>('');
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_phone: '',
    customer_name: '',
    phone_description: '',
    issue: '',
    cost: '',
    due_date: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRepairs();
    fetchUserRole();
    fetchCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-dropdown-container')) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const fetchUserRole = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchRepairs = async () => {
    try {
      const response = await api.get('/repairs/');
      setRepairs(response.data);
    } catch (error) {
      console.error('Failed to fetch repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.full_name);
    setFormData({
      ...formData,
      customer_name: customer.full_name,
      customer_phone: customer.phone_number,
      customer_id: customer.id.toString()
    });
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone_number.includes(customerSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validate customer selection
    if (!formData.customer_id || !selectedCustomer) {
      setMessage('❌ Please select a customer from the dropdown');
      return;
    }

    // Validate cost
    const costNum = parseFloat(formData.cost);
    if (isNaN(costNum) || costNum <= 0) {
      setMessage('❌ Please enter a valid cost greater than 0');
      return;
    }

    const repairData: any = {
      customer_id: parseInt(formData.customer_id),
      phone_description: formData.phone_description.trim(),
      issue_description: formData.issue.trim(),
      cost: costNum,
    };

    // Add optional fields
    if (formData.due_date) {
      repairData.due_date = formData.due_date;
    }

    console.log('Submitting repair data:', repairData);
    
    try {
      if (editingId) {
        const response = await api.put(`/repairs/${editingId}`, repairData);
        console.log('Update response:', response.data);
        setMessage('✅ Repair updated successfully!');
      } else {
        const response = await api.post('/repairs/', repairData);
        console.log('Create response:', response.data);
        setMessage('✅ Repair created successfully! SMS notification sent.');
      }
      
      setShowModal(false);
      setFormData({ 
        customer_id: '',
        customer_phone: '', 
        customer_name: '', 
        phone_description: '', 
        issue: '', 
        cost: '', 
        due_date: '' 
      });
      setSelectedCustomer(null);
      setCustomerSearch('');
      setEditingId(null);
      fetchRepairs();
    } catch (error: any) {
      console.error('Repair submission error:', error);
      const errorDetail = error.response?.data?.detail || error.message;
      setMessage(`❌ Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string, confirmMessage: string) => {
    // Show confirmation dialog
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await api.patch(`/repairs/${id}/status`, null, {
        params: { new_status: newStatus }
      });
      setMessage(`✅ Status updated to ${newStatus}! SMS notification sent to customer.`);
      fetchRepairs();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleEdit = (repair: Repair) => {
    setFormData({
      customer_id: repair.customer_id.toString(),
      customer_phone: '',  // We don't store phone number in repair
      customer_name: '',
      phone_description: repair.phone_description,
      issue: repair.issue,
      cost: repair.cost.toString(),
      due_date: ''
    });
    setEditingId(repair.id);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repair?')) return;

    try {
      await api.delete(`/repairs/${id}`);
      setMessage('✅ Repair deleted successfully!');
      fetchRepairs();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const openNewModal = () => {
    setFormData({ 
      customer_id: '',
      customer_phone: '', 
      customer_name: '', 
      phone_description: '', 
      issue: '', 
      cost: '', 
      due_date: '' 
    });
    setSelectedCustomer(null);
    setCustomerSearch('');
    setEditingId(null);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter repairs by status
  const statusFilteredRepairs = filterStatus === 'all'
    ? repairs
    : repairs.filter(r => 
        r.status.toLowerCase().replace(/\s+/g, '_') === filterStatus.toLowerCase()
      );
  
  // Further filter by search query
  const filteredRepairs = statusFilteredRepairs.filter(r => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      r.phone_description.toLowerCase().includes(query) ||
      r.issue.toLowerCase().includes(query) ||
      r.id.toString().includes(query)
    );
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRepairs = filteredRepairs.slice(startIndex, endIndex);
  
  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);
  
  // Count repairs by status for tab badges
  const repairCounts = {
    all: repairs.length,
    pending: repairs.filter(r => r.status.toLowerCase().replace(/\s+/g, '_') === 'pending').length,
    in_progress: repairs.filter(r => r.status.toLowerCase().replace(/\s+/g, '_') === 'in_progress').length,
    completed: repairs.filter(r => r.status.toLowerCase().replace(/\s+/g, '_') === 'completed').length,
    delivered: repairs.filter(r => r.status.toLowerCase().replace(/\s+/g, '_') === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading repairs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Repairs Management</h1>
        {(userRole === 'repairer' || userRole === 'shop_keeper') && (
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            + New Repair
          </button>
        )}
      </div>

      {/* Manager Restriction Message */}
      {(userRole === 'manager' || userRole === 'ceo') && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔒 Manager Restriction</h3>
          <p className="text-yellow-800 mb-3">
            Managers cannot book repairs. Only <strong>Repairers</strong> and <strong>Shopkeepers</strong> can create repair bookings.
          </p>
          <p className="text-yellow-700 text-sm">
            💡 You can view all repairs below and update their status, but bookings must be created by repairers/shopkeepers.
          </p>
        </div>
      )}

      {/* Workflow Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🔄</span> Repair Workflow Guide
        </h3>
        <div className="flex flex-col md:flex-row gap-3 text-xs">
          <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">1️⃣</span>
              <span className="font-semibold text-blue-700">Create Booking</span>
            </div>
            <p className="text-gray-600">Customer brings phone for repair</p>
          </div>
          <span className="hidden md:block text-gray-400 self-center">→</span>
          <div className="flex-1 bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">2️⃣</span>
              <span className="font-semibold text-blue-700">Start Repair</span>
            </div>
            <p className="text-gray-600">Click "▶️ Start Repair" to begin work</p>
          </div>
          <span className="hidden md:block text-gray-400 self-center">→</span>
          <div className="flex-1 bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">3️⃣</span>
              <span className="font-semibold text-green-700">Mark Complete</span>
            </div>
            <p className="text-gray-600">When fixed, click "✓ Mark Complete"</p>
          </div>
          <span className="hidden md:block text-gray-400 self-center">→</span>
          <div className="flex-1 bg-white rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">4️⃣</span>
              <span className="font-semibold text-purple-700">Deliver</span>
            </div>
            <p className="text-gray-600">When customer picks up, click "📦 Mark Delivered"</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
          <span>💡</span> <strong>SMS notifications</strong> are automatically sent to customers at each step!
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <input
          type="text"
          placeholder="Search by phone, issue, or repair ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredRepairs.length} result{filteredRepairs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            filterStatus === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Repairs
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
            {repairCounts.all}
          </span>
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            filterStatus === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            repairCounts.pending > 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'
          }`}>
            {repairCounts.pending}
          </span>
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            filterStatus === 'in_progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          In Progress
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            repairCounts.in_progress > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'
          }`}>
            {repairCounts.in_progress}
          </span>
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            filterStatus === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            repairCounts.completed > 0 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
          }`}>
            {repairCounts.completed}
          </span>
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`px-4 py-2 font-medium flex items-center gap-2 ${
            filterStatus === 'delivered'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Delivered
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            repairCounts.delivered > 0 ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'
          }`}>
            {repairCounts.delivered}
          </span>
        </button>
      </div>

      {/* Desktop Table - Hidden on Mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost (₵)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRepairs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium mb-1">
                      {filterStatus === 'all' 
                        ? 'No repairs yet' 
                        : `No ${filterStatus.replace('_', ' ')} repairs`}
                    </p>
                    <p className="text-sm">
                      {filterStatus === 'all' 
                        ? 'Create your first repair booking!' 
                        : 'Try a different filter or create a new repair'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRepairs.map((repair) => (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {repair.phone_description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {repair.issue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₵{repair.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                      {repair.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(repair.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-2">
                      {/* Workflow Action Buttons */}
                      <div className="flex gap-2">
                        {repair.status.toLowerCase() === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(
                              repair.id, 
                              'In Progress',
                              '🔧 Start working on this repair? Customer will be notified that repair is in progress.'
                            )}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium flex items-center gap-1"
                          >
                            <span>▶️</span> Start Repair
                          </button>
                        )}
                        {repair.status.toLowerCase().replace(/\s+/g, '_') === 'in_progress' && (
                          <button
                            onClick={() => handleStatusUpdate(
                              repair.id, 
                              'Completed',
                              '✅ Mark this repair as completed? Customer will be notified that phone is ready for pickup.'
                            )}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium flex items-center gap-1"
                          >
                            <span>✓</span> Mark Complete
                          </button>
                        )}
                        {repair.status.toLowerCase() === 'completed' && (
                          <button
                            onClick={() => handleStatusUpdate(
                              repair.id, 
                              'Delivered',
                              '📦 Confirm phone delivery? Customer will receive a delivery confirmation.'
                            )}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium flex items-center gap-1"
                          >
                            <span>📦</span> Mark Delivered
                          </button>
                        )}
                        {repair.status.toLowerCase() === 'delivered' && (
                          <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200">
                            ✓ Completed & Delivered
                          </span>
                        )}
                      </div>
                      {/* Management Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(repair)}
                          className="text-blue-600 hover:text-blue-900 text-xs underline"
                        >
                          Edit Details
                        </button>
                        {repair.status.toLowerCase() !== 'delivered' && (
                          <button
                            onClick={() => handleDelete(repair.id)}
                            className="text-red-600 hover:text-red-900 text-xs underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Desktop */}
      {totalPages > 1 && (
        <div className="hidden md:flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRepairs.length)} of {filteredRepairs.length} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Mobile Card View - Shown on Mobile */}
      <div className="md:hidden space-y-4">
        {filteredRepairs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium mb-1">
                {filterStatus === 'all' 
                  ? 'No repairs yet' 
                  : `No ${filterStatus.replace('_', ' ')} repairs`}
              </p>
              <p className="text-sm">
                {filterStatus === 'all' 
                  ? 'Create your first repair booking!' 
                  : 'Try a different filter or create a new repair'}
              </p>
            </div>
          </div>
        ) : (
          paginatedRepairs.map((repair) => (
            <div key={repair.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{repair.phone_description}</h3>
                  <p className="text-sm text-gray-500 mt-1">{repair.issue}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(repair.status)}`}>
                  {repair.status.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cost:</span>
                  <span className="font-medium text-gray-900">₵{repair.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer:</span>
                  <span className="text-gray-900">{repair.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-600">{repair.customer_phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-600">{new Date(repair.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Workflow Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                {repair.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(
                      repair.id, 
                      'In Progress',
                      '🔧 Start working on this repair? Customer will be notified that repair is in progress.'
                    )}
                    className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>▶️</span> Start Repair
                  </button>
                )}
                {repair.status.toLowerCase().replace(/\s+/g, '_') === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate(
                      repair.id, 
                      'Completed',
                      '✅ Mark this repair as completed? Customer will be notified that phone is ready for pickup.'
                    )}
                    className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>✓</span> Mark Complete (Ready for Pickup)
                  </button>
                )}
                {repair.status.toLowerCase() === 'completed' && (
                  <button
                    onClick={() => handleStatusUpdate(
                      repair.id, 
                      'Delivered',
                      '📦 Confirm phone delivery? Customer will receive a delivery confirmation.'
                    )}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span>📦</span> Mark Delivered
                  </button>
                )}
                {repair.status.toLowerCase() === 'delivered' && (
                  <div className="w-full px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center border border-green-200">
                    ✓ Completed & Delivered
                  </div>
                )}
                
                {/* Management Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(repair)}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
                  >
                    Edit Details
                  </button>
                  {repair.status.toLowerCase() !== 'delivered' && (
                    <button
                      onClick={() => handleDelete(repair.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
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

      {/* Pagination Controls - Mobile */}
      {totalPages > 1 && (
        <div className="md:hidden flex flex-col gap-3 bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-700 text-center">
            Page {currentPage} of {totalPages} ({filteredRepairs.length} total results)
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Edit Repair' : 'New Repair'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      required
                      placeholder="+233..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">SMS notifications will be sent to this number</p>
                  </div>
                  <div className="relative customer-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Customer
                    </label>
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search by name or phone..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Searchable Dropdown */}
                    {showCustomerDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(customer => (
                            <div
                              key={customer.id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.full_name}</div>
                              <div className="text-xs text-gray-600">{customer.phone_number}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            {customerSearch ? 'No customers found. Type to search...' : 'Start typing to search customers...'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {selectedCustomer && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-green-900">{selectedCustomer.full_name}</div>
                          <div className="text-xs text-green-700">{selectedCustomer.phone_number}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch('');
                            setFormData({ ...formData, customer_id: '', customer_name: '', customer_phone: '' });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Search and select an existing customer or enter manually below</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Description *
                </label>
                <input
                  type="text"
                  value={formData.phone_description}
                  onChange={(e) => setFormData({ ...formData, phone_description: e.target.value })}
                  required
                  placeholder="e.g., iPhone 12 Pro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Description *
                </label>
                <textarea
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe the problem..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repair Cost (₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                  placeholder="e.g., 200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Expected completion date for this repair</p>
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

export default Repairs;

