/**
 * Point of Sale (POS) System - Multi-Item Sales
 * Allows shop keepers to add multiple items to cart and complete sale
 */
import React, { useState, useEffect, useMemo } from 'react';
import { API_URL, productAPI, customerAPI, authAPI, posSaleAPI, categoryAPI, brandAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart, faPlus, faMinus, faTrash, faCashRegister,
  faUser, faPhone, faEnvelope, faSearch, faTimes, faReceipt,
  faCheck, faMoneyBill, faCreditCard, faMobileAlt, faTags,
  faShoppingBag, faBarcode, faFilter, faSort, faChevronLeft, faChevronRight,
  faCalculator, faHistory, faPrint, faPaperPlane, faEye, faEdit
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
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
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

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Brand {
  id: number;
  name: string;
}

const POSSystem: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('Your Shop');
  
  // Filter and pagination state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
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
  
  // Stats for dashboard
  const [todayStats, setTodayStats] = useState({
    totalItemsInStock: 0,
    soldToday: 0,
    amountRecorded: 0
  });

  useEffect(() => {
    loadData();
    loadTodayStats();
  }, []);

  const loadTodayStats = async () => {
    try {
      // Get today's POS sales summary
      const summaryRes = await posSaleAPI.getSummary();
      const summary = summaryRes.data;
      
      // Calculate total items in stock
      const totalItemsInStock = products.reduce((sum, product) => sum + product.quantity, 0);
      
      // Get today's sales (filter by today)
      const today = new Date().toDateString();
      const todaySales = summary.total_transactions; // This will be filtered by the API
      
      setTodayStats({
        totalItemsInStock,
        soldToday: summary.total_items_sold,
        amountRecorded: summary.total_revenue
      });
    } catch (error) {
      console.error('Failed to load today stats:', error);
    }
  };

  const loadData = async () => {
    try {
      // Fetch products using the productAPI service with proper configuration
      const productsRes = await productAPI.getAll({ in_stock_only: true });
      setProducts(productsRes.data.filter((p: Product) => p.is_available && p.quantity > 0));
      
      // Fetch customers using the customerAPI service
      const customersRes = await customerAPI.getAll();
      setCustomers(customersRes.data);
      
      // Fetch categories
      const categoriesRes = await categoryAPI.getAll();
      setCategories(categoriesRes.data);
      
      // Fetch brands
      const brandsRes = await brandAPI.getAll();
      setBrands(brandsRes.data);
      
      // Get company name using the authAPI service
      const userRes = await authAPI.me();
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

  // Get available stock for a product (considering items in cart)
  const getAvailableStock = (product: Product) => {
    const cartItem = cart.find(item => item.product.id === product.id);
    if (cartItem) {
      return product.quantity - cartItem.quantity;
    }
    return product.quantity;
  };

  // Check if product is low stock
  const isLowStock = (product: Product) => {
    const availableStock = getAvailableStock(product);
    return availableStock <= 5; // Low stock threshold
  };

  // Check if product is out of stock
  const isOutOfStock = (product: Product) => {
    const availableStock = getAvailableStock(product);
    return availableStock <= 0;
  };

  // Get stock color class
  const getStockColorClass = (product: Product) => {
    const availableStock = getAvailableStock(product);
    if (availableStock <= 0) {
      return 'bg-red-100 text-red-800 border-red-200'; // Out of stock
    } else if (availableStock <= 5) {
      return 'bg-orange-100 text-orange-800 border-orange-200'; // Low stock
    } else {
      return 'bg-gray-100 text-gray-600 border-gray-200'; // Normal stock
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
    // Prevent multiple submissions
    if (loading) {
      return;
    }

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
      // Validate phone number (must be 10-15 characters)
      const cleanPhone = newCustomer.phone_number.replace(/\s+/g, ''); // Remove spaces
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        setMessage('❌ Phone number must be between 10-15 digits');
        return;
      }
      customerData = {
        customer_id: null,
        customer_name: newCustomer.full_name,
        customer_phone: cleanPhone
      };
    } else {
      // Walk-in customer
      const phone = prompt('Enter customer phone number (for SMS receipt):');
      if (!phone) {
        setMessage('❌ Phone number is required');
        return;
      }
      // Validate phone number (must be 10-15 characters)
      const cleanPhone = phone.replace(/\s+/g, ''); // Remove spaces
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        setMessage('❌ Phone number must be between 10-15 digits');
        return;
      }
      customerData = {
        customer_id: null,
        customer_name: 'Walk-in Customer',
        customer_phone: cleanPhone
      };
    }

    // Validate cart items
    if (cart.length === 0) {
      setMessage('❌ Cart is empty. Please add items to cart');
      return;
    }

    // Validate each cart item
    for (const item of cart) {
      if (item.quantity <= 0) {
        setMessage(`❌ Invalid quantity for ${item.product.name}`);
        return;
      }
      if (item.unit_price <= 0) {
        setMessage(`❌ Invalid price for ${item.product.name}`);
        return;
      }
      if (item.discount_amount < 0) {
        setMessage(`❌ Invalid discount for ${item.product.name}`);
        return;
      }
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
          discount_amount: item.discount_amount || 0 // Ensure default 0 if undefined
        })),
        overall_discount: overallDiscount || 0, // Ensure default 0 if undefined
        payment_method: paymentMethod,
        notes: notes || null // Ensure null if empty
      };

      const response = await posSaleAPI.create(saleData);

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

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(p => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
      
      // Brand filter
      const matchesBrand = selectedBrand === null || p.brand === brands.find(b => b.id === selectedBrand)?.name;
      
      return matchesSearch && matchesCategory && matchesBrand;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.discount_price || a.selling_price;
          bValue = b.discount_price || b.selling_price;
          break;
        case 'stock':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy, sortOrder, brands]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, sortBy, sortOrder]);

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

      {/* Today's Stats Dashboard */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Items in Stock</p>
              <p className="text-2xl font-bold text-blue-800">{todayStats.totalItemsInStock}</p>
            </div>
            <FontAwesomeIcon icon={faShoppingBag} className="text-blue-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Sold Today</p>
              <p className="text-2xl font-bold text-green-800">{todayStats.soldToday}</p>
            </div>
            <FontAwesomeIcon icon={faShoppingCart} className="text-green-500 text-2xl" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Amount Recorded</p>
              <p className="text-2xl font-bold text-purple-800">₵{todayStats.amountRecorded.toFixed(2)}</p>
            </div>
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-500 text-2xl" />
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faShoppingBag} />
                Products ({filteredAndSortedProducts.length})
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="mb-4 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-3 text-gray-400"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedBrand || ''}
                    onChange={(e) => setSelectedBrand(e.target.value ? parseInt(e.target.value) : null)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faSort} className="text-gray-500" />
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy as 'name' | 'price' | 'stock');
                      setSortOrder(newSortOrder as 'asc' | 'desc');
                    }}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="price-asc">Price Low-High</option>
                    <option value="price-desc">Price High-Low</option>
                    <option value="stock-desc">Stock High-Low</option>
                    <option value="stock-asc">Stock Low-High</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedCategory || selectedBrand || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedBrand(null);
                      setSearchTerm('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {paginatedProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FontAwesomeIcon icon={faShoppingBag} className="text-4xl mb-2" />
                    <p>No products found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {paginatedProducts.map(product => (
                      <div
                        key={product.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {product.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  {product.brand && (
                                    <span className="font-medium">{product.brand}</span>
                                  )}
                                  {product.category && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                      {product.category.name}
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded-full text-xs border ${getStockColorClass(product)}`}>
                                    Stock: {getAvailableStock(product)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Price and Actions */}
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                ₵{(product.discount_price || product.selling_price).toFixed(2)}
                              </p>
                              {product.discount_price && (
                                <p className="text-xs text-gray-400 line-through">
                                  ₵{product.selling_price.toFixed(2)}
                                </p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => addToCart(product)}
                              disabled={isOutOfStock(product)}
                              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                                isOutOfStock(product)
                                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                              {isOutOfStock(product) ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart & Checkout Section (Right) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
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
              await posSaleAPI.resendReceipt(lastSale.id);
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

