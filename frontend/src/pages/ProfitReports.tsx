import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';

import { API_URL } from '../services/api';

interface ProfitSummary {
  today: {
    revenue: number;
    profit: number;
    sales_count: number;
  };
  this_week: {
    revenue: number;
    profit: number;
    sales_count: number;
  };
  this_month: {
    revenue: number;
    profit: number;
    sales_count: number;
  };
}

const ProfitReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [message, setMessage] = useState('');
  
  // Daily report
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Weekly report
  const [weeklyEndDate, setWeeklyEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Monthly report
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  
  // Yearly report
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/profit-reports/summary`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSummary(response.data);
    } catch (error: any) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const downloadReport = async (endpoint: string, filename: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMessage('✅ Report downloaded successfully!');
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyReport = () => {
    downloadReport(
      `/profit-reports/daily?date=${dailyDate}`,
      `Daily_Profit_Report_${dailyDate}.pdf`
    );
  };

  const handleWeeklyReport = () => {
    downloadReport(
      `/profit-reports/weekly?end_date=${weeklyEndDate}`,
      `Weekly_Profit_Report_${weeklyEndDate}.pdf`
    );
  };

  const handleMonthlyReport = () => {
    downloadReport(
      `/profit-reports/monthly?year=${monthlyYear}&month=${monthlyMonth}`,
      `Monthly_Profit_Report_${monthlyYear}_${monthlyMonth}.pdf`
    );
  };

  const handleYearlyReport = () => {
    downloadReport(
      `/profit-reports/yearly?year=${yearlyYear}`,
      `Yearly_Profit_Report_${yearlyYear}.pdf`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit Reports</h1>
          <p className="text-gray-600 mt-1">Generate and download comprehensive profit reports (Manager Only)</p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Quick Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-lg">
                  📅
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Today's Performance</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Revenue:</span>
                  <span className="text-lg font-bold text-blue-900">₵{summary.today.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Profit:</span>
                  <span className="text-lg font-bold text-blue-900">₵{summary.today.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Sales:</span>
                  <span className="text-lg font-bold text-blue-900">{summary.today.sales_count}</span>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl border border-emerald-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-lg">
                  📊
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">This Week</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700">Revenue:</span>
                  <span className="text-lg font-bold text-emerald-900">₵{summary.this_week.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700">Profit:</span>
                  <span className="text-lg font-bold text-emerald-900">₵{summary.this_week.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700">Sales:</span>
                  <span className="text-lg font-bold text-emerald-900">{summary.this_week.sales_count}</span>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white text-lg">
                  📈
                </div>
                <h3 className="text-lg font-semibold text-purple-900">This Month</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Revenue:</span>
                  <span className="text-lg font-bold text-purple-900">₵{summary.this_month.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Profit:</span>
                  <span className="text-lg font-bold text-purple-900">₵{summary.this_month.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Sales:</span>
                  <span className="text-lg font-bold text-purple-900">{summary.this_month.sales_count}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Reports Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 System Reports</h2>
          <p className="text-gray-600 mb-6">Comprehensive system-wide reports and analytics</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Hub Profits Report */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                  🏪
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Hub Profits</h3>
                  <p className="text-xs text-blue-600">All hubs breakdown</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/dashboard/hub-profits', 'Hub_Profits_Report.pdf')}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>

            {/* Sales Analytics */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                  💰
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Sales Analytics</h3>
                  <p className="text-xs text-green-600">Sales performance</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/analytics/sales', 'Sales_Analytics_Report.pdf')}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>

            {/* Inventory Report */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl">
                  📦
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Inventory Report</h3>
                  <p className="text-xs text-purple-600">Stock analysis</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/analytics/inventory', 'Inventory_Report.pdf')}
                disabled={loading}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>

            {/* Customer Analytics */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl">
                  👥
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Customer Analytics</h3>
                  <p className="text-xs text-orange-600">Customer insights</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/analytics/customers', 'Customer_Analytics_Report.pdf')}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>

            {/* Repair Analytics */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-xl">
                  🔧
                </div>
                <div>
                  <h3 className="font-semibold text-teal-900">Repair Analytics</h3>
                  <p className="text-xs text-teal-600">Repair performance</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/repairs/stats/hub', 'Repair_Analytics_Report.pdf')}
                disabled={loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>

            {/* Pending Resales */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-xl">
                  ⏳
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">Pending Resales</h3>
                  <p className="text-xs text-yellow-600">Swap status report</p>
                </div>
              </div>
              <button
                onClick={() => downloadReport('/reports/pending-resales-detailed', 'Pending_Resales_Report.pdf')}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-gray-300 transition-all"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>

        {/* Profit Reports Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Profit Reports</h2>
          <p className="text-gray-600 mb-6">Detailed profit analysis by time period</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Report */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                📅
              </div>
              <div>
                <h2 className="text-lg font-semibold text-blue-900">Daily Report</h2>
                <p className="text-sm text-blue-600">Single day profit analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">Select Date</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="w-full bg-white/80 border border-blue-200 rounded-xl p-2.5 text-gray-700 focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                />
              </div>
              <button
                onClick={handleDailyReport}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? 'Generating...' : '📥 Download Daily Report'}
              </button>
            </div>
          </div>

          {/* Weekly Report */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-900">Weekly Report</h2>
                <p className="text-sm text-emerald-600">Last 7 days profit analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">End Date</label>
                <input
                  type="date"
                  value={weeklyEndDate}
                  onChange={(e) => setWeeklyEndDate(e.target.value)}
                  className="w-full bg-white/80 border border-emerald-200 rounded-xl p-2.5 text-gray-700 focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition"
                />
                <p className="text-xs text-emerald-600 mt-1.5">Report includes 7 days ending on this date</p>
              </div>
              <button
                onClick={handleWeeklyReport}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? 'Generating...' : '📥 Download Weekly Report'}
              </button>
            </div>
          </div>

          {/* Monthly Report */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                📈
              </div>
              <div>
                <h2 className="text-lg font-semibold text-purple-900">Monthly Report</h2>
                <p className="text-sm text-purple-600">Full month profit analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">Month</label>
                  <select
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                    className="w-full bg-white/80 border border-purple-200 rounded-xl p-2.5 text-gray-700 focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
                  >
                    <option value={1}>January</option>
                    <option value={2}>February</option>
                    <option value={3}>March</option>
                    <option value={4}>April</option>
                    <option value={5}>May</option>
                    <option value={6}>June</option>
                    <option value={7}>July</option>
                    <option value={8}>August</option>
                    <option value={9}>September</option>
                    <option value={10}>October</option>
                    <option value={11}>November</option>
                    <option value={12}>December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">Year</label>
                  <input
                    type="number"
                    value={monthlyYear}
                    onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                    className="w-full bg-white/80 border border-purple-200 rounded-xl p-2.5 text-gray-700 focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
              <button
                onClick={handleMonthlyReport}
                disabled={loading}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? 'Generating...' : '📥 Download Monthly Report'}
              </button>
            </div>
          </div>

          {/* Yearly Report */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                📆
              </div>
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Yearly Report</h2>
                <p className="text-sm text-amber-600">Full year profit analysis</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">Year</label>
                <input
                  type="number"
                  value={yearlyYear}
                  onChange={(e) => setYearlyYear(parseInt(e.target.value))}
                  className="w-full bg-white/80 border border-amber-200 rounded-xl p-2.5 text-gray-700 focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
                  min={2020}
                  max={2030}
                />
              </div>
              <button
                onClick={handleYearlyReport}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium disabled:bg-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? 'Generating...' : '📥 Download Yearly Report'}
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Comprehensive Report Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">System Reports:</h4>
              <ul className="text-blue-700 space-y-1 list-disc list-inside text-sm">
                <li>Hub profits breakdown (Products, Swapping, Repairs)</li>
                <li>Sales analytics and performance metrics</li>
                <li>Inventory analysis and stock reports</li>
                <li>Customer insights and analytics</li>
                <li>Repair performance and item sales</li>
                <li>Pending resales and swap status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Profit Reports:</h4>
              <ul className="text-blue-700 space-y-1 list-disc list-inside text-sm">
                <li>Daily, weekly, monthly, and yearly analysis</li>
                <li>Revenue, costs, and profit margins</li>
                <li>Top performing items and categories</li>
                <li>Company branding and professional formatting</li>
                <li>PDF format ready to print or share</li>
                <li>Manager-only access for confidentiality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitReports;

