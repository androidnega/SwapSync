/**
 * Real-time Statistics Service
 * Fetches current day statistics for users
 */

import axios from 'axios';
import { API_URL } from './api';
import { getToken } from './authService';

export interface DailyStats {
  sales_count: number;
  sales_total: number;
  repairs_pending: number;
  repairs_completed: number;
  products_sold: number;
  swaps_completed: number;
  total_profit: number;
}

/**
 * Fetch today's statistics for the current user
 */
export async function getTodayStats(): Promise<DailyStats | null> {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await axios.get(`${API_URL}/dashboard/today-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to fetch today stats:', error);
    return null;
  }
}

/**
 * Format currency in Ghanaian Cedis
 */
export function formatCurrency(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


