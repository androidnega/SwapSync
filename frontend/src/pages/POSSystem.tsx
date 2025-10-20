/**
 * Point of Sale (POS) System - Multi-Item Sales
 * Allows shop keepers to add multiple items to cart and complete sale
 */
import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart, faPlus, faMinus, faTrash, faCashRegister,
  faUser, faPhone, faEnvelope, faSearch, faTimes, faReceipt,
  faCheck, faMoneyBill, faCreditCard, faMobileAlt, faTags,
  faShoppingBag, faBarcode
} from '@fortawesome/free-solid-svg-icons';
import POSThermalReceipt from '../components/POSThermalReceipt';

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
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
}

interface Customer {
  id: number;
  full_name: string;
  phone_number: string;
  email: string | null;
}

const POSSystem: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Your Shop');
  
  // Receipt modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  
  // Customer selection
  const [customerType, setCustomerType] = useState<'existing' | 'new' | 'walkin'>('walkin');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    full_name: '',
    phone_number: '',
    email: ''
  });
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  
  // UI state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch products
      const productsRes = await axios.get(`${API_URL}/products?in_stock_only=true`, { headers });
      setProducts(productsRes.data.filter((p: Product) => p.is_available && p.quantity > 0));
      
      // Fetch customers
      const customersRes = await axios.get(`${API_URL}/customers`, { headers });
      setCustomers(customersRes.data);
      
      // Get company name
      const userRes = await axios.get(`${API_URL}/auth/me`, { headers });
      setCompanyName(userRes.data.company_name || userRes.data.display_name || 'Your Shop');
    } catch (error: any) {
      console.error('Failed to load data:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to load products';
      setMessage(`❌ ${errorMsg}`);
    }
  };

  // Cart Operations
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Increase quantity if already in cart
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        product,
        quantity: 1,
        unit_price: product.discount_price || product.selling_price,
        discount_amount: 0
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        // Check stock availability
        if (newQuantity > item.product.quantity) {
          setMessage(`❌ Only ${item.product.quantity} units available`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const updateCartItemPrice = (productId: number, newPrice: number) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, unit_price: newPrice } : item
    ));
  };

  const updateCartItemDiscount = (productId: number, newDiscount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, discount_amount: newDiscount } : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setNotes('');
    setPaymentMethod('cash');
    setCustomerType('walkin');
    setSelectedCustomer(null);
    setNewCustomer({ full_name: '', phone_number: '', email: '' });
  };

  // Calculations
  const calculateCartSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = (item.unit_price * item.quantity) - item.discount_amount;
      return sum + itemTotal;
    }, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateCartSubtotal() - overallDiscount);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Complete Sale
  const completeSale = async () => {
    if (cart.length === 0) {
      setMessage('❌ Cart is empty');
      return;
    }

    // Validate customer info
    let customerData = {
      customer_id: null as number | null,
      customer_name: 'Walk-in Customer',
      customer_phone: ''
    };

    if (customerType === 'existing') {
      if (!selectedCustomer) {
        setMessage('❌ Please select a customer');
        return;
      }
      customerData = {
        customer_id: selectedCustomer.id,
        customer_name: selectedCustomer.full_name,
        customer_phone: selectedCustomer.phone_number
      };
    } else if (customerType === 'new') {
      if (!newCustomer.full_name || !newCustomer.phone_number) {
        setMessage('❌ Please enter customer name and phone');
        return;
      }
      customerData = {
        customer_id: null,
        customer_name: newCustomer.full_name,
        customer_phone: newCustomer.phone_number
      };
    } else {
      // Walk-in customer
      const phone = prompt('Enter customer phone number (for SMS receipt):');
      if (!phone) {
        setMessage('❌ Phone number is required');
        return;
      }
      customerData = {
        customer_id: null,
        customer_name: 'Walk-in Customer',
        customer_phone: phone
      };
    }

    setLoading(true);
    try {
      const token = getToken();
      const saleData = {
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name,
        customer_phone: customerData.customer_phone,
        customer_email: customerType === 'new' ? newCustomer.email : selectedCustomer?.email || null,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount
        })),
        overall_discount: overallDiscount,
        payment_method: paymentMethod,
        notes: notes
      };

      const response = await axios.post(`${API_URL}/pos-sales/`, saleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('✅ Sale completed successfully!');
      setLastSale(response.data);
      setShowReceipt(true);
      clearCart();
      loadData(); // Reload products to update stock
    } catch (error: any) {
      console.error('Failed to complete sale:', error);
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to complete sale'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FontAwesomeIcon icon={faCashRegister} className="text-green-600" />
              POS System
            </h1>
            <p className="text-gray-600 mt-1">Point of Sale - Multi-Item Transactions</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">₵{calculateTotal().toFixed(2)}</p>
            <p className="text-sm text-gray-600">{cart.length} items | {getTotalItems()} units</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section (Left) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} />
                Products
              </h2>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border rounded-lg p-3 hover:shadow-lg transition cursor-pointer hover:border-blue-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        ₵{(product.discount_price || product.selling_price).toFixed(2)}
                      </p>
                      {product.discount_price && (
                        <p className="text-xs text-gray-400 line-through">
                          ₵{product.selling_price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Stock: {product.quantity}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="w-full mt-2 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 transition"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add to Cart
                  </button>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FontAwesomeIcon icon={faShoppingBag} className="text-4xl mb-2" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout Section (Right) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faShoppingCart} />
              Cart ({cart.length})
            </h2>

            {/* Cart Items */}
            <div className="max-h-[300px] overflow-y-auto mb-4 border-t border-b py-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FontAwesomeIcon icon={faShoppingCart} className="text-3xl mb-2" />
                  <p>Cart is empty</p>
                  <p className="text-xs mt-1">Add items to get started</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="mb-3 pb-3 border-b last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.product.name}</p>
                        {item.product.brand && (
                          <p className="text-xs text-gray-500">{item.product.brand}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateCartItemQuantity(item.product.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border rounded py-1"
                        min="1"
                        max={item.product.quantity}
                      />
                      <button
                        onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600">Price:</span>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateCartItemPrice(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm border rounded px-2 py-1"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Discount */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600">Discount:</span>
                      <input
                        type="number"
                        value={item.discount_amount}
                        onChange={(e) => updateCartItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm border rounded px-2 py-1"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Item Total */}
                    <div className="text-right font-bold text-green-600">
                      ₵{((item.unit_price * item.quantity) - item.discount_amount).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                {/* Totals */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₵{calculateCartSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Overall Discount:</span>
                    <input
                      type="number"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 text-sm border rounded px-2 py-1 text-right"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                    <span>TOTAL:</span>
                    <span>₵{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded border-2 text-xs ${
                        paymentMethod === 'cash'
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={faMoneyBill} className="mb-1" />
                      <br />Cash
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2 rounded border-2 text-xs ${
                        paymentMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={faCreditCard} className="mb-1" />
                      <br />Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`p-2 rounded border-2 text-xs ${
                        paymentMethod === 'mobile_money'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={faMobileAlt} className="mb-1" />
                      <br />MoMo
                    </button>
                  </div>
                </div>

                {/* Customer Type */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Customer</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => setCustomerType('walkin')}
                      className={`p-2 rounded border text-xs ${
                        customerType === 'walkin'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300'
                      }`}
                    >
                      Walk-in
                    </button>
                    <button
                      onClick={() => setCustomerType('existing')}
                      className={`p-2 rounded border text-xs ${
                        customerType === 'existing'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300'
                      }`}
                    >
                      Existing
                    </button>
                    <button
                      onClick={() => setCustomerType('new')}
                      className={`p-2 rounded border text-xs ${
                        customerType === 'new'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300'
                      }`}
                    >
                      New
                    </button>
                  </div>

                  {customerType === 'existing' && (
                    <select
                      value={selectedCustomer?.id || ''}
                      onChange={(e) => {
                        const customer = customers.find(c => c.id === parseInt(e.target.value));
                        setSelectedCustomer(customer || null);
                      }}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} - {c.phone_number}
                        </option>
                      ))}
                    </select>
                  )}

                  {customerType === 'new' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Customer name"
                        value={newCustomer.full_name}
                        onChange={(e) => setNewCustomer({...newCustomer, full_name: e.target.value})}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={newCustomer.phone_number}
                        onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Add notes..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Clear
                  </button>
                  <button
                    onClick={completeSale}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-bold"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <FontAwesomeIcon icon={faCheck} /> Complete Sale
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <POSThermalReceipt
          transactionId={lastSale.transaction_id}
          customerName={lastSale.customer_name}
          customerPhone={lastSale.customer_phone}
          items={lastSale.items}
          subtotal={lastSale.subtotal}
          overallDiscount={lastSale.overall_discount}
          totalAmount={lastSale.total_amount}
          paymentMethod={lastSale.payment_method}
          createdAt={lastSale.created_at}
          companyName={companyName}
          onClose={() => setShowReceipt(false)}
          onResendSMS={async () => {
            try {
              const token = getToken();
              await axios.post(
                `${API_URL}/pos-sales/${lastSale.id}/resend-receipt`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setMessage('✅ Receipt SMS sent successfully!');
            } catch (error) {
              setMessage('❌ Failed to send SMS');
            }
          }}
        />
      )}
    </div>
  );
};

export default POSSystem;

