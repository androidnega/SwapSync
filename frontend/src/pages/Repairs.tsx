import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
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

  useEffect(() => {
    fetchRepairs();
    fetchUserRole();
    fetchCustomers();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchRepairs = async () => {
    try {
      const response = await axios.get(`${API_URL}/repairs/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setRepairs(response.data);
    } catch (error) {
      console.error('Failed to fetch repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
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
      customer_phone: customer.phone_number
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

    // Validate cost
    const costNum = parseFloat(formData.cost);
    if (isNaN(costNum) || costNum <= 0) {
      setMessage('❌ Please enter a valid cost greater than 0');
      return;
    }

    const repairData: any = {
      customer_phone: formData.customer_phone.trim(),
      phone_description: formData.phone_description.trim(),
      issue: formData.issue.trim(),
      cost: costNum,
    };

    // Add optional fields
    if (formData.customer_name.trim()) {
      repairData.customer_name = formData.customer_name.trim();
    }
    if (formData.due_date) {
      repairData.due_date = formData.due_date;
    }

    console.log('Submitting repair data:', repairData);

    try {
      if (editingId) {
        const response = await axios.put(`${API_URL}/repairs/${editingId}`, repairData);
        console.log('Update response:', response.data);
        setMessage('✅ Repair updated successfully!');
      } else {
        const response = await axios.post(`${API_URL}/repairs/`, repairData);
        console.log('Create response:', response.data);
        setMessage('✅ Repair created successfully! SMS notification sent.');
      }
      
      setShowModal(false);
      setFormData({ 
        customer_phone: '', 
        customer_name: '', 
        phone_description: '', 
        issue: '', 
        cost: '', 
        due_date: '' 
      });
      setEditingId(null);
      fetchRepairs();
    } catch (error: any) {
      console.error('Repair submission error:', error);
      const errorDetail = error.response?.data?.detail || error.message;
      setMessage(`❌ Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await axios.put(`${API_URL}/repairs/${id}/status`, { status: newStatus });
      setMessage(`✅ Status updated to ${newStatus}! SMS notification sent.`);
      fetchRepairs();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleEdit = (repair: Repair) => {
    setFormData({
      customer_phone: '',  // We don't store phone number in repair
      phone_description: repair.phone_description,
      issue: repair.issue,
      cost: repair.cost.toString(),
    });
    setEditingId(repair.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repair?')) return;

    try {
      await axios.delete(`${API_URL}/repairs/${id}`);
      setMessage('✅ Repair deleted successfully!');
      fetchRepairs();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const openNewModal = () => {
    setFormData({ 
      customer_phone: '', 
      customer_name: '', 
      phone_description: '', 
      issue: '', 
      cost: '', 
      due_date: '' 
    });
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

  const filteredRepairs = filterStatus === 'all'
    ? repairs
    : repairs.filter(r => r.status.toLowerCase() === filterStatus.toLowerCase());

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

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 font-medium ${
            filterStatus === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Repairs
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 font-medium ${
            filterStatus === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-4 py-2 font-medium ${
            filterStatus === 'in_progress'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 font-medium ${
            filterStatus === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilterStatus('delivered')}
          className={`px-4 py-2 font-medium ${
            filterStatus === 'delivered'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Delivered
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
            {filteredRepairs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No repairs found. Click "New Repair" to add one!
                </td>
              </tr>
            ) : (
              filteredRepairs.map((repair) => (
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
                    <div className="flex gap-2">
                      {repair.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(repair.id, 'In Progress')}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Start
                        </button>
                      )}
                      {repair.status.toLowerCase() === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(repair.id, 'Completed')}
                          className="text-green-600 hover:text-green-900 text-xs"
                        >
                          Complete
                        </button>
                      )}
                      {repair.status.toLowerCase() === 'completed' && (
                        <button
                          onClick={() => handleStatusUpdate(repair.id, 'Delivered')}
                          className="text-purple-600 hover:text-purple-900 text-xs"
                        >
                          Deliver
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(repair)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(repair.id)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Shown on Mobile */}
      <div className="md:hidden space-y-4">
        {filteredRepairs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No repairs found. Click "New Repair" to add one!
          </div>
        ) : (
          filteredRepairs.map((repair) => (
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
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                {repair.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(repair.id, 'In Progress')}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                  >
                    Start
                  </button>
                )}
                {repair.status.toLowerCase() === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate(repair.id, 'Completed')}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                  >
                    Complete
                  </button>
                )}
                {repair.status.toLowerCase() === 'completed' && (
                  <button
                    onClick={() => handleStatusUpdate(repair.id, 'Delivered')}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium"
                  >
                    Deliver
                  </button>
                )}
                <button
                  onClick={() => handleEdit(repair)}
                  className="flex-1 min-w-[60px] px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(repair.id)}
                  className="flex-1 min-w-[60px] px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
                  <div className="relative">
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
                            No customers found. Type to search...
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
                            setFormData({ ...formData, customer_name: '', customer_phone: '' });
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

