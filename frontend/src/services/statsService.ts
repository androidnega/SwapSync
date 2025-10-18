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

/**
 * Get dynamic message for shop keeper with real stats
 */
export function getShopKeeperMessage(stats: DailyStats | null, timeOfDay: string): { twi: string; english: string } {
  if (!stats) {
    // Fallback if no stats available
    return {
      twi: 'Twerɛ wo aguade nyinaa',
      english: 'Record all your sales properly'
    };
  }

  const { sales_count, sales_total, products_sold, swaps_completed } = stats;

  if (timeOfDay === 'morning') {
    return {
      twi: 'Hwɛ wo stock na sua nea aka',
      english: 'Check your stock and know what remains'
    };
  } else if (timeOfDay === 'afternoon') {
    if (sales_count > 0) {
      return {
        twi: `Wo atɔn ${sales_count} ɛnnɛ, kɔ so!`,
        english: `You've made ${sales_count} sales today, keep going!`
      };
    } else {
      return {
        twi: 'Kɔ so kyerɛ customers saa adwuma',
        english: 'Continue showing customers great service'
      };
    }
  } else if (timeOfDay === 'evening') {
    if (sales_total > 0) {
      return {
        twi: `Woanya ${formatCurrency(sales_total)} ɛnnɛ!`,
        english: `You've made ${formatCurrency(sales_total)} today!`
      };
    } else {
      return {
        twi: 'Kan wo aguade a woayɛ ɛnnɛ',
        english: 'Count the sales you made today'
      };
    }
  } else {
    return {
      twi: 'Da yie, ɔkyena yɛbɛtɔn pii',
      english: 'Sleep well, tomorrow we\'ll sell more'
    };
  }
}

/**
 * Get dynamic message for repairer with real stats
 */
export function getRepairerMessage(stats: DailyStats | null, timeOfDay: string): { twi: string; english: string } {
  if (!stats) {
    return {
      twi: 'Yɛ repairs pɛpɛɛpɛ',
      english: 'Do repairs carefully'
    };
  }

  const { repairs_pending, repairs_completed } = stats;

  if (timeOfDay === 'morning') {
    if (repairs_pending > 0) {
      return {
        twi: `Wo wɔ repairs ${repairs_pending} a aka`,
        english: `You have ${repairs_pending} pending repairs`
      };
    } else {
      return {
        twi: 'Hwɛ repairs foforɔ a ɛwɔ hɔ',
        english: 'Check for new repairs'
      };
    }
  } else if (timeOfDay === 'afternoon') {
    return {
      twi: 'Twerɛ parts a wode di dwuma',
      english: 'Record parts you use'
    };
  } else if (timeOfDay === 'evening') {
    if (repairs_completed > 0) {
      return {
        twi: `Woawie repairs ${repairs_completed} ɛnnɛ!`,
        english: `You completed ${repairs_completed} repairs today!`
      };
    } else {
      return {
        twi: 'Frɛ customers ma wɔnbɛgye',
        english: 'Call customers to come collect'
      };
    }
  } else {
    return {
      twi: 'Plan ɔkyena repairs',
      english: 'Plan tomorrow\'s repairs'
    };
  }
}

/**
 * Get dynamic message for manager with real stats
 */
export function getManagerMessage(stats: DailyStats | null, timeOfDay: string): { twi: string; english: string } {
  if (!stats) {
    return {
      twi: 'Hwɛ reports nyinaa ɛnnɛ',
      english: 'Check all reports today'
    };
  }

  const { total_profit, sales_count, repairs_completed } = stats;

  if (timeOfDay === 'morning') {
    return {
      twi: 'Hwɛ wo adwumayɛfoɔ sɛ wɔreyɛ adwuma',
      english: 'Monitor your staff to ensure they\'re working'
    };
  } else if (timeOfDay === 'afternoon') {
    if (sales_count > 0) {
      return {
        twi: `Sales ${sales_count} awie dɛ, sua profit`,
        english: `${sales_count} sales done, check profit`
      };
    } else {
      return {
        twi: 'Boa wo staff sɛ wohia',
        english: 'Help your staff if needed'
      };
    }
  } else if (timeOfDay === 'evening') {
    if (total_profit > 0) {
      return {
        twi: `Profit ɛnnɛ: ${formatCurrency(total_profit)}`,
        english: `Today's profit: ${formatCurrency(total_profit)}`
      };
    } else {
      return {
        twi: 'Review ɛnnɛ wiase',
        english: 'Review today\'s business'
      };
    }
  } else {
    return {
      twi: 'Hwɛ final reports na kɔ fie',
      english: 'Check final reports and go home'
    };
  }
}

