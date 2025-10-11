import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import SaleReceipt from '../components/SaleReceipt';

import { API_URL } from '../services/api';

interface ProductSale {
  id: number;
  product_id: number;
  product_name?: string;
  product_brand?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_amount: number;
  profit: number;
  customer_phone?: string;
  customer_email?: string;
  created_at: string;
  created_by_user_id?: number;
}

type ViewType = 'daily' | 'weekly' | 'monthly';

const SoldItems: React.FC = () => {
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [companyName, setCompanyName] = useState<string>('SwapSync Shop');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchSales();
    fetchCompanyName();
  }, [viewType, selectedDate]);

  const fetchCompanyName = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyName(response.data.company_name || 'SwapSync Shop');
      setUserRole(response.data.role || '');
    } catch (error) {
      console.error('Failed to fetch company name:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_URL}/product-sales/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSales(response.data);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sales based on view type
  const getFilteredSales = () => {
    const selected = new Date(selectedDate);
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      
      if (viewType === 'daily') {
        return saleDate.toDateString() === selected.toDateString();
      } else if (viewType === 'weekly') {
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - selected.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return saleDate >= weekStart && saleDate <= weekEnd;
      } else { // monthly
        return saleDate.getMonth() === selected.getMonth() && 
               saleDate.getFullYear() === selected.getFullYear();
      }
    });
  };

  const filteredSales = getFilteredSales();

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when view type or date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewType, selectedDate]);

  // Calculate stats
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalDiscounts = filteredSales.reduce((sum, sale) => sum + sale.discount_amount, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  // Group sales by date for calendar view
  const getSalesByDate = () => {
    const salesByDate: { [key: string]: number } = {};
    sales.forEach(sale => {
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      salesByDate[date] = (salesByDate[date] || 0) + 1;
    });
    return salesByDate;
  };

  const salesByDate = getSalesByDate();

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const selected = new Date(selectedDate);
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const calendarDays = viewType === 'monthly' ? generateCalendarDays() : [];

  const formatDateRange = () => {
    const selected = new Date(selectedDate);
    
    if (viewType === 'daily') {
      return selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (viewType === 'weekly') {
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return selected.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (filteredSales.length === 0) return;

    const dateRange = formatDateRange();
    const filename = `Sales_${viewType}_${selectedDate.replace(/-/g, '')}`;

    if (format === 'excel') {
      // Export as CSV (Excel compatible)
      const headers = ['Date & Time', 'Product', 'Brand', 'Quantity', 'Unit Price', 'Discount', 'Total'];
      const rows = filteredSales.map(sale => [
        new Date(sale.created_at).toLocaleString('en-GB'),
        sale.product_name || `Product #${sale.product_id}`,
        sale.product_brand || '-',
        sale.quantity.toString(),
        `₵${sale.unit_price.toFixed(2)}`,
        sale.discount_amount > 0 ? `-₵${sale.discount_amount.toFixed(2)}` : '-',
        `₵${sale.total_amount.toFixed(2)}`
      ]);

      // Add summary rows
      rows.push([]);
      rows.push(['Summary', '', '', '', '', '', '']);
      rows.push(['Total Sales:', filteredSales.length.toString(), '', '', '', '', '']);
      rows.push(['Total Items:', totalItems.toString(), '', '', '', '', '']);
      rows.push(['Total Revenue:', '', '', '', '', '', `₵${totalRevenue.toFixed(2)}`]);
      rows.push(['Total Discounts:', '', '', '', '', '', `₵${totalDiscounts.toFixed(2)}`]);

      const csvContent = [
        ['Sales Report', '', '', '', '', '', ''],
        ['Period:', dateRange, '', '', '', '', ''],
        ['Generated:', new Date().toLocaleString('en-GB'), '', '', '', '', ''],
        [],
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // Export as PDF (simple HTML to print)
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            .info { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
            .summary-row { display: flex; justify-between; margin: 5px 0; }
            .summary-label { font-weight: bold; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>📊 Sales Report</h1>
          <div class="info">
            <p><strong>Period:</strong> ${dateRange}</p>
            <p><strong>View:</strong> ${viewType.charAt(0).toUpperCase() + viewType.slice(1)}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString('en-GB')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${new Date(sale.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    ${sale.product_name || `Product #${sale.product_id}`}
                    ${sale.product_brand ? `<br><small style="color: #666;">${sale.product_brand}</small>` : ''}
                  </td>
                  <td>${sale.quantity}</td>
                  <td>₵${sale.unit_price.toFixed(2)}</td>
                  <td>${sale.discount_amount > 0 ? `-₵${sale.discount_amount.toFixed(2)}` : '-'}</td>
                  <td><strong>₵${sale.total_amount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Summary</h3>
            <div class="summary-row">
              <span class="summary-label">Total Sales:</span>
              <span>${filteredSales.length}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Items Sold:</span>
              <span>${totalItems}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Revenue:</span>
              <span><strong>₵${totalRevenue.toFixed(2)}</strong></span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total Discounts:</span>
              <span>₵${totalDiscounts.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Net Revenue:</span>
              <span><strong style="color: green;">₵${(totalRevenue).toFixed(2)}</strong></span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Sold Items</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View sales by day, week, or month
          </p>
        </div>

        {/* View Type Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType('daily')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewType === 'daily'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewType('weekly')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewType === 'weekly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewType('monthly')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewType === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Showing: <span className="font-semibold text-gray-900">{formatDateRange()}</span>
            </p>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={filteredSales.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <span>📊</span>
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={filteredSales.length === 0}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <span>📄</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive with no overflow */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${userRole === 'manager' || userRole === 'ceo' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border border-gray-200 min-w-0">
            <p className="text-xs text-gray-600 mb-1 truncate">Total Sales</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{filteredSales.length}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border border-gray-200 min-w-0">
            <p className="text-xs text-gray-600 mb-1 truncate">Items Sold</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{totalItems}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border border-gray-200 min-w-0">
            <p className="text-xs text-gray-600 mb-1 truncate">Total Revenue</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">₵{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border border-gray-200 min-w-0">
            <p className="text-xs text-gray-600 mb-1 truncate">Discounts Given</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">₵{totalDiscounts.toFixed(2)}</p>
          </div>
          {/* Profit Card - Manager Only */}
          {(userRole === 'manager' || userRole === 'ceo') && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 md:p-5 border border-green-200 min-w-0">
              <p className="text-xs text-green-700 mb-1 font-medium truncate">Total Profit</p>
              <p className={`text-xl sm:text-2xl md:text-3xl font-bold truncate ${totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ₵{totalProfit.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1 truncate">
                {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '0% margin'}
              </p>
            </div>
          )}
        </div>

        {/* Calendar Button (only for monthly) */}
        {viewType === 'monthly' && (
          <button
            onClick={() => setShowCalendarModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📅</span>
            <span>View Sales Calendar</span>
          </button>
        )}

        {/* Calendar Modal */}
        {showCalendarModal && viewType === 'monthly' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCalendarModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-gray-900 text-xl sm:text-2xl">📅 Sales Calendar</h3>
                  <p className="text-sm text-gray-600 mt-1">{formatDateRange()}</p>
                </div>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
                
                const dateStr = date.toISOString().split('T')[0];
                const count = salesByDate[dateStr] || 0;
                const isSelected = dateStr === selectedDate;
                const isToday = new Date().toDateString() === date.toDateString();
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setViewType('daily');
                      setShowCalendarModal(false);
                    }}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all hover:scale-105 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : count > 0
                        ? 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                        : isToday
                        ? 'bg-gray-100 text-gray-900 font-semibold border border-gray-300'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`${count > 0 ? 'font-semibold' : ''}`}>{date.getDate()}</div>
                    {count > 0 && (
                      <div className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-green-600'}`}>
                        {count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-green-50 border border-green-200"></div>
                    <span className="text-gray-600">Has Sales</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-blue-600"></div>
                    <span className="text-gray-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Sales Details</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No sales found for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(sale.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">{sale.product_name || `Product #${sale.product_id}`}</div>
                        {sale.product_brand && <div className="text-xs text-gray-500">{sale.product_brand}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">₵{sale.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {sale.discount_amount > 0 ? `-₵${sale.discount_amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">₵{sale.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <SaleReceipt
                          saleData={{
                            id: sale.id,
                            product_name: sale.product_name || `Product #${sale.product_id}`,
                            product_brand: sale.product_brand,
                            quantity: sale.quantity,
                            unit_price: sale.unit_price,
                            discount_amount: sale.discount_amount,
                            total_amount: sale.total_amount,
                            customer_phone: sale.customer_phone,
                            customer_email: sale.customer_email,
                            created_at: sale.created_at,
                          }}
                          companyName={companyName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • Showing {paginatedSales.length} of {filteredSales.length} sales
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoldItems;

