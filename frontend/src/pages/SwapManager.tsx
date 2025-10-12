/**
 * Swap Management Page
 * Record swap transactions and view swap history
 */
import { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import { swapAPI, customerAPI, phoneAPI } from '../services/api';
import PhoneSelectionModal from '../components/PhoneSelectionModal';
import SwapReceipt from '../components/SwapReceipt';
import axios from 'axios';

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

interface Swap {
  id: number;
  customer_id: number;
  given_phone_description: string;
  given_phone_value: number;
  new_phone_id: number;
  balance_paid: number;
  total_transaction_value: number;
  created_at: string;
}

const SwapManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSwapReceipt, setLastSwapReceipt] = useState<any>(null);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [companyName, setCompanyName] = useState<string>('SwapSync Shop');
  const [userRole, setUserRole] = useState<string>('');
  
  const [form, setForm] = useState({
    customer_id: '',
    given_phone_description: '',
    given_phone_value: '',
    given_phone_imei: '',
    given_phone_color: '',
    given_phone_storage: '',
    given_phone_ram: '',
    given_phone_condition: 'Used',
    new_phone_id: '',
    balance_paid: '',
    discount_amount: '0',
  });

  const [calculatedValues, setCalculatedValues] = useState({
    totalValue: 0,
    newPhonePrice: 0,
    difference: 0,
    phoneCostPrice: 0,
    immediateProfit: 0,
  });

  useEffect(() => {
    loadData();
    fetchCompanyName();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setCompanyName(response.data.company_name || 'SwapSync Shop');
      setUserRole(response.data.role || '');
    } catch (error) {
      console.error('Failed to fetch company name:', error);
    }
  };

  const isManager = userRole === 'manager' || userRole === 'ceo';

  useEffect(() => {
    // Calculate values when form changes
    const givenValue = parseFloat(form.given_phone_value) || 0;
    const balancePaid = parseFloat(form.balance_paid) || 0;
    const discount = parseFloat(form.discount_amount) || 0;
    const selectedPhone = phones.find(p => p.id === parseInt(form.new_phone_id));
    const newPhonePrice = selectedPhone?.value || 0;
    const phoneCostPrice = selectedPhone?.cost_price || 0;
    const finalCashPaid = balancePaid - discount;
    const totalValue = givenValue + finalCashPaid;
    const difference = newPhonePrice - totalValue;
    
    // Calculate immediate profit/loss
    // Profit = (Cash received + Trade-in value) - Cost of new phone given
    const cashReceived = finalCashPaid;
    const immediateProfit = (cashReceived + givenValue) - phoneCostPrice;

    setCalculatedValues({
      totalValue,
      newPhonePrice,
      difference,
      phoneCostPrice,
      immediateProfit,
    });
  }, [form.given_phone_value, form.balance_paid, form.discount_amount, form.new_phone_id, phones]);

  const loadData = async () => {
    try {
      const [customersRes, phonesRes, swapsRes] = await Promise.all([
        customerAPI.getAll(),
        phoneAPI.getAll(true), // Only available phones
        swapAPI.getAll(),
      ]);

      setCustomers(customersRes.data);
      setPhones(phonesRes.data);
      setRecentSwaps(swapsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoneSelect = (phone: any) => {
    setForm({ ...form, new_phone_id: phone.id.toString() });
    setShowPhoneModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        given_phone_description: form.given_phone_description,
        given_phone_value: parseFloat(form.given_phone_value),
        given_phone_imei: form.given_phone_imei.trim() || null,
        new_phone_id: parseInt(form.new_phone_id),
        balance_paid: parseFloat(form.balance_paid),
        discount_amount: parseFloat(form.discount_amount) || 0,
      };

      const response = await swapAPI.create(payload);
      
      // Prepare receipt data
      const selectedCustomer = customers.find(c => c.id === parseInt(form.customer_id));
      const selectedPhone = phones.find(p => p.id === parseInt(form.new_phone_id));
      
      const receiptData = {
        id: response.data.id,
        customer_name: selectedCustomer?.full_name || 'Customer',
        customer_phone: selectedCustomer?.phone_number,
        given_phone_description: form.given_phone_description,
        given_phone_value: parseFloat(form.given_phone_value),
        given_phone_imei: form.given_phone_imei,
        new_phone_description: selectedPhone ? `${selectedPhone.brand} ${selectedPhone.model}` : 'New Phone',
        new_phone_value: selectedPhone?.value || 0,
        balance_paid: parseFloat(form.balance_paid),
        discount_amount: parseFloat(form.discount_amount) || 0,
        total_transaction_value: parseFloat(form.given_phone_value) + parseFloat(form.balance_paid),
        created_at: new Date().toISOString(),
        served_by: 'Current User', // TODO: Get from auth
      };
      
      setLastSwapReceipt(receiptData);
      setShowReceiptModal(true);
      
      // Reset form
      setForm({
        customer_id: '',
        given_phone_description: '',
        given_phone_value: '',
        given_phone_imei: '',
        given_phone_color: '',
        given_phone_storage: '',
        given_phone_ram: '',
        given_phone_condition: 'Used',
        new_phone_id: '',
        balance_paid: '',
        discount_amount: '0',
      });

      // Reload data
      loadData();
    } catch (error: any) {
      alert(`❌ Failed to record swap: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const availablePhones = phones.filter(p => p.is_available);
  
  // Filter phones based on search query
  const filteredPhones = availablePhones.filter(phone => {
    const searchLower = phoneSearchQuery.toLowerCase();
    return (
      phone.brand.toLowerCase().includes(searchLower) ||
      phone.model.toLowerCase().includes(searchLower) ||
      phone.condition.toLowerCase().includes(searchLower) ||
      phone.value.toString().includes(searchLower)
    );
  });
  
  const selectedPhone = phones.find(p => p.id === parseInt(form.new_phone_id));

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Swap Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Record phone swap transactions</p>
        </div>

        {/* Stats Cards - At Top */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border-l-4 border-green-500">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Available Phones</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{availablePhones.length}</p>
            <p className="text-xs text-gray-500 mt-1">In stock</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border-l-4 border-purple-500">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Total Swaps</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{recentSwaps.length}</p>
            <p className="text-xs text-gray-500 mt-1">Transactions</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border-l-4 border-blue-500">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Customers</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{customers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Registered</p>
          </div>
        </div>

        {/* Manager Restriction Notice */}
        {isManager && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔒 Manager Restriction</h3>
            <p className="text-yellow-800 mb-3">
              Managers cannot record phone swaps. Only <strong>Repairers</strong> and <strong>Shopkeepers</strong> can create swap transactions.
            </p>
            <p className="text-yellow-700 text-sm">
              💡 You can view phone inventory and access other swap hub features, but swap recording is restricted to operational staff.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Swap Form */}
          {!isManager && (
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">New Swap Transaction</h2>

              {/* Customer Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Customer</label>
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

              {/* Trade-In Phone Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-orange-900 text-sm flex items-center gap-2">
                  📲 Trade-In Phone Details
                </h3>

                {/* Phone Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Phone Description *
                  </label>
                  <input
                    type="text"
                    name="given_phone_description"
                    value={form.given_phone_description}
                    onChange={handleChange}
                    placeholder="e.g., iPhone 11, Samsung Galaxy S21"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Value & Condition Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Trade-In Value (₵) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="given_phone_value"
                      value={form.given_phone_value}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Condition
                    </label>
                    <select
                      name="given_phone_condition"
                      value={form.given_phone_condition}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>

                {/* Optional: IMEI, Color, Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      IMEI (Optional)
                    </label>
                    <input
                      type="text"
                      name="given_phone_imei"
                      value={form.given_phone_imei}
                      onChange={handleChange}
                      placeholder="15-17 digits"
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Color (Optional)
                    </label>
                    <input
                      type="text"
                      name="given_phone_color"
                      value={form.given_phone_color}
                      onChange={handleChange}
                      placeholder="e.g., Black, White"
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Storage (Optional)
                    </label>
                    <input
                      type="text"
                      name="given_phone_storage"
                      value={form.given_phone_storage}
                      onChange={handleChange}
                      placeholder="e.g., 128GB, 256GB"
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      RAM (Optional)
                    </label>
                    <input
                      type="text"
                      name="given_phone_ram"
                      value={form.given_phone_ram}
                      onChange={handleChange}
                      placeholder="e.g., 6GB, 8GB"
                      className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* New Phone Selection with Search */}
              <div className="relative">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  New Phone Customer is Getting *
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search phones by brand, model, or price..."
                    value={phoneSearchQuery}
                    onChange={(e) => {
                      setPhoneSearchQuery(e.target.value);
                      setShowPhoneDropdown(true);
                    }}
                    onFocus={() => setShowPhoneDropdown(true)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>

                {/* Dropdown Results */}
                {showPhoneDropdown && phoneSearchQuery && filteredPhones.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPhones.map((phone) => (
                      <button
                        key={phone.id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, new_phone_id: phone.id.toString() });
                          setPhoneSearchQuery(`${phone.brand} ${phone.model}`);
                          setShowPhoneDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {phone.brand} {phone.model}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{phone.condition}</span>
                          <span className="font-semibold text-green-600">₵{phone.value.toFixed(2)}</span>
                          {phone.specs?.storage && <span>• {phone.specs.storage}</span>}
                          {phone.specs?.color && <span>• {phone.specs.color}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results */}
                {showPhoneDropdown && phoneSearchQuery && filteredPhones.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    No phones found matching "{phoneSearchQuery}"
                  </div>
                )}

                {/* Selected Phone Display */}
                {form.new_phone_id && selectedPhone && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">Selected: </span>
                        <span className="font-semibold text-gray-900">
                          {selectedPhone.brand} {selectedPhone.model}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, new_phone_id: '' });
                          setPhoneSearchQuery('');
                        }}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Browse Button */}
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span>📱</span>
                  <span>Or Browse All Phones</span>
                </button>
              </div>

              {/* Balance Paid and Discount - Grid on Desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Balance Paid */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Additional Cash Paid (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="balance_paid"
                    value={form.balance_paid}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Discount (₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discount_amount"
                    value={form.discount_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg p-2.5 md:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional discount</p>
                </div>
              </div>

              {/* Calculation Summary */}
              {form.new_phone_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900 text-base">Transaction Summary</h3>
                  
                  {/* Customer's Payment Breakdown */}
                  <div className="space-y-1 text-sm">
                    <p className="text-xs font-semibold text-blue-800 uppercase mb-2">Customer Payment</p>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Trade-In Value:</span>
                      <span className="font-medium">₵{parseFloat(form.given_phone_value || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Cash Paid:</span>
                      <span className="font-medium">₵{parseFloat(form.balance_paid || '0').toFixed(2)}</span>
                    </div>
                    {parseFloat(form.discount_amount || '0') > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span className="font-medium">- ₵{parseFloat(form.discount_amount || '0').toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                      <span className="text-blue-900 font-semibold">Final Cash Received:</span>
                      <span className="font-bold">₵{(parseFloat(form.balance_paid || '0') - parseFloat(form.discount_amount || '0')).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Phone Pricing */}
                  <div className="space-y-1 text-sm border-t border-blue-300 pt-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase mb-2">Phone Pricing</p>
                    <div className="flex justify-between">
                      <span className="text-blue-700">New Phone Selling Price:</span>
                      <span className="font-medium">₵{calculatedValues.newPhonePrice.toFixed(2)}</span>
                    </div>
                    {calculatedValues.phoneCostPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Phone Cost Price:</span>
                        <span className="font-medium text-gray-700">₵{calculatedValues.phoneCostPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Customer Paid:</span>
                      <span className="font-bold">₵{calculatedValues.totalValue.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Profit Analysis */}
                  {calculatedValues.phoneCostPrice > 0 && (
                    <div className="space-y-1 text-sm border-t border-blue-300 pt-3 bg-white bg-opacity-50 -mx-4 px-4 py-3 rounded">
                      <p className="text-xs font-semibold text-gray-800 uppercase mb-2">💰 Profit Analysis</p>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Cash + Trade-In Received:</span>
                        <span className="font-medium">₵{calculatedValues.totalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Cost of Phone Given:</span>
                        <span className="font-medium">₵{calculatedValues.phoneCostPrice.toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between border-t border-gray-300 pt-2 mt-2 ${calculatedValues.immediateProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} -mx-4 px-4 py-2 rounded`}>
                        <span className={`font-bold ${calculatedValues.immediateProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {calculatedValues.immediateProfit >= 0 ? '✅ Immediate Profit:' : '⚠️ Current Loss:'}
                        </span>
                        <span className={`font-bold text-lg ${calculatedValues.immediateProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          ₵{Math.abs(calculatedValues.immediateProfit).toFixed(2)}
                        </span>
                      </div>
                      {calculatedValues.immediateProfit < 0 && (
                        <p className="text-xs text-orange-700 bg-orange-50 p-2 rounded mt-2">
                          ℹ️ <strong>Note:</strong> You're currently running a loss. Profit will be recovered when the trade-in phone (₵{parseFloat(form.given_phone_value || '0').toFixed(2)}) is resold.
                        </p>
                      )}
                      {calculatedValues.immediateProfit >= 0 && (
                        <p className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2">
                          ✅ <strong>Good deal!</strong> Plus additional profit when trade-in phone is resold.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || availablePhones.length === 0}
                className="w-full bg-blue-600 text-white px-6 py-3 md:py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-base md:text-sm"
              >
                {loading ? 'Recording...' : 'Record Swap Transaction'}
              </button>

              {availablePhones.length === 0 && (
                <p className="text-red-600 text-sm text-center">⚠️ No available phones in inventory!</p>
              )}
            </form>
          </div>
          )}

          {/* Selected Phone Details */}
          <div>
            {selectedPhone ? (
              <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border-2 border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base flex items-center gap-2">
                  📱 Selected Phone Details
                </h3>
                
                <div className="space-y-4">
                  {/* Phone Name */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-gray-900">{selectedPhone.brand} {selectedPhone.model}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedPhone.condition}</p>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Selling Price:</span>
                        <span className="font-bold text-green-700 text-xl">₵{selectedPhone.value.toFixed(2)}</span>
                      </div>
                      {selectedPhone.cost_price && selectedPhone.cost_price > 0 && (
                        <>
                          <div className="flex justify-between items-center border-t border-green-200 pt-2">
                            <span className="text-xs text-gray-600">Cost Price:</span>
                            <span className="font-medium text-gray-700">₵{selectedPhone.cost_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-100 -mx-3 px-3 py-1.5 rounded">
                            <span className="text-xs font-bold text-blue-900">Profit:</span>
                            <span className="font-bold text-blue-700">
                              +₵{(selectedPhone.value - selectedPhone.cost_price).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  {selectedPhone.specs && Object.keys(selectedPhone.specs).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase mb-3">📋 Specifications</p>
                      <div className="space-y-2">
                        {selectedPhone.specs.storage && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Storage:</span>
                            <span className="font-medium text-gray-900">{selectedPhone.specs.storage}</span>
                          </div>
                        )}
                        {selectedPhone.specs.ram && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">RAM:</span>
                            <span className="font-medium text-gray-900">{selectedPhone.specs.ram}</span>
                          </div>
                        )}
                        {selectedPhone.specs.color && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Color:</span>
                            <span className="font-medium text-gray-900">{selectedPhone.specs.color}</span>
                          </div>
                        )}
                        {selectedPhone.specs.cpu && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Processor:</span>
                            <span className="font-medium text-gray-900">{selectedPhone.specs.cpu}</span>
                          </div>
                        )}
                        {selectedPhone.specs.battery && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Battery:</span>
                            <span className="font-medium text-gray-900">{selectedPhone.specs.battery}</span>
                          </div>
                        )}
                        {selectedPhone.specs.battery_health && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Battery Health:</span>
                            <span className="font-medium text-green-600">{selectedPhone.specs.battery_health}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* IMEI */}
                  {selectedPhone.imei && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">IMEI</p>
                      <p className="text-sm font-mono font-medium text-gray-900">{selectedPhone.imei}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 border-2 border-dashed border-gray-300">
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📱</p>
                  <p className="text-sm text-gray-600">Select a phone to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Swaps Table */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Recent Swap Transactions</h2>
          {recentSwaps.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Given Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Given Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSwaps.slice(0, 10).map((swap) => (
                      <tr key={swap.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-900">#{swap.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">Customer #{swap.customer_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{swap.given_phone_description}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₵{swap.given_phone_value.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₵{swap.balance_paid.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">₵{swap.total_transaction_value.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(swap.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {recentSwaps.slice(0, 10).map((swap) => (
                  <div key={swap.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-gray-900">Swap #{swap.id}</span>
                      <span className="text-sm font-bold text-blue-600">₵{swap.total_transaction_value.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Customer:</span>
                        <span className="text-gray-900">#{swap.customer_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Given Phone:</span>
                        <span className="text-gray-600">{swap.given_phone_description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone Value:</span>
                        <span className="text-gray-900">₵{swap.given_phone_value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Balance Paid:</span>
                        <span className="text-gray-900">₵{swap.balance_paid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-600">{new Date(swap.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No swap transactions yet</p>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && lastSwapReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-purple-600 mb-2">Swap Recorded!</h2>
              <p className="text-gray-600">Print a receipt for your customer</p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-gray-600">Balance Paid:</p>
                <p className="text-2xl font-bold text-gray-900">₵{lastSwapReceipt.balance_paid.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <SwapReceipt 
                swapData={lastSwapReceipt}
                companyName={companyName}
              />
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setLastSwapReceipt(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Selection Modal */}
      <PhoneSelectionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSelect={handlePhoneSelect}
        title="Select New Phone for Swap"
      />
    </div>
  );
};

export default SwapManager;

