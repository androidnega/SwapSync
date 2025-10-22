import React, { useState, useEffect } from 'react';
import { brandAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faMobileAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

const PhoneBrands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getAll();
      setBrands(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage('❌ Brand name is required');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      if (editingId) {
        // Update existing brand
        await brandAPI.update(editingId, {
          name: name.trim(),
          description: description.trim() || undefined
        });
        setMessage('✅ Brand updated successfully!');
      } else {
        // Create new brand
        await brandAPI.create({
          name: name.trim(),
          description: description.trim() || undefined
        });
        setMessage('✅ Brand created successfully!');
      }

      // Reset form
      setName('');
      setDescription('');
      setEditingId(null);
      setShowForm(false);
      fetchBrands();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to save brand'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleEdit = (brand: Brand) => {
    setName(brand.name);
    setDescription(brand.description || '');
    setEditingId(brand.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      await brandAPI.delete(id);
      setMessage('✅ Brand deleted successfully!');
      fetchBrands();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to delete brand'}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phone Brands</h1>
            <p className="text-gray-600 mt-1">
              Manage phone brands (Samsung, iPhone, Tecno, etc.) for better organization
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Brand
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Brand' : 'Add New Brand'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Samsung, Apple (iPhone), Tecno, Huawei"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: Samsung, Apple (iPhone), Tecno, Huawei, Infinix, Nokia, Xiaomi, Oppo
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this brand..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCheck} />
                  {editingId ? 'Update Brand' : 'Create Brand'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brands List */}
        <div className="bg-white rounded-lg shadow">
          {brands.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faMobileAlt} className="text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No brands yet</p>
              <p className="text-gray-400 text-sm">Add your first brand to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Brand Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(() => {
                      const totalPages = Math.ceil(brands.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const paginatedBrands = brands.slice(startIndex, startIndex + itemsPerPage);
                      
                      return paginatedBrands.map((brand) => (
                        <tr key={brand.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                                <FontAwesomeIcon icon={faMobileAlt} />
                              </div>
                              <span className="font-semibold text-gray-900">{brand.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">
                              {brand.description || 'No description'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(brand.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(brand)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDelete(brand.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {(() => {
                const totalPages = Math.ceil(brands.length / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
                return (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                          {' '}to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, brands.length)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{brands.length}</span>
                          {' '}results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneBrands;

