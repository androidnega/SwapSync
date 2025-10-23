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

interface RepairItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  category_id: number;
  brand?: string;
  cost_price: number;
  selling_price: number;
  quantity: number;
  min_stock_level: number;
  description?: string;
  is_active: boolean;
  is_available: boolean;
}

interface Category {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

interface HubStats {
  total_repairs: number;
  total_revenue: number;
  service_charges: number;
  items_revenue: number;
  items_profit: number;
  total_profit: number;
  repairs_by_status: {
    pending: number;
    in_progress: number;
    completed: number;
    delivered: number;
  };
  user_role: string;
}

const Repairs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'repairs' | 'items' | 'stats'>('repairs');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [repairItems, setRepairItems] = useState<RepairItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hubStats, setHubStats] = useState<HubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [userRole, setUserRole] = useState<string>('');
  const [itemSearchTerm, setItemSearchTerm] = useState<string>('');
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_phone: '',
    customer_name: '',
    phone_description: '',
    issue: '',
    service_cost: '',
    due_date: '',
  });
  const [selectedItems, setSelectedItems] = useState<{item_id: number, quantity: number, name: string, price: number, sku?: string, stock: number}[]>([]);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    category: '',
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    min_stock_level: '5',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Repair items filtering and pagination
  const [itemCategoryFilter, setItemCategoryFilter] = useState('');
  const [itemStockFilter, setItemStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [itemCurrentPage, setItemCurrentPage] = useState(1);
  const itemItemsPerPage = 10;

  useEffect(() => {
    fetchRepairs();
    fetchUserRole();
    fetchCustomers();
    fetchRepairItems(); // Fetch for all roles (repairers need to select items too)
    fetchProducts(); // Fetch products from inventory for repair items
    fetchCategories(); // Fetch categories for repair item modal
    fetchHubStats(); // Fetch comprehensive hub statistics
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

  const fetchRepairItems = async () => {
    try {
      const response = await api.get('/repair-items/');
      setRepairItems(response.data);
    } catch (error) {
      console.error('Failed to fetch repair items:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/', {
        params: {
          in_stock_only: true,  // Only show products with stock
          limit: 1000  // Get all products
        }
      });
      setProducts(response.data.products || response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchHubStats = async () => {
    try {
      const response = await api.get('/repairs/stats/hub');
      setHubStats(response.data);
    } catch (error) {
      console.error('Failed to fetch hub stats:', error);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const itemData = {
      name: itemFormData.name,
      description: itemFormData.description || null,
      category: itemFormData.category || null,
      cost_price: parseFloat(itemFormData.cost_price),
      selling_price: parseFloat(itemFormData.selling_price),
      stock_quantity: parseInt(itemFormData.stock_quantity),
      min_stock_level: parseInt(itemFormData.min_stock_level),
    };

    try {
      if (editingItemId) {
        await api.put(`/repair-items/${editingItemId}`, itemData);
        setMessage('✅ Repair item updated successfully!');
      } else {
        await api.post('/repair-items/', itemData);
        setMessage('✅ Repair item added successfully!');
      }
      
      setShowItemModal(false);
      setItemFormData({
        name: '',
        description: '',
        category: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        min_stock_level: '5',
      });
      setEditingItemId(null);
      fetchRepairItems();
      fetchHubStats(); // Refresh stats after item changes
    } catch (error: any) {
      console.error('Item submission error:', error);
      const errorDetail = error.response?.data?.detail || error.message;
      setMessage(`❌ Error: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repair item?')) return;

    try {
      await api.delete(`/repair-items/${id}`);
      setMessage('✅ Repair item deleted successfully!');
      fetchRepairItems();
      fetchHubStats(); // Refresh stats after item deletion
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const openItemModal = (item?: RepairItem) => {
    if (item) {
      setItemFormData({
        name: item.name,
        description: item.description || '',
        category: item.category || '',
        cost_price: item.cost_price.toString(),
        selling_price: item.selling_price.toString(),
        stock_quantity: item.stock_quantity.toString(),
        min_stock_level: item.min_stock_level.toString(),
      });
      setEditingItemId(item.id);
    } else {
      setItemFormData({
        name: '',
        description: '',
        category: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        min_stock_level: '5',
      });
      setEditingItemId(null);
    }
    setShowItemModal(true);
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

  const handleAddItem = (item: RepairItem) => {
    const existing = selectedItems.find(i => i.item_id === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.item_id === item.id ? {...i, quantity: i.quantity + 1} : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        item_id: item.id,
        quantity: 1,
        name: item.name,
        price: item.selling_price
      }]);
    }
  };

  const handleRemoveItem = (item_id: number) => {
    setSelectedItems(selectedItems.filter(i => i.item_id !== item_id));
  };

  const handleItemQuantityChange = (item_id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(item_id);
    } else {
      setSelectedItems(selectedItems.map(i => 
        i.item_id === item_id ? {...i, quantity} : i
      ));
    }
  };

  const calculateTotalCost = () => {
    const serviceCost = parseFloat(formData.service_cost) || 0;
    const itemsCost = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return serviceCost + itemsCost;
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

    // Validate service cost
    const serviceCost = parseFloat(formData.service_cost) || 0;
    const itemsCost = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = serviceCost + itemsCost;

    if (totalCost <= 0) {
      setMessage('❌ Please enter a service cost or select repair items');
      return;
    }

    const repairData: any = {
      customer_id: parseInt(formData.customer_id),
      phone_description: formData.phone_description.trim(),
      issue_description: formData.issue.trim(),
      service_cost: serviceCost,
      items_cost: itemsCost,
      cost: totalCost,
      repair_items: selectedItems.map(item => ({
        repair_item_id: item.item_id,
        quantity: item.quantity
      }))
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
        service_cost: '', 
        due_date: '' 
      });
      setSelectedItems([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setEditingId(null);
      fetchRepairs();
      fetchHubStats(); // Refresh stats after creating/updating repair
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
      fetchHubStats(); // Refresh stats after status update
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
      fetchHubStats(); // Refresh stats after deletion
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
      service_cost: '', 
      due_date: '' 
    });
    setSelectedItems([]);
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
          <h1 className="text-2xl font-semibold text-gray-800">
            {userRole === 'manager' || userRole === 'ceo' ? 'Repairer Hub' : 'Repair Services'}
          </h1>
          {activeTab === 'repairs' && (userRole === 'repairer' || userRole === 'shop_keeper') && (
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              + New Repair
            </button>
          )}
          {activeTab === 'items' && (userRole === 'manager' || userRole === 'ceo') && (
            <button
              onClick={() => openItemModal()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              + Add Repair Item
            </button>
          )}
        </div>

        {/* Tabs - Only for Manager/CEO */}
        {(userRole === 'manager' || userRole === 'ceo') && (
          <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('repairs')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'repairs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🔧</span>
                <span>All Repairs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'items'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📦</span>
                <span>Repair Items Stock</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📊</span>
                <span>Hub Stats</span>
              </div>
            </button>
          </div>
        )}

      {/* ALL REPAIRS TAB */}
      {activeTab === 'repairs' && (
        <>
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
      <div className="overflow-x-auto border-b border-gray-200 scrollbar-hide">
        <div className="flex gap-1 md:gap-2 min-w-max">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2 md:px-4 py-2 font-medium flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              filterStatus === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">All Repairs</span>
            <span className="sm:hidden">All</span>
            <span className="px-1.5 md:px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {repairCounts.all}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-2 md:px-4 py-2 font-medium flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              filterStatus === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending
            <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded-full ${
              repairCounts.pending > 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {repairCounts.pending}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-2 md:px-4 py-2 font-medium flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              filterStatus === 'in_progress'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Progress</span>
            <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded-full ${
              repairCounts.in_progress > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {repairCounts.in_progress}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-2 md:px-4 py-2 font-medium flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              filterStatus === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Completed
            <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded-full ${
              repairCounts.completed > 0 ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {repairCounts.completed}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('delivered')}
            className={`px-2 md:px-4 py-2 font-medium flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              filterStatus === 'delivered'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Delivered
            <span className={`px-1.5 md:px-2 py-0.5 text-xs rounded-full ${
              repairCounts.delivered > 0 ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-500'
            }`}>
              {repairCounts.delivered}
            </span>
          </button>
        </div>
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

        </>
      )}

      {/* REPAIR ITEMS TAB */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📦 Repair Items Inventory</h3>
            <p className="text-gray-700">
              Manage stock of repair items like phone screens, batteries, and other components. These items can be selected when booking repairs.
            </p>
          </div>

          {/* Stock Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Items</div>
              <div className="text-3xl font-bold text-gray-900">{repairItems.length}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Total Stock Value</div>
              <div className="text-3xl font-bold text-green-600">
                ₵{repairItems.reduce((sum, item) => sum + (item.cost_price * item.stock_quantity), 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Low Stock Items</div>
              <div className="text-3xl font-bold text-orange-600">
                {repairItems.filter(item => item.stock_quantity <= item.min_stock_level).length}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
              <div className="text-3xl font-bold text-red-600">
                {repairItems.filter(item => item.stock_quantity === 0).length}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Items</label>
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={itemSearchTerm}
                  onChange={(e) => {
                    setItemSearchTerm(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={itemCategoryFilter}
                  onChange={(e) => {
                    setItemCategoryFilter(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {Array.from(new Set(repairItems.map(item => item.category).filter(Boolean))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Stock Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                <select
                  value={itemStockFilter}
                  onChange={(e) => {
                    setItemStockFilter(e.target.value);
                    setItemCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Items</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              
              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setItemSearchTerm('');
                    setItemCategoryFilter('');
                    setItemStockFilter('all');
                    setItemCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Filter items based on search and filters
                  let filteredItems = repairItems.filter(item => {
                    const matchesSearch = !itemSearchTerm || 
                      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                      (item.description && item.description.toLowerCase().includes(itemSearchTerm.toLowerCase()));
                    
                    const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter;
                    
                    const matchesStock = itemStockFilter === 'all' ||
                      (itemStockFilter === 'in_stock' && item.stock_quantity > item.min_stock_level) ||
                      (itemStockFilter === 'low_stock' && item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level) ||
                      (itemStockFilter === 'out_of_stock' && item.stock_quantity === 0);
                    
                    return matchesSearch && matchesCategory && matchesStock;
                  });
                  
                  // Pagination
                  const totalPages = Math.ceil(filteredItems.length / itemItemsPerPage);
                  const startIndex = (itemCurrentPage - 1) * itemItemsPerPage;
                  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemItemsPerPage);
                  
                  return (
                    <>
                      {paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            {repairItems.length === 0 
                              ? "No repair items yet. Add your first item!"
                              : "No items match your current filters."
                            }
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.category || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              ₵{item.cost_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-green-600">
                              ₵{item.selling_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                item.stock_quantity === 0
                                  ? 'bg-red-100 text-red-800'
                                  : item.stock_quantity <= item.min_stock_level
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.stock_quantity} units
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openItemModal(item)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </>
                  );
                })()}
              </tbody>
            </table>
            
            {/* Pagination */}
            {(() => {
              let filteredItems = repairItems.filter(item => {
                const matchesSearch = !itemSearchTerm || 
                  item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                  (item.description && item.description.toLowerCase().includes(itemSearchTerm.toLowerCase()));
                
                const matchesCategory = !itemCategoryFilter || item.category === itemCategoryFilter;
                
                const matchesStock = itemStockFilter === 'all' ||
                  (itemStockFilter === 'in_stock' && item.stock_quantity > item.min_stock_level) ||
                  (itemStockFilter === 'low_stock' && item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level) ||
                  (itemStockFilter === 'out_of_stock' && item.stock_quantity === 0);
                
                return matchesSearch && matchesCategory && matchesStock;
              });
              
              const totalPages = Math.ceil(filteredItems.length / itemItemsPerPage);
              
              if (totalPages <= 1) return null;
              
              return (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setItemCurrentPage(Math.max(1, itemCurrentPage - 1))}
                      disabled={itemCurrentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setItemCurrentPage(Math.min(totalPages, itemCurrentPage + 1))}
                      disabled={itemCurrentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">{(itemCurrentPage - 1) * itemItemsPerPage + 1}</span>
                        {' '}to{' '}
                        <span className="font-medium">
                          {Math.min(itemCurrentPage * itemItemsPerPage, filteredItems.length)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{filteredItems.length}</span>
                        {' '}results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setItemCurrentPage(Math.max(1, itemCurrentPage - 1))}
                          disabled={itemCurrentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setItemCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === itemCurrentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setItemCurrentPage(Math.min(totalPages, itemCurrentPage + 1))}
                          disabled={itemCurrentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* HUB STATS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Repairer Hub Statistics</h3>
            <p className="text-gray-700">
              Overview of repair services performance, service charges, and items profit analytics.
            </p>
          </div>

          {hubStats ? (
            <>
              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Total Repairs</div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{hubStats.total_repairs}</div>
                  <div className="text-xs text-gray-500">All time</div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-green-200">
                  <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    ₵{hubStats.total_revenue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Service + Items</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Service Charges</div>
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    ₵{hubStats.service_charges.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Workmanship fees</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-purple-200">
                  <div className="text-sm text-gray-600 mb-2">Items Profit</div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    ₵{hubStats.items_profit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">From items used</div>
                </div>
              </div>

              {/* Secondary Stats - Items Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">💰 Items Financial Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700 font-medium">Items Revenue (Sold to Customers)</span>
                      <span className="text-xl font-bold text-green-600">₵{hubStats.items_revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-gray-700 font-medium">Items Profit (Revenue - Cost)</span>
                      <span className="text-xl font-bold text-purple-600">₵{hubStats.items_profit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg">
                      <span className="text-gray-900 font-bold">Total Hub Profit</span>
                      <span className="text-2xl font-bold text-purple-700">₵{hubStats.total_profit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📋 Repairs by Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        {hubStats.repairs_by_status.pending}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Progress</span>
                      <span className="font-semibold text-blue-600">
                        {hubStats.repairs_by_status.in_progress}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-semibold text-green-600">
                        {hubStats.repairs_by_status.completed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivered</span>
                      <span className="font-semibold text-purple-600">
                        {hubStats.repairs_by_status.delivered}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">Loading statistics...</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Stock Alerts</h4>
              <div className="space-y-3">
                {repairItems.filter(item => item.stock_quantity <= item.min_stock_level).length === 0 ? (
                  <p className="text-gray-500 text-sm">All items have sufficient stock ✅</p>
                ) : (
                  repairItems
                    .filter(item => item.stock_quantity <= item.min_stock_level)
                    .map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-gray-700">{item.name}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          item.stock_quantity === 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.stock_quantity} left
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repair Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-gray-800">
                {editingId ? 'Edit Repair' : 'New Repair'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                {!editingId && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        <p className="text-xs text-gray-500 mt-1">SMS notifications sent here</p>
                      </div>
                      <div className="relative customer-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Customer *
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
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredCustomers.length > 0 ? (
                              filteredCustomers.map(customer => (
                                <div
                                  key={customer.id}
                                  onClick={() => handleCustomerSelect(customer)}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-sm">{customer.full_name}</div>
                                  <div className="text-xs text-gray-600">{customer.phone_number}</div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-xs">
                                {customerSearch ? 'No customers found' : 'Start typing to search'}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Search existing customer</p>
                      </div>
                    </div>
                    
                    {selectedCustomer && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
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
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Cost (₵)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.service_cost}
                      onChange={(e) => setFormData({ ...formData, service_cost: e.target.value })}
                      placeholder="Labor/service charge"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Labor cost only</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Description *
                  </label>
                  <textarea
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    required
                    rows={2}
                    placeholder="Describe the problem..."
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Repair Items Selection - Unified Inventory */}
                <div className="border-t border-gray-200 pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔧 Add Items Used (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Search inventory for spare parts, batteries, screens, etc.</p>
                  
                  {/* Selected Items */}
                  {selectedItems.length > 0 && (
                    <div className="mb-2 space-y-1.5">
                      {selectedItems.map(item => (
                        <div key={item.item_id} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                            {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max={item.stock}
                              value={item.quantity}
                              onChange={(e) => handleItemQuantityChange(item.item_id, parseInt(e.target.value))}
                              className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />
                            <span className="text-xs text-gray-600">×</span>
                            <span className="w-16 text-sm font-medium text-green-600 text-right">₵{item.price.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.item_id)}
                              className="text-red-600 hover:text-red-800 text-sm ml-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="🔍 Search by product name, SKU, or brand..."
                      value={itemSearchTerm}
                      onChange={(e) => setItemSearchTerm(e.target.value)}
                      onFocus={() => setShowItemsDropdown(true)}
                      onBlur={() => setTimeout(() => setShowItemsDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Available Products Dropdown */}
                  {showItemsDropdown && (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                      {products.filter(p => p.quantity > 0 && p.is_active).length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          <div className="mb-2">📦</div>
                          No products available in inventory
                        </div>
                      ) : (
                        <>
                          {products
                            .filter(product => 
                              product.quantity > 0 && 
                              product.is_active &&
                              !selectedItems.find(si => si.item_id === product.id) &&
                              (itemSearchTerm === '' || 
                               product.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                               (product.sku && product.sku.toLowerCase().includes(itemSearchTerm.toLowerCase())) ||
                               (product.brand && product.brand.toLowerCase().includes(itemSearchTerm.toLowerCase())))
                            )
                            .slice(0, 20) // Show max 20 results
                            .map(product => (
                              <button
                                key={`product-${product.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedItems([...selectedItems, {
                                    item_id: product.id,
                                    quantity: 1,
                                    name: product.name,
                                    price: product.selling_price,
                                    sku: product.sku,
                                    stock: product.quantity
                                  }]);
                                  setItemSearchTerm('');
                                  setShowItemsDropdown(false);
                                }}
                                className="w-full flex items-start gap-3 p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {product.brand && (
                                      <span className="text-xs text-gray-600">{product.brand}</span>
                                    )}
                                    {product.sku && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">SKU: {product.sku}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className="text-right">
                                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                                      product.quantity <= product.min_stock_level 
                                        ? 'bg-yellow-100 text-yellow-700' 
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {product.quantity} in stock
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-green-600">₵{product.selling_price.toFixed(2)}</div>
                                  <div className="text-blue-600 text-xl font-bold">+</div>
                                </div>
                              </button>
                            ))}
                          {products.filter(product => 
                            product.quantity > 0 && 
                            product.is_active &&
                            !selectedItems.find(si => si.item_id === product.id) &&
                            (itemSearchTerm === '' || 
                             product.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
                             (product.sku && product.sku.toLowerCase().includes(itemSearchTerm.toLowerCase())) ||
                             (product.brand && product.brand.toLowerCase().includes(itemSearchTerm.toLowerCase())))
                          ).length === 0 && itemSearchTerm !== '' && (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              <div className="mb-1">🔍</div>
                              No products match "{itemSearchTerm}"
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Cost Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Service Cost:</span>
                      <span>₵{(parseFloat(formData.service_cost) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Items Cost:</span>
                      <span>₵{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-900 text-base pt-1 border-t border-blue-300">
                      <span>Total Cost:</span>
                      <span>₵{calculateTotalCost().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Expected completion date</p>
                </div>
                
                <div className="flex gap-2 justify-end pt-2 mt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Repair Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowItemModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 md:p-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                {editingItemId ? 'Edit Repair Item' : 'Add Repair Item'}
              </h2>
            </div>
            <div className="overflow-y-auto p-3 md:p-4">
              <form onSubmit={handleItemSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                      required
                      placeholder="e.g., iPhone 12 Screen"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={itemFormData.category}
                      onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                    rows={2}
                    placeholder="Additional details about this item..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (₵) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemFormData.cost_price}
                      onChange={(e) => setItemFormData({ ...itemFormData, cost_price: e.target.value })}
                      required
                      placeholder="Your buying cost"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (₵) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemFormData.selling_price}
                      onChange={(e) => setItemFormData({ ...itemFormData, selling_price: e.target.value })}
                      required
                      placeholder="Customer price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={itemFormData.stock_quantity}
                      onChange={(e) => setItemFormData({ ...itemFormData, stock_quantity: e.target.value })}
                      required
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Level *
                    </label>
                    <input
                      type="number"
                      value={itemFormData.min_stock_level}
                      onChange={(e) => setItemFormData({ ...itemFormData, min_stock_level: e.target.value })}
                      required
                      placeholder="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    {editingItemId ? 'Update' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Repairs;

