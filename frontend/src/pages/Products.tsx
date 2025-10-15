import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
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
    description: ''
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: '',
    notes: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUserRole();
    fetchSummary();
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

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { in_stock_only: false, limit: 500 }
      });
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
      const response = await axios.get(`${API_URL}/categories/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
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
        imei: formData.imei || null
      };

      if (editingId) {
        await axios.put(`${API_URL}/products/${editingId}`, productData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setMessage('✅ Product updated successfully!');
      } else {
        await axios.post(`${API_URL}/products/`, productData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setMessage('✅ Product created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchSummary();
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
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
      description: product.description || ''
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
      description: ''
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
                  // Navigate to sales tab
                  const event = new CustomEvent('switchTab', { detail: 'sales' });
                  window.dispatchEvent(event);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
              >
                <span>💰</span>
                <span>Record Sales</span>
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
              </>
            )}
          </div>
        </div>

        {/* Manager Restriction for Shopkeepers */}
        {(userRole === 'shop_keeper') && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">ℹ️ Shopkeeper Access</h3>
            <p className="text-sm sm:text-base text-blue-800">
              You can <strong>view all products</strong> and use them in sales. Only <strong>Managers</strong> can add or edit products.
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
                    <td colSpan={6} className="px-3 md:px-4 lg:px-6 py-12 text-center text-gray-500">
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 md:px-4 lg:px-6 py-12 text-center text-gray-500">
                      No products found. Click "Add Product" to create one!
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-4xl my-8" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
                {userRole === 'shop_keeper' ? 'View Product Details' : (editingId ? 'Edit Product' : 'Add New Product')}
              </h2>
              {userRole === 'shop_keeper' && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">👁️ View-only mode - Contact your manager to make changes</p>
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

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Apple, Samsung, Anker"
                      disabled={userRole === 'shop_keeper'}
                    />
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
                </div>

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
                  <a
                    href="${API_URL}/bulk-upload/products/template"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  >
                    📄 Download Template
                  </a>
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
      </div>
    </div>
  );
};

export default Products;

