/**
 * POS Transactions - Shop Keeper's view of their own transactions
 * Shows sales history and analytics WITHOUT profit information
 */
import React, { useState, useEffect } from 'react';
import { API_URL, posSaleAPI, authAPI } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt, faShoppingCart, faTachometerAlt, faUsers,
  faMoneyBillWave, faCreditCard, faMobileAlt, faMoneyBill,
  faCalendar, faSearch, faFileInvoice, faDownload, faFilePdf,
  faFileCsv, faFileAlt, faChartBar, faFilter
} from '@fortawesome/free-solid-svg-icons';
import POSThermalReceipt from '../components/POSThermalReceipt';

interface POSSale {
  id: number;
  transaction_id: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  overall_discount: number;
  total_amount: number;
  payment_method: string;
  items_count: number;
  total_quantity: number;
  created_at: string;
  items: Array<{
    product_name: string;
    product_brand: string | null;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    subtotal: number;
  }>;
}

interface POSSummary {
  total_transactions: number;
  total_revenue: number;
  total_items_sold: number;
  average_transaction_value: number;
  sales_by_payment_method: { [key: string]: number };
  top_selling_products: Array<{ product: string; quantity: number }>;
}

const POSTransactions: React.FC = () => {
  const [sales, setSales] = useState<POSSale[]>([]);
  const [summary, setSummary] = useState<POSSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<POSSale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [companyName, setCompanyName] = useState('Your Shop');
  const [message, setMessage] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');
  
  // Filters
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Report filters
  const [reportType, setReportType] = useState<'daily' | 'range' | 'month' | 'year'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<POSSale[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch POS sales using posSaleAPI service
      const salesRes = await posSaleAPI.getAll({ limit: 500 });
      setSales(salesRes.data);
      
      // Fetch summary for ALL TIME (to show payment methods and top products from all sales)
      // But the frontend will filter to show today's stats separately
      const summaryRes = await posSaleAPI.getSummary();
      setSummary(summaryRes.data);
      
      // Get company name using authAPI service
      const userRes = await authAPI.me();
      setCompanyName(userRes.data.company_name || userRes.data.display_name || 'Your Shop');
    } catch (error: any) {
      console.error('Failed to load POS data:', error);
      setMessage('❌ Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = (sale: POSSale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let start_date = '';
      let end_date = '';

      switch (reportType) {
        case 'daily':
          start_date = reportDate;
          end_date = reportDate;
          break;
        case 'range':
          start_date = startDate;
          end_date = endDate;
          break;
        case 'month':
          const [year, month] = reportMonth.split('-');
          start_date = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          end_date = `${year}-${month}-${lastDay}`;
          break;
        case 'year':
          start_date = `${reportYear}-01-01`;
          end_date = `${reportYear}-12-31`;
          break;
      }

      const salesRes = await posSaleAPI.getAll({ 
        limit: 5000,
        start_date,
        end_date
      });
      setReportData(salesRes.data);
      setMessage(`✅ Report generated: ${salesRes.data.length} transactions found`);
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      setMessage('❌ Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const reportStats = calculateReportStats();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #eff6ff; color: #1e40af; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f0f9ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; }
          .stat-label { font-size: 12px; color: #1e40af; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${companyName} - Sales Report</h1>
        <p><strong>Report Type:</strong> ${reportType.toUpperCase()}</p>
        <p><strong>Period:</strong> ${getReportPeriodLabel()}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <h2>Summary</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value">${reportStats.totalTransactions}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">₵${reportStats.totalRevenue.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Items Sold</div>
            <div class="stat-value">${reportStats.totalItems}</div>
          </div>
        </div>

        <h2>Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(sale => `
              <tr>
                <td>${formatDate(sale.created_at)}</td>
                <td>${sale.transaction_id}</td>
                <td>${sale.customer_name}</td>
                <td>${sale.items_count} items (${sale.total_quantity} units)</td>
                <td>${sale.payment_method.toUpperCase()}</td>
                <td>₵${sale.total_amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Item Details</h2>
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.flatMap(sale => 
              sale.items.map(item => `
                <tr>
                  <td>${sale.transaction_id}</td>
                  <td>${item.product_name}${item.product_brand ? ` (${item.product_brand})` : ''}</td>
                  <td>${item.quantity}</td>
                  <td>₵${item.unit_price.toFixed(2)}</td>
                  <td>₵${item.subtotal.toFixed(2)}</td>
                </tr>
              `)
            ).join('')}
          </tbody>
        </table>

        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    let csv = 'Date,Transaction ID,Customer,Phone,Items Count,Total Quantity,Payment Method,Amount\n';
    
    reportData.forEach(sale => {
      csv += `"${formatDate(sale.created_at)}","${sale.transaction_id}","${sale.customer_name}","${sale.customer_phone}",${sale.items_count},${sale.total_quantity},"${sale.payment_method}",${sale.total_amount}\n`;
    });

    csv += '\n\nItem Details\n';
    csv += 'Transaction ID,Product,Brand,Quantity,Unit Price,Discount,Subtotal\n';
    
    reportData.forEach(sale => {
      sale.items.forEach(item => {
        csv += `"${sale.transaction_id}","${item.product_name}","${item.product_brand || ''}",${item.quantity},${item.unit_price},${item.discount_amount},${item.subtotal}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${getReportPeriodLabel().replace(/\s+/g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToTXT = () => {
    const reportStats = calculateReportStats();
    let txt = `${companyName} - Sales Report\n`;
    txt += `${'='.repeat(50)}\n\n`;
    txt += `Report Type: ${reportType.toUpperCase()}\n`;
    txt += `Period: ${getReportPeriodLabel()}\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    txt += `SUMMARY\n`;
    txt += `${'-'.repeat(50)}\n`;
    txt += `Total Transactions: ${reportStats.totalTransactions}\n`;
    txt += `Total Revenue: ₵${reportStats.totalRevenue.toFixed(2)}\n`;
    txt += `Items Sold: ${reportStats.totalItems}\n`;
    txt += `Average Transaction: ₵${reportStats.avgTransaction.toFixed(2)}\n\n`;

    txt += `TRANSACTIONS\n`;
    txt += `${'-'.repeat(50)}\n\n`;
    
    reportData.forEach((sale, index) => {
      txt += `${index + 1}. ${sale.transaction_id}\n`;
      txt += `   Date: ${formatDate(sale.created_at)}\n`;
      txt += `   Customer: ${sale.customer_name} (${sale.customer_phone})\n`;
      txt += `   Payment: ${sale.payment_method.toUpperCase()}\n`;
      txt += `   Items:\n`;
      sale.items.forEach(item => {
        txt += `     - ${item.product_name}${item.product_brand ? ` (${item.product_brand})` : ''}: ${item.quantity} x ₵${item.unit_price.toFixed(2)} = ₵${item.subtotal.toFixed(2)}\n`;
      });
      txt += `   Total: ₵${sale.total_amount.toFixed(2)}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${getReportPeriodLabel().replace(/\s+/g, '_')}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateReportStats = () => {
    const totalTransactions = reportData.length;
    const totalRevenue = reportData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalItems = reportData.reduce((sum, sale) => sum + sale.total_quantity, 0);
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return { totalTransactions, totalRevenue, totalItems, avgTransaction };
  };

  const getReportPeriodLabel = () => {
    switch (reportType) {
      case 'daily':
        return reportDate;
      case 'range':
        return `${startDate} to ${endDate}`;
      case 'month':
        return reportMonth;
      case 'year':
        return reportYear;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₵${amount.toFixed(2)}`;
  };

  // Filter sales
  const filteredSales = sales.filter(sale => {
    // Payment method filter
    if (filterPayment !== 'all' && sale.payment_method !== filterPayment) {
      return false;
    }

    // Date filter
    if (filterDate !== 'all') {
      const saleDate = new Date(sale.created_at);
      const now = new Date();
      
      if (filterDate === 'today') {
        return saleDate.toDateString() === now.toDateString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return saleDate >= monthAgo;
      }
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        sale.transaction_id.toLowerCase().includes(search) ||
        sale.customer_name.toLowerCase().includes(search) ||
        sale.customer_phone.includes(search)
      );
    }

    return true;
  });

  // Calculate today's stats
  const todayStats = filteredSales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayStats.reduce((sum, sale) => sum + sale.total_amount, 0);
  const todayTransactions = todayStats.length;
  const todayItems = todayStats.reduce((sum, sale) => sum + sale.total_quantity, 0);

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FontAwesomeIcon icon={faReceipt} className="text-blue-600" />
          My Transactions
        </h1>
        <p className="text-gray-600 mt-1">View your sales history and transaction details</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faReceipt} className="mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'reports'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Reports
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'transactions' && (
        <>
          {/* Today's Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-3xl text-green-600" />
            <span className="text-sm text-green-600">Today's Sales</span>
          </div>
          <div className="text-3xl font-bold text-green-800">{formatCurrency(todayRevenue)}</div>
          <div className="text-sm text-green-600 mt-2">
            {todayTransactions} transactions today
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faShoppingCart} className="text-3xl text-blue-600" />
            <span className="text-sm text-blue-600">Items Sold Today</span>
          </div>
          <div className="text-3xl font-bold text-blue-800">{todayItems}</div>
          <div className="text-sm text-blue-600 mt-2">
            Across all transactions
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faTachometerAlt} className="text-3xl text-purple-600" />
            <span className="text-sm text-purple-600">Avg Transaction</span>
          </div>
          <div className="text-3xl font-bold text-purple-800">
            {todayTransactions > 0 ? formatCurrency(todayRevenue / todayTransactions) : '₵0.00'}
          </div>
          <div className="text-sm text-purple-600 mt-2">
            Per sale today
          </div>
        </div>
      </div>

      {/* Overall Summary - Based on Today's Sales Only */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods (Today)</h2>
            <div className="space-y-3">
              {(() => {
                // Calculate today's payment methods from filtered sales
                const todayPayments: { [key: string]: number } = {};
                todayStats.forEach(sale => {
                  if (!todayPayments[sale.payment_method]) {
                    todayPayments[sale.payment_method] = 0;
                  }
                  todayPayments[sale.payment_method] += sale.total_amount;
                });
                
                return Object.entries(todayPayments).length > 0 ? (
                  Object.entries(todayPayments).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon 
                          icon={
                            method === 'cash' ? faMoneyBill :
                            method === 'card' ? faCreditCard :
                            faMobileAlt
                          } 
                          className={
                            method === 'cash' ? 'text-green-600' :
                            method === 'card' ? 'text-blue-600' :
                            'text-purple-600'
                          }
                        />
                        <span className="capitalize">{method.replace('_', ' ')}</span>
                      </div>
                      <span className="font-bold text-gray-800">{formatCurrency(amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No sales today</p>
                );
              })()}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Products (Today)</h2>
            <div className="space-y-2">
              {(() => {
                // Calculate today's top products from filtered sales
                const productCounts: { [key: string]: number } = {};
                todayStats.forEach(sale => {
                  sale.items.forEach(item => {
                    if (!productCounts[item.product_name]) {
                      productCounts[item.product_name] = 0;
                    }
                    productCounts[item.product_name] += item.quantity;
                  });
                });
                
                const topProducts = Object.entries(productCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                
                return topProducts.length > 0 ? (
                  topProducts.map(([product, quantity], index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{product}</span>
                      <span className="font-semibold text-gray-800">{quantity} units</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No sales today</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by transaction ID, customer..."
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

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
          </select>

          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              {filteredSales.length} transaction(s)
            </span>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faFileInvoice} className="text-4xl mb-2" />
            <p>No transactions found</p>
            <p className="text-sm mt-2">Try adjusting your filters or make your first sale!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-gray-700">Transaction ID</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Items</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Payment</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Amount</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                  <th className="text-center p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {sale.transaction_id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-semibold">{sale.customer_name}</div>
                        <div className="text-xs text-gray-500">{sale.customer_phone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div>{sale.items_count} items</div>
                        <div className="text-xs text-gray-500">{sale.total_quantity} units</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        sale.payment_method === 'cash' ? 'bg-green-100 text-green-800' :
                        sale.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {sale.payment_method.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-green-600">{formatCurrency(sale.total_amount)}</div>
                      {sale.overall_discount > 0 && (
                        <div className="text-xs text-red-500">-{formatCurrency(sale.overall_discount)}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{formatDate(sale.created_at)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => viewReceipt(sale)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                      >
                        <FontAwesomeIcon icon={faReceipt} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Row */}
        {filteredSales.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total: {filteredSales.length} transaction(s)
            </div>
            <div className="text-lg font-bold text-green-600">
              Total Sales: {formatCurrency(filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0))}
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} className="text-blue-600" />
              Generate Report
            </h2>
            
            {/* Report Type Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setReportType('daily')}
                className={`p-4 rounded-lg border-2 transition ${
                  reportType === 'daily'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <FontAwesomeIcon icon={faCalendar} className="mb-2 text-xl" />
                <div className="font-medium">Daily</div>
              </button>
              <button
                onClick={() => setReportType('range')}
                className={`p-4 rounded-lg border-2 transition ${
                  reportType === 'range'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <FontAwesomeIcon icon={faCalendar} className="mb-2 text-xl" />
                <div className="font-medium">Date Range</div>
              </button>
              <button
                onClick={() => setReportType('month')}
                className={`p-4 rounded-lg border-2 transition ${
                  reportType === 'month'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <FontAwesomeIcon icon={faCalendar} className="mb-2 text-xl" />
                <div className="font-medium">Monthly</div>
              </button>
              <button
                onClick={() => setReportType('year')}
                className={`p-4 rounded-lg border-2 transition ${
                  reportType === 'year'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <FontAwesomeIcon icon={faCalendar} className="mb-2 text-xl" />
                <div className="font-medium">Yearly</div>
              </button>
            </div>

            {/* Date Inputs Based on Report Type */}
            <div className="mb-6">
              {reportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {reportType === 'range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {reportType === 'month' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {reportType === 'year' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
                  <input
                    type="number"
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    min="2020"
                    max="2099"
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faChartBar} />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {/* Report Results */}
          {reportData.length > 0 && (
            <>
              {/* Report Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-2xl text-blue-600" />
                    <span className="text-sm text-blue-600">Transactions</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-800">{calculateReportStats().totalTransactions}</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl text-green-600" />
                    <span className="text-sm text-green-600">Total Revenue</span>
                  </div>
                  <div className="text-3xl font-bold text-green-800">{formatCurrency(calculateReportStats().totalRevenue)}</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-purple-600" />
                    <span className="text-sm text-purple-600">Items Sold</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-800">{calculateReportStats().totalItems}</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <FontAwesomeIcon icon={faTachometerAlt} className="text-2xl text-orange-600" />
                    <span className="text-sm text-orange-600">Avg Transaction</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-800">{formatCurrency(calculateReportStats().avgTransaction)}</div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faDownload} className="text-blue-600" />
                  Export Report
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={exportToPDF}
                    className="px-6 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faFilePdf} />
                    Export as PDF
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-6 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faFileCsv} />
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToTXT}
                    className="px-6 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faFileAlt} />
                    Export as TXT
                  </button>
                </div>
              </div>

              {/* Report Data Table */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Transaction ID</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Customer</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Items</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Payment</th>
                        <th className="text-right p-3 font-semibold text-gray-700">Amount</th>
                        <th className="text-center p-3 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map(sale => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">{formatDate(sale.created_at)}</td>
                          <td className="p-3 text-sm font-medium text-blue-600">{sale.transaction_id}</td>
                          <td className="p-3 text-sm">
                            <div>{sale.customer_name}</div>
                            <div className="text-xs text-gray-500">{sale.customer_phone}</div>
                          </td>
                          <td className="p-3 text-sm">{sale.items_count} items ({sale.total_quantity} units)</td>
                          <td className="p-3 text-sm">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              {sale.payment_method.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-sm font-semibold text-right text-green-600">{formatCurrency(sale.total_amount)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => viewReceipt(sale)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* No Report Data */}
          {reportData.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <FontAwesomeIcon icon={faChartBar} className="text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600">Select a report type and generate to view results</p>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedSale && (
        <POSThermalReceipt
          transactionId={selectedSale.transaction_id}
          customerName={selectedSale.customer_name}
          customerPhone={selectedSale.customer_phone}
          items={selectedSale.items}
          subtotal={selectedSale.subtotal}
          overallDiscount={selectedSale.overall_discount}
          totalAmount={selectedSale.total_amount}
          paymentMethod={selectedSale.payment_method}
          createdAt={selectedSale.created_at}
          companyName={companyName}
          onClose={() => setShowReceipt(false)}
          onResendSMS={async () => {
            try {
              await posSaleAPI.resendReceipt(selectedSale.id);
              setMessage('✅ Receipt SMS sent successfully!');
              setTimeout(() => setMessage(''), 3000);
            } catch (error) {
              setMessage('❌ Failed to send SMS');
              setTimeout(() => setMessage(''), 3000);
            }
          }}
        />
      )}
    </div>
  );
};

export default POSTransactions;

