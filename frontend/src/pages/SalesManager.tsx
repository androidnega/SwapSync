/**
 * Sales Management Page
 * Record direct sale transactions (no trade-in)
 */
import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import { saleAPI, customerAPI, phoneAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import PhoneSelectionModal from '../components/PhoneSelectionModal';

interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
}

interface Phone {
  id: number;
  brand: string;
  model: string;
  condition: string;
  value: number;
  is_available: boolean;
}

interface Sale {
  id: number;
  customer_id: number;
  phone_id: number;
  amount_paid: number;
  created_at: string;
  created_by?: {
    id: number;
    full_name: string;
    display_name?: string;
  };
}

const SalesManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  
  const [form, setForm] = useState({
    customer_id: '',
    phone_id: '',
    original_price: '',
    discount_amount: '0',
    customer_phone: '',
    customer_email: '',
  });

  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);

  useEffect(() => {
    loadData();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = getToken();
      const response = await axios.get('${API_URL}/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  useEffect(() => {
    // Update selected phone when phone_id changes
    const phone = phones.find(p => p.id === parseInt(form.phone_id));
    setSelectedPhone(phone || null);
    
    // Auto-fill amount_paid with phone value
    if (phone && !form.amount_paid) {
      setForm(prev => ({ ...prev, amount_paid: phone.value.toString() }));
    }
  }, [form.phone_id, phones]);

  const loadData = async () => {
    try {
      const [customersRes, phonesRes, salesRes] = await Promise.all([
        customerAPI.getAll(),
        phoneAPI.getAll(true), // Only available phones
        saleAPI.getAll(),
      ]);

      setCustomers(customersRes.data);
      setPhones(phonesRes.data);
      setRecentSales(salesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneSelect = (phone: any) => {
    setForm({ ...form, phone_id: phone.id.toString(), original_price: phone.value.toString() });
    setSelectedPhone(phone);
    setShowPhoneModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        phone_id: parseInt(form.phone_id),
        original_price: parseFloat(form.original_price),
        discount_amount: parseFloat(form.discount_amount) || 0,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
      };

      await saleAPI.create(payload);
      
      alert('✅ Sale recorded successfully!');
      
      // Reset form
      setForm({
        customer_id: '',
        phone_id: '',
        original_price: '',
        discount_amount: '0',
        customer_phone: '',
        customer_email: '',
      });
      setSelectedPhone(null);

      // Reload data
      loadData();
    } catch (error: any) {
      alert(`❌ Failed to record sale: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const availablePhones = phones.filter(p => p.is_available);
  const originalPrice = parseFloat(form.original_price || '0');
  const discount = parseFloat(form.discount_amount || '0');
  const finalPrice = originalPrice - discount;
  const profit = selectedPhone ? finalPrice - selectedPhone.value : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600 mt-1">Record direct phone sales (no trade-in)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Form */}
          <div className="lg:col-span-2">
            {/* Manager Restriction Message */}
            {(userRole === 'manager' || userRole === 'ceo') && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔒 Manager Restriction</h3>
                <p className="text-yellow-800 mb-3">
                  Managers cannot directly record sales. Only <strong>Shopkeepers</strong> can record sales transactions.
                </p>
                <p className="text-yellow-700 text-sm">
                  💡 You can view all sales below, but sales must be recorded by your shopkeepers.
                </p>
              </div>
            )}

            {/* Form for Shopkeepers/Admins ONLY */}
            {(userRole === 'shop_keeper' || userRole === 'admin' || userRole === 'super_admin') && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">💰 New Sale Transaction</h2>

                {/* Customer Selection */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer</label>
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone to Sell
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    name="phone_id"
                    value={form.phone_id}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                    required
                  >
                    <option value="">Select Phone</option>
                    {availablePhones.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.brand} {p.model} - {p.condition} (₵{p.value})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(true)}
                    className="px-4 py-2.5 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap font-medium text-base md:text-sm"
                  >
                    📱 Browse Phones
                  </button>
                </div>
                {selectedPhone && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedPhone.brand} {selectedPhone.model} - GH₵{selectedPhone.value}
                  </p>
                )}
              </div>

              {/* Original Price and Discount - Grid on Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Original Price (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_price"
                    value={form.original_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                    required
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Discount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_amount"
                    value={form.discount_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional discount</p>
                </div>
              </div>

              {/* Customer Contact - Grid on Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Phone (Required for SMS Receipt) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone * <span className="text-blue-600 text-xs">(SMS)</span>
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={handleChange}
                    placeholder="0241234567"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                    required
                    minLength={10}
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">SMS receipt</p>
                </div>

                {/* Customer Email (Optional for Email Receipt) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={form.customer_email}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email receipt</p>
                </div>
              </div>

              {/* Sale Summary */}
              {selectedPhone && form.original_price && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-base md:text-lg">
                    💰 Sale Summary
                  </h3>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex justify-between">
                      <span className="text-green-700">Phone:</span>
                      <span className="font-medium">{selectedPhone.brand} {selectedPhone.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Phone Cost:</span>
                      <span className="font-medium">GH₵{selectedPhone.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Original Price:</span>
                      <span className="font-medium">GH₵{originalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span className="font-medium">- GH₵{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-300 pt-2">
                      <span className="text-green-900 font-semibold">Final Price:</span>
                      <span className="font-bold">GH₵{finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-300 pt-2">
                      <span className={profit >= 0 ? 'text-green-900 font-semibold' : 'text-red-700 font-semibold'}>
                        {profit >= 0 ? 'Profit:' : 'Loss:'}
                      </span>
                      <span className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        GH₵{Math.abs(profit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || availablePhones.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 md:py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg text-base md:text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recording...
                  </>
                ) : (
                  <>
                    ✅ Record Sale
                  </>
                )}
              </button>

              {availablePhones.length === 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-center">
                  <p className="text-red-600 text-sm font-medium">⚠️ No available phones in inventory!</p>
                </div>
              )}
            </form>
          )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">📱 Available Phones</h3>
              <p className="text-2xl md:text-3xl font-bold text-green-600 mb-1 md:mb-2">{availablePhones.length}</p>
              <p className="text-xs md:text-sm text-gray-600">In stock</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">💵 Total Sales</h3>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-1 md:mb-2">{recentSales.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Direct sales</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">👥 Customers</h3>
              <p className="text-2xl md:text-3xl font-bold text-purple-600 mb-1 md:mb-2">{customers.length}</p>
              <p className="text-xs md:text-sm text-gray-600">Registered</p>
            </div>
          </div>
        </div>

        {/* Recent Sales Table */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">📋 Recent Sales</h2>
          {recentSales.length > 0 ? (
            <>
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.slice(0, 10).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-900">#{sale.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">Customer #{sale.customer_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Phone #{sale.phone_id}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">GH₵{sale.amount_paid.toFixed(2)}</td>
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

              {/* Mobile Card View - Shown on Mobile */}
              <div className="md:hidden space-y-3">
                {recentSales.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-900">Sale #{sale.id}</span>
                      <span className="text-sm font-bold text-green-600">₵{sale.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer:</span>
                        <span className="text-gray-900">#{sale.customer_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-600">#{sale.phone_id}</span>
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
            <p className="text-gray-500 text-center py-8">No sales recorded yet</p>
          )}
        </div>
      </div>

      {/* Phone Selection Modal */}
      <PhoneSelectionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSelect={handlePhoneSelect}
        title="Select Phone for Sale"
      />
    </div>
  );
};

export default SalesManager;

