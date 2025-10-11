import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilter, faSync } from '@fortawesome/free-solid-svg-icons';

interface Transaction {
  id: number;
  transaction_type: string;
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  phone_received: {
    name: string;
    condition: string;
    cost: number;
  };
  exchanged_phone: any;
  original_price: number;
  cash_added: number;
  discount: number;
  final_price: number;
  profit: number | null;
  status: string;
  invoice_number: string;
  created_at: string;
  is_swap: boolean;
}

interface StaffMember {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canViewProfit, setCanViewProfit] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    transaction_type: '',
    staff_id: ''
  });

  useEffect(() => {
    fetchReports();
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/staff/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaffList(response.data);
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.staff_id) params.append('staff_id', filters.staff_id);
      
      const response = await axios.get(
        `${API_URL}/reports/sales-swaps?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTransactions(response.data.transactions);
      setCanViewProfit(response.data.user_can_view_profit);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch reports');
      setLoading(false);
    }
  };

  const handleExportCSV = async (reportType: string) => {
    try {
      const token = getToken();
      const params = new URLSearchParams({ report_type: reportType });
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await axios.get(
        `${API_URL}/reports/export/csv?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Create download link
      const blob = new Blob([response.data.content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export CSV: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      
      const response = await axios.get(
        `${API_URL}/reports/export/pdf?${params.toString()}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export PDF: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold text-lg mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalSales = transactions.filter(t => !t.is_swap).length;
  const totalSwaps = transactions.filter(t => t.is_swap).length;
  const totalDiscounts = transactions.reduce((sum, t) => sum + t.discount, 0);
  const totalRevenue = transactions.reduce((sum, t) => sum + t.final_price, 0);
  const totalProfit = canViewProfit 
    ? transactions.reduce((sum, t) => sum + (t.profit || 0), 0) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Sales, swaps, and transaction reports</p>
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faSync} className="mr-2" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Total Sales</div>
            <div className="text-3xl font-bold text-green-600">{totalSales}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Total Swaps</div>
            <div className="text-3xl font-bold text-blue-600">{totalSwaps}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Total Discounts</div>
            <div className="text-3xl font-bold text-purple-600">₵{totalDiscounts.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-indigo-600">₵{totalRevenue.toFixed(2)}</div>
          </div>
          
          {canViewProfit && totalProfit !== null && (
            <div className="bg-white p-6 rounded-xl shadow md:col-span-2">
              <div className="text-sm text-gray-500 mb-1">Total Profit (CEO/Admin Only)</div>
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₵{totalProfit.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faFilter} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={filters.transaction_type}
                onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="sale">Sales Only</option>
                <option value="swap">Swaps Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Staff
              </label>
              <select
                value={filters.staff_id}
                onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Staff</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchReports}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => handleExportCSV('sales_swaps')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Sales/Swaps CSV
            </button>
            
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Sales/Swaps PDF
            </button>
            
            <button
              onClick={() => handleExportCSV('pending_resales')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Pending Resales CSV
            </button>
            
            <button
              onClick={() => handleExportCSV('repairs')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export Repairs CSV
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Transaction Report ({transactions.length})</h2>
          </div>
          
          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exchanged</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Final</th>
                  {canViewProfit && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={`${tx.transaction_type}-${tx.id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">#{tx.id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.is_swap ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{tx.customer.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.phone_received.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {tx.exchanged_phone ? tx.exchanged_phone.description : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₵{tx.cash_added.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {tx.discount > 0 ? `-₵${tx.discount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      ₵{tx.final_price.toFixed(2)}
                    </td>
                    {canViewProfit && (
                      <td className={`px-4 py-3 text-sm text-right font-bold ${
                        tx.profit === null ? 'text-gray-400' :
                        tx.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.profit !== null ? `₵${tx.profit.toFixed(2)}` : 'Pending'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'Completed' || tx.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={canViewProfit ? 11 : 10} className="px-4 py-12 text-center text-gray-500">
                      No transactions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown on Mobile */}
          <div className="md:hidden p-4 space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No transactions found for the selected filters.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={`${tx.transaction_type}-${tx.id}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">#{tx.id}</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.is_swap ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tx.status === 'Completed' || tx.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer:</span>
                      <span className="text-gray-900">{tx.customer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-600">{tx.phone_received.name}</span>
                    </div>
                    {tx.exchanged_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Exchanged:</span>
                        <span className="text-gray-600">{tx.exchanged_phone.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cash Added:</span>
                      <span className="font-medium text-gray-900">₵{tx.cash_added.toFixed(2)}</span>
                    </div>
                    {tx.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount:</span>
                        <span className="text-red-600">-₵{tx.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Final Price:</span>
                      <span className="text-gray-900">₵{tx.final_price.toFixed(2)}</span>
                    </div>
                    {canViewProfit && tx.profit !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Profit:</span>
                        <span className={`font-bold ${tx.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₵{tx.profit.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="text-gray-600">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

