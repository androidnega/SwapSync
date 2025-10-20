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
  faCalendar, faSearch, faFileInvoice
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
  
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today'); // Default to today
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch POS sales using posSaleAPI service
      const salesRes = await posSaleAPI.getAll({ limit: 500 });
      setSales(salesRes.data);
      
      // Fetch summary using posSaleAPI service
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

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Today's Sales</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(todayRevenue)}</div>
          <div className="text-sm opacity-80 mt-2">
            {todayTransactions} transactions today
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faShoppingCart} className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Items Sold Today</span>
          </div>
          <div className="text-3xl font-bold">{todayItems}</div>
          <div className="text-sm opacity-80 mt-2">
            Across all transactions
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <FontAwesomeIcon icon={faTachometerAlt} className="text-3xl opacity-80" />
            <span className="text-sm opacity-80">Avg Transaction</span>
          </div>
          <div className="text-3xl font-bold">
            {todayTransactions > 0 ? formatCurrency(todayRevenue / todayTransactions) : '₵0.00'}
          </div>
          <div className="text-sm opacity-80 mt-2">
            Per sale today
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {Object.entries(summary.sales_by_payment_method).map(([method, amount]) => (
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
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Products</h2>
            <div className="space-y-2">
              {summary.top_selling_products.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{product.product}</span>
                  <span className="font-semibold text-gray-800">{product.quantity} units</span>
                </div>
              ))}
              {summary.top_selling_products.length === 0 && (
                <p className="text-gray-500 text-center py-4">No sales yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-md p-6">
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

