/**
 * Product Sales Management Page
 * Record direct product sales (phones, accessories, etc.)
 */
import { useState, useEffect } from 'react';
import { productSaleAPI, customerAPI, productAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShoppingCart, faUsers, faBox, faMoneyBillWave, faPlus, 
  faExclamationTriangle, faCheckCircle, faInfoCircle, faFileExport 
} from '@fortawesome/free-solid-svg-icons';
import SaleReceipt from '../components/SaleReceipt';

interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
}

interface Product {
  id: number;
  name: string;
  brand: string | null;
  selling_price: number;
  cost_price: number;
  discount_price: number | null;
  quantity: number;
  is_available: boolean;
  condition: string;
  specs?: any;
}

interface ProductSale {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  created_by?: {
    id: number;
    full_name: string;
    display_name?: string;
  };
}

const ProductSales = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Your Shop');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [customerType, setCustomerType] = useState<'existing' | 'new' | 'walkin'>('existing');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<any>(null);
  
  const [form, setForm] = useState({
    customer_id: '',
    product_id: '',
    quantity: '1',
    unit_price: '',
    discount_amount: '0',
    customer_phone: '',
    customer_email: '',
  });

  const [newCustomerData, setNewCustomerData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
      // Use company_name from response, or default to user's display name if not available
      setCompanyName(response.data.company_name || response.data.display_name || 'Your Shop');
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  useEffect(() => {
    // Update selected product when product_id changes
    const product = products.find(p => p.id === parseInt(form.product_id));
    setSelectedProduct(product || null);
    
    // Auto-fill unit_price with product selling price
    if (product) {
      const price = product.discount_price || product.selling_price;
      setForm(prev => ({ ...prev, unit_price: price.toString() }));
    }
  }, [form.product_id, products]);

  const loadData = async () => {
    try {
      const [customersRes, productsRes, salesRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll({ is_active: true }),
        productSaleAPI.getAll(),
      ]);

      setCustomers(customersRes.data);
      setProducts(productsRes.data);
      setRecentSales(salesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateQuickCustomer = async () => {
    try {
      const token = getToken();
      const response = await axios.post('http://localhost:8000/api/customers/', newCustomerData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newCustomer = response.data;
      setCustomers([...customers, newCustomer]);
      setForm({ ...form, customer_id: newCustomer.id.toString() });
      setShowNewCustomerModal(false);
      setNewCustomerData({ full_name: '', phone_number: '', email: '' });
      alert('✅ Customer added successfully!');
    } catch (error: any) {
      alert(`❌ Failed to add customer: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate stock
    const qty = parseInt(form.quantity);
    if (selectedProduct && qty > selectedProduct.quantity) {
      alert(`❌ Insufficient stock! Available: ${selectedProduct.quantity}, Requested: ${qty}`);
      setLoading(false);
      return;
    }

    try {
      // Get customer phone - either from form (walk-in/new) or from selected customer
      let customerPhone = form.customer_phone;
      if (customerType === 'existing' && form.customer_id) {
        const selectedCustomer = customers.find(c => c.id === parseInt(form.customer_id));
        customerPhone = selectedCustomer?.phone_number || '';
      }

      // Validate customer_id for existing customers
      if (customerType === 'existing' && !form.customer_id) {
        alert('❌ Please select a customer');
        setLoading(false);
        return;
      }

      const payload = {
        customer_id: customerType === 'walkin' ? null : (form.customer_id ? parseInt(form.customer_id) : null),
        product_id: parseInt(form.product_id),
        quantity: qty,
        unit_price: parseFloat(form.unit_price),
        discount_amount: parseFloat(form.discount_amount) || 0,
        customer_phone: customerPhone,
        customer_email: form.customer_email || null,
      };

      console.log('Product sale payload:', payload);

      const response = await productSaleAPI.create(payload);
      console.log('Product sale response:', response);
      
      // Extract the sale data from response
      const saleData = response.data || response;
      
      // Prepare receipt data
      const receiptData = {
        id: saleData.id,
        product_name: selectedProduct.name,
        product_brand: selectedProduct.brand || undefined,
        quantity: qty,
        unit_price: parseFloat(form.unit_price),
        discount_amount: parseFloat(form.discount_amount) || 0,
        total_amount: saleData.total_amount || (qty * parseFloat(form.unit_price) - parseFloat(form.discount_amount || '0')),
        customer_name: customerPhone ? (customers.find(c => c.id === parseInt(form.customer_id))?.full_name || 'Walk-in Customer') : 'Walk-in Customer',
        customer_phone: customerPhone,
        created_at: saleData.created_at || new Date().toISOString(),
        served_by: 'Current User', // TODO: Get from auth
      };
      
      console.log('Receipt data prepared:', receiptData);
      
      // Reset form first
      setForm({
        customer_id: '',
        product_id: '',
        quantity: '1',
        unit_price: '',
        discount_amount: '0',
        customer_phone: '',
        customer_email: '',
      });
      setSelectedProduct(null);
      setCustomerType('existing');

      // Reload data
      await loadData();
      
      // Show receipt modal last (after everything else is done)
      setLastSaleReceipt(receiptData);
      setShowReceiptModal(true);
      
      console.log('✅ Sale recorded successfully');
    } catch (error: any) {
      console.error('Sale error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`❌ Failed to record sale: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Export daily sales
  const exportDailySales = async (format: 'pdf' | 'excel') => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = recentSales.filter(sale => 
        new Date(sale.created_at).toISOString().split('T')[0] === today
      );

      if (format === 'excel') {
        // Simple CSV export
        const headers = 'ID,Customer ID,Product ID,Quantity,Unit Price,Discount,Total,Date\n';
        const rows = todaySales.map(s => 
          `${s.id},${s.customer_id},${s.product_id},${s.quantity},${s.unit_price},${s.discount_amount},${s.total_amount},${s.created_at}`
        ).join('\n');
        
        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily_sales_${today}.csv`;
        a.click();
      } else {
        alert('PDF export coming soon!');
      }
    } catch (error) {
      alert('Failed to export sales');
    }
  };

  const availableProducts = products.filter(p => p.is_available && p.quantity > 0);
  const quantity = parseInt(form.quantity) || 1;
  const unitPrice = parseFloat(form.unit_price || '0');
  const discount = parseFloat(form.discount_amount || '0');
  const subtotal = unitPrice * quantity;
  const finalPrice = subtotal - discount;
  const costPrice = selectedProduct?.cost_price || 0;
  const profit = finalPrice - (costPrice * quantity);

  // Stock validation
  const stockWarning = selectedProduct && quantity > selectedProduct.quantity;
  const stockRemaining = selectedProduct ? selectedProduct.quantity - quantity : 0;

  // Today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = recentSales.filter(sale => 
    new Date(sale.created_at).toISOString().split('T')[0] === today
  );
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header with Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Sales</h1>
            <p className="text-sm text-gray-600 mt-1">Record direct product sales</p>
          </div>
          {userRole === 'shop_keeper' && (
            <div className="flex gap-2">
              <button
                onClick={() => exportDailySales('excel')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <FontAwesomeIcon icon={faFileExport} />
                <span>Export Today</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards - Horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Today's Sales</p>
                <p className="text-3xl font-bold text-gray-900">{todaySales.length}</p>
                <p className="text-xs text-gray-500 mt-1">Transactions</p>
              </div>
              <div className="text-blue-400 text-3xl">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₵{todayRevenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Total earnings</p>
              </div>
              <div className="text-green-400 text-3xl">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Available Products</p>
                <p className="text-3xl font-bold text-gray-900">{availableProducts.length}</p>
                <p className="text-xs text-gray-500 mt-1">In stock</p>
              </div>
              <div className="text-purple-400 text-3xl">
                <FontAwesomeIcon icon={faBox} />
              </div>
            </div>
          </div>

          <div className="bg-white border border-orange-200 rounded-lg shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-gray-500 mt-1">Registered</p>
              </div>
              <div className="text-orange-400 text-3xl">
                <FontAwesomeIcon icon={faUsers} />
              </div>
            </div>
          </div>
        </div>

        {/* Manager Restriction */}
        {(userRole === 'manager' || userRole === 'ceo') && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>🔒 Manager Restriction:</strong> Only Shopkeepers can record sales. You can view all sales below.
            </p>
          </div>
        )}

        {/* Sales Form + Product Details Sidebar */}
        {(userRole === 'shop_keeper' || userRole === 'admin' || userRole === 'super_admin') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Form - 2/3 width */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">New Sale Transaction</h2>

                {/* Customer Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerType('existing')}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        customerType === 'existing'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('new')}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        customerType === 'new'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('walkin')}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        customerType === 'walkin'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Walk-in
                    </button>
                  </div>
                </div>

                {/* Customer Selection - Existing */}
                {customerType === 'existing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer *</label>
                    <select
                      name="customer_id"
                      value={form.customer_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.phone_number})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Selection - New */}
                {customerType === 'new' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-green-900">Quick Add New Customer</p>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={newCustomerData.full_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, full_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={newCustomerData.phone_number}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={handleCreateQuickCustomer}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add & Select Customer
                    </button>
                  </div>
                )}

                {/* Walk-in Customer */}
                {customerType === 'walkin' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-orange-800 mb-2">
                      <FontAwesomeIcon icon={faInfoCircle} /> Walk-in customer - No customer record will be saved
                    </p>
                    <input
                      type="tel"
                      name="customer_phone"
                      placeholder="Customer Phone Number *"
                      value={form.customer_phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      required
                      minLength={10}
                      maxLength={15}
                    />
                    <input
                      type="email"
                      name="customer_email"
                      placeholder="Customer Email (optional)"
                      value={form.customer_email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                )}

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                  <select
                    name="product_id"
                    value={form.product_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Product --</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.brand ? `- ${p.brand}` : ''} (₵{p.selling_price}) [Stock: {p.quantity}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {stockWarning && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      Exceeds available stock ({selectedProduct.quantity} units)
                    </p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₵) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_price"
                    value={form.unit_price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Discount (₵)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_amount"
                    value={form.discount_amount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Customer Contact (for walk-in) */}
                {customerType === 'walkin' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Phone * <span className="text-blue-600 text-xs">(for SMS receipt)</span>
                      </label>
                      <input
                        type="tel"
                        name="customer_phone"
                        value={form.customer_phone}
                        onChange={handleChange}
                        placeholder="e.g., 0241234567"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Email <span className="text-gray-500 text-xs">(optional)</span>
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        value={form.customer_email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2"
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || stockWarning || availableProducts.length === 0}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Recording...' : 'Record Sale'}
                </button>
              </form>
            </div>

            {/* Live Product Details Sidebar - 1/3 width */}
            <div className="lg:col-span-1">
              {selectedProduct ? (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBox} className="text-blue-500" />
                    Product Details
                  </h3>

                  <div className="space-y-4">
                    {/* Product Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Product</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                      {selectedProduct.brand && (
                        <p className="text-sm text-gray-600">{selectedProduct.brand}</p>
                      )}
                    </div>

                    {/* Price Info */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 mb-1">Selling Price</p>
                      <p className="text-2xl font-bold text-blue-900">₵{selectedProduct.selling_price}</p>
                      {selectedProduct.discount_price && (
                        <p className="text-xs text-blue-600 mt-1">
                          Discount Price: ₵{selectedProduct.discount_price}
                        </p>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className={`rounded-lg p-3 border-2 ${
                      stockWarning 
                        ? 'bg-red-50 border-red-300' 
                        : stockRemaining < 5 
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-700">Current Stock</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedProduct.quantity}</p>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-700">Selling Quantity</p>
                        <p className="text-xl font-bold text-gray-900">-{quantity}</p>
                      </div>
                      <div className="border-t-2 border-gray-300 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">Remaining After Sale</p>
                          <p className={`text-2xl font-bold ${
                            stockWarning 
                              ? 'text-red-600' 
                              : stockRemaining < 5 
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {stockRemaining}
                          </p>
                        </div>
                      </div>

                      {stockWarning && (
                        <div className="mt-3 bg-red-100 border border-red-300 rounded p-2">
                          <p className="text-xs text-red-800 flex items-center gap-1">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <strong>Error!</strong> Quantity exceeds available stock
                          </p>
                        </div>
                      )}

                      {!stockWarning && stockRemaining < 5 && stockRemaining >= 0 && (
                        <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded p-2">
                          <p className="text-xs text-yellow-800 flex items-center gap-1">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <strong>Warning!</strong> Low stock after this sale
                          </p>
                        </div>
                      )}

                      {!stockWarning && stockRemaining >= 5 && (
                        <div className="mt-3 bg-green-100 border border-green-300 rounded p-2">
                          <p className="text-xs text-green-800 flex items-center gap-1">
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Stock level OK
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sale Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Sale Summary</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold">₵{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span className="font-semibold">-₵{discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="font-bold text-gray-900">Total:</span>
                          <span className="font-bold text-green-600">₵{finalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-gray-600">Profit:</span>
                          <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₵{profit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FontAwesomeIcon icon={faBox} className="text-5xl mb-3" />
                    <p className="text-sm">Select a product to see details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Sales Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Product Sales</h2>
          </div>
          
          {recentSales.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sold By</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.slice(0, 10).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-900">#{sale.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {sale.customer_id ? `Customer #${sale.customer_id}` : 'Walk-in'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">Product #{sale.product_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.quantity}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">₵{sale.total_amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {sale.created_by ? (
                            <span className="font-medium text-blue-700">
                              {sale.created_by.display_name || sale.created_by.full_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {recentSales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-900">Sale #{sale.id}</span>
                      <span className="text-sm font-bold text-green-600">₵{sale.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer:</span>
                        <span className="text-gray-900">{sale.customer_id ? `#${sale.customer_id}` : 'Walk-in'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Product:</span>
                        <span className="text-gray-600">#{sale.product_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quantity:</span>
                        <span className="text-gray-900">{sale.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sold By:</span>
                        <span className="text-blue-700">
                          {sale.created_by ? (sale.created_by.display_name || sale.created_by.full_name) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-600">{new Date(sale.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No product sales recorded yet</p>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && lastSaleReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Sale Recorded!</h2>
              <p className="text-gray-600">Print a receipt for your customer</p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-600">Total Amount:</p>
                <p className="text-2xl font-bold text-gray-900">₵{lastSaleReceipt.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <SaleReceipt 
                saleData={lastSaleReceipt}
                companyName={companyName}
              />
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setLastSaleReceipt(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSales;
