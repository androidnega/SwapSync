import React, { useState, useEffect } from 'react';
import { API_URL, productAPI, categoryAPI, authAPI, bulkUploadAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';

interface Product {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_id: number;
  brand: string | null;
  cost_price: number;
  selling_price: number;
  discount_price: number | null;
  quantity: number;
  min_stock_level: number;
  description: string | null;
  specs: any;
  is_active: boolean;
  is_available: boolean;
  profit_margin: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  created_at: string;
  // Phone-specific fields
  imei?: string | null;
  is_phone?: boolean;
  is_swappable?: boolean;
  phone_condition?: string | null;
  phone_specs?: any;
  phone_status?: string | null;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface ProductSummary {
  total_products: number;
  total_value: number;
  total_selling_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  by_category: Record<string, number>;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand: '',
    cost_price: '',
    selling_price: '',
    discount_price: '',
    quantity: '0',
    min_stock_level: '5',
    description: '',
    // Phone-specific fields
    imei: '',
    is_phone: false,
    is_swappable: false,
    phone_condition: '',
    phone_specs: {
      cpu: '',
      ram: '',
      storage: '',
      battery: '',
      color: ''
    }
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: '',
    notes: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Check if selected category is a phone category (case-insensitive, plural-friendly)
  const isPhoneCategory = (categoryId: string) => {
    if (!categoryId) return false;
    const category = categories.find(cat => cat.id.toString() === categoryId);
    const categoryName = category?.name?.toLowerCase() || '';
    return categoryName.includes('phone') || 
           categoryName.includes('mobile') ||
           categoryName.includes('smartphone');
  };

  // Detect brand type (case-insensitive, plural-friendly)
  const getBrandType = (brandName: string): 'iphone' | 'samsung' | 'google' | 'xiaomi' | 'oppo' | 'huawei' | 'other' => {
    if (!brandName) return 'other';
    const brand = brandName.toLowerCase().trim().replace(/s$/, ''); // Remove trailing 's' for plurals
    
    if (brand.includes('apple') || brand.includes('iphone')) return 'iphone';
    if (brand.includes('samsung')) return 'samsung';
    if (brand.includes('google') || brand.includes('pixel')) return 'google';
    if (brand.includes('xiaomi') || brand.includes('redmi') || brand.includes('poco')) return 'xiaomi';
    if (brand.includes('oppo') || brand.includes('realme')) return 'oppo';
    if (brand.includes('huawei')) return 'huawei';
    
    return 'other';
  };

  // Get category type for other products (case-insensitive, plural-friendly)
  const getCategoryType = (categoryId: string): 'phone' | 'charger' | 'battery' | 'case' | 'earbuds' | 'cable' | 'other' => {
    if (!categoryId) return 'other';
    const category = categories.find(cat => cat.id.toString() === categoryId);
    const categoryName = category?.name?.toLowerCase().replace(/s$/, '') || '';
    
    if (categoryName.includes('phone') || categoryName.includes('mobile')) return 'phone';
    if (categoryName.includes('charger') || categoryName.includes('adapter')) return 'charger';
    if (categoryName.includes('battery') || categoryName.includes('power bank')) return 'battery';
    if (categoryName.includes('case') || categoryName.includes('cover')) return 'case';
    if (categoryName.includes('earbud') || categoryName.includes('earphone') || categoryName.includes('headphone') || categoryName.includes('airpod')) return 'earbuds';
    if (categoryName.includes('cable') || categoryName.includes('cord')) return 'cable';
    
    return 'other';
  };

  // Predefined phone brands
  const phoneBrands = [
    'Apple', 'iPhone', 'Samsung', 'Google', 'Pixel',
    'Xiaomi', 'Redmi', 'Poco', 'Oppo', 'Realme',
    'OnePlus', 'Huawei', 'Honor', 'Vivo', 'Tecno',
    'Infinix', 'Nokia', 'Motorola', 'Sony', 'Asus',
    'LG', 'HTC', 'BlackBerry', 'Nothing'
  ];

  // Predefined options for phone specifications
  const phoneColors = [
    'Black', 'White', 'Silver', 'Gold', 'Rose Gold', 'Space Gray', 'Midnight',
    'Starlight', 'Blue', 'Pacific Blue', 'Sierra Blue', 'Sky Blue', 'Navy Blue',
    'Red', 'Product Red', 'Pink', 'Purple', 'Deep Purple', 'Green', 'Alpine Green',
    'Midnight Green', 'Graphite', 'Titanium', 'Natural Titanium', 'Blue Titanium',
    'Phantom Black', 'Phantom Silver', 'Phantom White', 'Phantom Gray', 'Phantom Violet',
    'Coral', 'Yellow', 'Orange', 'Bronze', 'Copper'
  ];

  const storageOptions = [
    '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'
  ];

  const ramOptions = [
    '2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '18GB'
  ];

  // Brand-specific processor options
  const getProcessorOptions = (brandType: string): string[] => {
    switch (brandType) {
      case 'iphone':
        return [
          'A18 Pro', 'A18', 'A17 Pro', 'A16 Bionic', 'A15 Bionic', 'A14 Bionic',
          'A13 Bionic', 'A12 Bionic', 'A11 Bionic', 'A10 Fusion'
        ];
      case 'samsung':
        return [
          'Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 8 Gen 1',
          'Snapdragon 888', 'Snapdragon 865', 'Snapdragon 855',
          'Exynos 2400', 'Exynos 2200', 'Exynos 2100', 'Exynos 990'
        ];
      case 'google':
        return [
          'Google Tensor G4', 'Google Tensor G3', 'Google Tensor G2', 'Google Tensor',
          'Snapdragon 765G', 'Snapdragon 730'
        ];
      case 'xiaomi':
        return [
          'Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 888',
          'Snapdragon 870', 'Snapdragon 865', 'Snapdragon 778G',
          'MediaTek Dimensity 9200', 'MediaTek Dimensity 8200'
        ];
      case 'oppo':
        return [
          'Snapdragon 8 Gen 2', 'Snapdragon 888', 'Snapdragon 870',
          'MediaTek Dimensity 9000', 'MediaTek Dimensity 8100'
        ];
      case 'huawei':
        return [
          'Kirin 9000', 'Kirin 990', 'Kirin 980', 'Kirin 970',
          'Snapdragon 888', 'Snapdragon 778G'
        ];
      default:
        return [
          'Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 888',
          'Snapdragon 778G', 'Snapdragon 750G', 'Snapdragon 730G',
          'MediaTek Dimensity 9200', 'MediaTek Dimensity 8200',
          'MediaTek Helio G99', 'MediaTek Helio G96'
        ];
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUserRole();
    fetchSummary();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await authAPI.me();
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ in_stock_only: false, limit: 500 });
      console.log('📦 Fetched products:', response.data);
      console.log('📊 Total products:', response.data?.length || 0);
      setProducts(response.data);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
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

  const fetchSummary = async () => {
    try {
      const response = await productAPI.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate phone-specific fields if it's a phone product
      const isPhone = isPhoneCategory(formData.category_id);
      console.log('🔍 Phone validation:', { 
        categoryId: formData.category_id, 
        isPhone, 
        imei: formData.imei, 
        phone_condition: formData.phone_condition,
        is_swappable: formData.is_swappable 
      });
      
      if (isPhone) {
        if (!formData.imei || formData.imei.trim() === '') {
          setMessage('❌ IMEI is required for phone products');
          setLoading(false);
          return;
        }
        if (!formData.phone_condition || formData.phone_condition.trim() === '') {
          setMessage('❌ Phone condition is required for phone products');
          setLoading(false);
          return;
        }
        // Only validate essential specs: RAM, Storage, Color (CPU is optional now)
        if (!formData.phone_specs.ram || !formData.phone_specs.storage || !formData.phone_specs.color) {
          setMessage('❌ Please fill in: RAM, Storage, and Color');
          setLoading(false);
          return;
        }
      }

      const productData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        quantity: parseInt(formData.quantity),
        min_stock_level: parseInt(formData.min_stock_level),
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        brand: formData.brand || null,
        description: formData.description || null,
        // Phone-specific fields
        imei: isPhone ? formData.imei : null,
        is_phone: isPhone,
        is_swappable: formData.is_swappable,
        phone_condition: isPhone ? formData.phone_condition : null,
        phone_specs: isPhone ? formData.phone_specs : null
      };

      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, productData, {
          headers: { Authorization: `Bearer ${getToken()}` },
          timeout: 120000 // 120 second timeout for slow networks
        });
        setMessage('✅ Product updated successfully!');
      } else {
        // Use phone endpoint for phone products, regular endpoint for others
        const endpoint = isPhoneCategory(formData.category_id) ? '/products/phone' : '/products/';
        console.log('🚀 Submitting to:', `${API_URL}${endpoint}`);
        console.log('📦 Payload:', productData);
        
        const response = await axios.post(`${API_URL}${endpoint}`, productData, {
          headers: { Authorization: `Bearer ${getToken()}` },
          timeout: 120000 // 120 second timeout for slow networks
        });
        
        console.log('✅ Response:', response.data);
        setMessage('✅ Product created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      console.error('❌ Product submission error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error code:', error.code);
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        setMessage('⚠️ Request timeout. Product may have been created. Refreshing list...');
        // Close modal and refresh - product might have been created before timeout
        setShowModal(false);
        resetForm();
        fetchProducts();
        fetchSummary();
      }
      // Handle network errors
      else if (error.message === 'Network Error') {
        setMessage('❌ Network error. Please check your internet connection.');
      }
      // Handle validation errors
      else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map((err: any) => {
          const field = err.loc?.join(' > ') || 'unknown field';
          return `${field}: ${err.msg}`;
        }).join(', ');
        setMessage(`❌ Validation Error: ${errorMessages}`);
      }
      // Handle other errors
      else {
        setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await axios.post(
        `${API_URL}/products/${selectedProduct.id}/adjust-stock`,
        {
          quantity: parseInt(stockAdjustment.quantity),
          notes: stockAdjustment.notes
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      setMessage('✅ Stock adjusted successfully!');
      setShowStockModal(false);
      setStockAdjustment({ quantity: '', notes: '' });
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const openNewModal = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id ? product.category_id.toString() : '',
      brand: product.brand || '',
      cost_price: product.cost_price ? product.cost_price.toString() : '',
      selling_price: product.selling_price ? product.selling_price.toString() : '',
      discount_price: product.discount_price?.toString() || '',
      quantity: product.quantity ? product.quantity.toString() : '0',
      min_stock_level: product.min_stock_level ? product.min_stock_level.toString() : '5',
      description: product.description || '',
      // Phone-specific fields
      imei: product.imei || '',
      is_phone: product.is_phone || false,
      is_swappable: product.is_swappable || false,
      phone_condition: product.phone_condition || '',
      phone_specs: product.phone_specs || {
        cpu: '',
        ram: '',
        storage: '',
        battery: '',
        color: ''
      }
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const openStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment({ quantity: '', notes: '' });
    setShowStockModal(true);
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await axios.post(`${API_URL}/bulk-upload/products`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      if (result.success) {
        setMessage(`✅ Successfully uploaded ${result.added} product(s)! ${result.errors > 0 ? `(${result.errors} errors)` : ''}`);
        setShowBulkUpload(false);
        setUploadFile(null);
        fetchProducts();
      }
    } catch (error: any) {
      setMessage(`❌ Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category_id: '',
      brand: '',
      cost_price: '',
      selling_price: '',
      discount_price: '',
      quantity: '0',
      min_stock_level: '5',
      description: '',
      // Phone-specific fields
      imei: '',
      is_phone: false,
      is_swappable: false,
      phone_condition: '',
      phone_specs: {
        cpu: '',
        ram: '',
        storage: '',
        battery: '',
        color: ''
      }
    });
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;

    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setMessage('✅ Product deactivated successfully!');
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      setMessage('❌ Please select products to delete');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await productAPI.bulkDelete(selectedProducts);
      setMessage(`✅ ${response.data.message}`);
      setSelectedProducts([]);
      setShowBulkDeleteConfirm(false);
      fetchProducts();
      fetchSummary();
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to delete products: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const filteredProducts = products.filter(product => {
    // Category filter
    if (filterCategory !== 'all' && product.category_id !== parseInt(filterCategory)) {
      return false;
    }

    // Stock filter
    if (filterStock === 'low' && !product.is_low_stock) return false;
    if (filterStock === 'out' && !product.is_out_of_stock) return false;
    if (filterStock === 'in' && product.quantity === 0) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Debug logging
  console.log('🔍 Filter Debug:');
  console.log('  - Total products:', products.length);
  console.log('  - Filtered products:', filteredProducts.length);
  console.log('  - Filter category:', filterCategory);
  console.log('  - Filter stock:', filterStock);
  console.log('  - Search query:', searchQuery);

  const getCategoryName = (id: number) => {
    const category = categories.find(c => c.id === id);
    return category?.name || 'Unknown';
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterStock, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products & Inventory</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all your products (phones, accessories, etc.)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(userRole === 'shop_keeper') && (
              <button
                onClick={() => {
                  // Navigate to POS system for sales
                  window.location.href = '/pos';
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <span>🛒</span>
                <span>Open POS System</span>
              </button>
            )}
            {(userRole === 'manager' || userRole === 'ceo') && (
              <>
                <button
                  onClick={openNewModal}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm sm:text-base"
                >
                  + Add Product
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm sm:text-base"
                >
                  📤 Bulk Upload
                </button>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm sm:text-base"
                  >
                    🗑️ Delete Selected ({selectedProducts.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Manager Restriction for Shopkeepers */}
        {(userRole === 'shop_keeper') && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">ℹ️ Shopkeeper Access</h3>
            <p className="text-sm sm:text-base text-blue-800">
              You can <strong>view all products</strong> and manage inventory. Use the <strong>POS System</strong> for all sales transactions. Only <strong>Managers</strong> can add or edit products.
            </p>
          </div>
        )}

        {/* Summary Cards - Fixed Responsive Grid */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{summary.total_products}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">In Stock</p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600">{summary.total_products - summary.low_stock_count - summary.out_of_stock_count}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Low Stock</p>
              <p className="text-xl sm:text-2xl font-semibold text-yellow-600">{summary.low_stock_count}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Out of Stock</p>
              <p className="text-xl sm:text-2xl font-semibold text-red-600">{summary.out_of_stock_count}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-600 mb-1">Total Value</p>
              <p className="text-xl sm:text-2xl font-semibold text-blue-600">₵{summary.total_value.toFixed(0)}</p>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Status</label>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Products</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Products Desktop Table - Hidden on Mobile */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {(userRole === 'manager' || userRole === 'ceo') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={(userRole === 'manager' || userRole === 'ceo') ? 7 : 6} className="px-3 md:px-4 lg:px-6 py-12 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={(userRole === 'manager' || userRole === 'ceo') ? 7 : 6} className="px-3 md:px-4 lg:px-6 py-12 text-center text-gray-500">
                      No products found. Click "Add Product" to create one!
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {(userRole === 'manager' || userRole === 'ceo') && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        {product.brand && <div className="text-xs text-gray-500">{product.brand}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getCategoryName(product.category_id)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">₵{product.selling_price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Profit: +{product.profit_margin.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{product.quantity}</span>
                          {product.is_out_of_stock && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Out</span>
                          )}
                          {product.is_low_stock && !product.is_out_of_stock && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">Low</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Stock - Manager only (can affect changes) */}
                          {(userRole === 'manager' || userRole === 'ceo') && (
                            <button
                              onClick={() => openStockModal(product)}
                              className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              Stock
                            </button>
                          )}
                          {/* Edit - Shopkeeper can view, Manager can edit */}
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={userRole === 'shop_keeper' ? 'View product details' : 'Edit product'}
                          >
                            {userRole === 'shop_keeper' ? 'View' : 'Edit'}
                          </button>
                          {/* Delete - Manager only */}
                          {(userRole === 'manager' || userRole === 'ceo') && (
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View - Shown on Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              No products found. Click "Add Product" to create one!
            </div>
          ) : (
            paginatedProducts.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
                    {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900">{getCategoryName(product.category_id)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Selling Price:</span>
                    <span className="font-medium text-gray-900">₵{product.selling_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cost Price:</span>
                    <span className="text-gray-600">₵{product.cost_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Margin:</span>
                    <span className="text-green-600 font-medium">+{product.profit_margin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{product.quantity}</span>
                      {product.is_out_of_stock && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Out of Stock</span>
                      )}
                      {product.is_low_stock && !product.is_out_of_stock && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Low</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  {/* Stock - Manager only */}
                  {(userRole === 'manager' || userRole === 'ceo') && (
                    <button
                      onClick={() => openStockModal(product)}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                    >
                      Stock
                    </button>
                  )}
                  {/* Edit/View - All roles */}
                  <button
                    onClick={() => openEditModal(product)}
                    className={`${(userRole === 'manager' || userRole === 'ceo') ? 'flex-1' : 'flex-[2]'} px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium`}
                  >
                    {userRole === 'shop_keeper' ? 'View' : 'Edit'}
                  </button>
                  {/* Delete - Manager only */}
                  {(userRole === 'manager' || userRole === 'ceo') && (
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {paginatedProducts.length} of {filteredProducts.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-4xl my-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
                {userRole === 'shop_keeper' ? 'View Product Details' : (editingId ? 'Edit Product' : 'Add New Product')}
              </h2>
              {userRole === 'shop_keeper' && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">👁️ View-only mode - Contact your manager to make changes</p>
                </div>
              )}
              {/* Validation Error Message - Inside Modal */}
              {message && message.startsWith('❌') && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                  <p className="text-sm text-red-800 font-medium">{message}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand - Smart dropdown for phones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                      {isPhoneCategory(formData.category_id) && (
                        <span className="ml-2 text-xs text-blue-600">
                          📱 Select from popular phone brands or type your own
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      list={isPhoneCategory(formData.category_id) ? "phone-brands" : undefined}
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={isPhoneCategory(formData.category_id) ? "e.g., Apple, Samsung, Google" : "e.g., Anker, Belkin, JBL"}
                      disabled={userRole === 'shop_keeper'}
                    />
                    {isPhoneCategory(formData.category_id) && (
                      <datalist id="phone-brands">
                        {phoneBrands.map((brand, idx) => (
                          <option key={idx} value={brand} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="e.g., APL-IPHN-13PRO"
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="Scan or enter barcode"
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₵) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₵) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Discount Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₵)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="Optional promotional price"
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                      min="0"
                    />
                  </div>

                  {/* Min Stock Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level *</label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                      disabled={userRole === 'shop_keeper'}
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      rows={3}
                      placeholder="Product description and details"
                      disabled={userRole === 'shop_keeper'}
                    />
                  </div>

                  {/* Available for Swap - Show only for phone categories */}
                  {(userRole === 'manager' || userRole === 'ceo') && isPhoneCategory(formData.category_id) && (
                    <div className="col-span-2 border-t border-gray-200 pt-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={formData.is_swappable}
                          onChange={(e) => setFormData({ ...formData, is_swappable: e.target.checked })}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={userRole === 'shop_keeper'}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Available for Swap</span>
                          <p className="text-xs text-gray-500 mt-1">
                            Make this phone available for swap on sales screens. Swaps follow swapping hub lifecycle (pending, accepted, completed).
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Phone-specific fields - only show when phone category is selected */}
                {isPhoneCategory(formData.category_id) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      📱 Phone Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* IMEI */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IMEI Number *</label>
                        <input
                          type="text"
                          value={formData.imei}
                          onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          placeholder="Enter 15-digit IMEI"
                          required={isPhoneCategory(formData.category_id)}
                          disabled={userRole === 'shop_keeper'}
                        />
                      </div>

                      {/* Phone Condition */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Condition *</label>
                        <select
                          value={formData.phone_condition}
                          onChange={(e) => setFormData({ ...formData, phone_condition: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                          required={isPhoneCategory(formData.category_id)}
                          disabled={userRole === 'shop_keeper'}
                        >
                          <option value="">-- Select Condition --</option>
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                          <option value="Refurbished">Refurbished</option>
                        </select>
                      </div>

                      {/* Is Swappable - Already shown above for all products, no need to duplicate for phones */}

                      {/* Phone Specifications - Dynamic based on brand */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span>Phone Specifications</span>
                          {formData.brand && (
                            <span className="text-xs text-white bg-blue-600 px-2 py-1 rounded">
                              {getBrandType(formData.brand) === 'iphone' ? '🍎 iPhone' : 
                               getBrandType(formData.brand) === 'samsung' ? '📱 Samsung' : 
                               getBrandType(formData.brand) === 'google' ? '🔍 Google Pixel' :
                               getBrandType(formData.brand) === 'xiaomi' ? '📲 Xiaomi' :
                               getBrandType(formData.brand).charAt(0).toUpperCase() + getBrandType(formData.brand).slice(1)}
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* CPU/Processor - Brand-specific suggestions */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              CPU/Processor <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                              type="text"
                              list="processor-options"
                              value={formData.phone_specs.cpu}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                phone_specs: { ...formData.phone_specs, cpu: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Select or type processor"
                              disabled={userRole === 'shop_keeper'}
                            />
                            <datalist id="processor-options">
                              {getProcessorOptions(getBrandType(formData.brand)).map((proc, idx) => (
                                <option key={idx} value={proc} />
                              ))}
                            </datalist>
                          </div>
                          
                          {/* RAM - With suggestions */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">RAM *</label>
                            <input
                              type="text"
                              list="ram-options"
                              value={formData.phone_specs.ram}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                phone_specs: { ...formData.phone_specs, ram: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Select or type RAM"
                              disabled={userRole === 'shop_keeper'}
                            />
                            <datalist id="ram-options">
                              {ramOptions.map((ram, idx) => (
                                <option key={idx} value={ram} />
                              ))}
                            </datalist>
                          </div>
                          
                          {/* Storage - With suggestions */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Storage *</label>
                            <input
                              type="text"
                              list="storage-options"
                              value={formData.phone_specs.storage}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                phone_specs: { ...formData.phone_specs, storage: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Select or type storage"
                              disabled={userRole === 'shop_keeper'}
                            />
                            <datalist id="storage-options">
                              {storageOptions.map((storage, idx) => (
                                <option key={idx} value={storage} />
                              ))}
                            </datalist>
                          </div>
                          
                          {/* Battery */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Battery <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.phone_specs.battery}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                phone_specs: { ...formData.phone_specs, battery: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 4000mAh, 85% health"
                              disabled={userRole === 'shop_keeper'}
                            />
                          </div>
                          
                          {/* Color - With suggestions */}
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Color *</label>
                            <input
                              type="text"
                              list="color-options"
                              value={formData.phone_specs.color}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                phone_specs: { ...formData.phone_specs, color: e.target.value }
                              })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Select or type color"
                              disabled={userRole === 'shop_keeper'}
                            />
                            <datalist id="color-options">
                              {phoneColors.map((color, idx) => (
                                <option key={idx} value={color} />
                              ))}
                            </datalist>
                            <p className="text-xs text-gray-500 mt-1">💡 Select from list or type your own color</p>
                          </div>
                          
                          {/* Brand-Specific Fields */}
                          {getBrandType(formData.brand) === 'iphone' && (
                            <>
                              {/* iOS Version */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">iOS Version</label>
                                <input
                                  type="text"
                                  value={formData.phone_specs.ios_version || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, ios_version: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., iOS 17, iOS 16"
                                  disabled={userRole === 'shop_keeper'}
                                />
                              </div>
                              
                              {/* Biometric */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Biometric</label>
                                <input
                                  type="text"
                                  list="iphone-biometric"
                                  value={formData.phone_specs.biometric || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, biometric: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Face ID or Touch ID"
                                  disabled={userRole === 'shop_keeper'}
                                />
                                <datalist id="iphone-biometric">
                                  <option value="Face ID" />
                                  <option value="Touch ID" />
                                  <option value="Face ID + Touch ID" />
                                </datalist>
                              </div>
                            </>
                          )}
                          
                          {getBrandType(formData.brand) === 'samsung' && (
                            <>
                              {/* One UI Version */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">One UI / Android</label>
                                <input
                                  type="text"
                                  value={formData.phone_specs.android_version || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, android_version: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., One UI 6, Android 14"
                                  disabled={userRole === 'shop_keeper'}
                                />
                              </div>
                              
                              {/* S Pen Support */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">S Pen Support</label>
                                <select
                                  value={formData.phone_specs.s_pen || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, s_pen: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={userRole === 'shop_keeper'}
                                >
                                  <option value="">Not Specified</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </>
                          )}
                          
                          {getBrandType(formData.brand) === 'google' && (
                            <>
                              {/* Android Version */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Android Version</label>
                                <input
                                  type="text"
                                  value={formData.phone_specs.android_version || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, android_version: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., Android 15, Android 14"
                                  disabled={userRole === 'shop_keeper'}
                                />
                              </div>
                              
                              {/* Pixel Features */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Pixel Features</label>
                                <input
                                  type="text"
                                  value={formData.phone_specs.pixel_features || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, pixel_features: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., Call Screening, Magic Eraser"
                                  disabled={userRole === 'shop_keeper'}
                                />
                              </div>
                            </>
                          )}
                          
                          {(getBrandType(formData.brand) === 'xiaomi' || 
                            getBrandType(formData.brand) === 'oppo' || 
                            getBrandType(formData.brand) === 'other') && 
                           formData.brand && (
                            <>
                              {/* Android Version for other brands */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Android Version</label>
                                <input
                                  type="text"
                                  value={formData.phone_specs.android_version || ''}
                                  onChange={(e) => setFormData({ 
                                    ...formData, 
                                    phone_specs: { ...formData.phone_specs, android_version: e.target.value }
                                  })}
                                  className="w-full border border-gray-300 rounded-lg p-2 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., MIUI 15, ColorOS 14, Android 14"
                                  disabled={userRole === 'shop_keeper'}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {userRole === 'shop_keeper' ? 'Close' : 'Cancel'}
                  </button>
                  {userRole !== 'shop_keeper' && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? 'Saving...' : (editingId ? 'Update Product' : 'Create Product')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Adjustment Modal */}
        {showStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowStockModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Adjust Stock: {selectedProduct.name}
              </h2>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock:</p>
                <p className="text-3xl font-bold text-gray-900">{selectedProduct.quantity}</p>
              </div>
              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Quantity *
                  </label>
                  <input
                    type="number"
                    value={stockAdjustment.quantity}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    placeholder="Positive to add, negative to remove"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter positive number to add stock, negative to remove
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={stockAdjustment.notes}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2"
                    rows={3}
                    placeholder="Reason for adjustment (optional)"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Adjust Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBulkUpload(false)}>
            <div className="bg-white rounded-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Bulk Upload Products</h2>
                <p className="text-sm text-gray-600 mt-1">Upload multiple products at once using an Excel file</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Download Template */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📥 Step 1: Download Template</h3>
                  <p className="text-sm text-blue-800 mb-3">Download the Excel template, fill in your product data, then upload it here.</p>
                  <button
                    onClick={async () => {
                      try {
                        const token = getToken();
                        const response = await axios.get(bulkUploadAPI.getProductTemplate(), {
                          headers: { 'Authorization': `Bearer ${token}` },
                          responseType: 'blob'
                        });
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'products_template.xlsx');
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
                    <p className="text-yellow-800 mt-2">Uploading products...</p>
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
                  {uploading ? 'Uploading...' : 'Upload Products'}
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
                Are you sure you want to delete {selectedProducts.length} selected products? 
                This action cannot be undone and will also delete all related sales records.
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
                  Delete {selectedProducts.length} Products
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

