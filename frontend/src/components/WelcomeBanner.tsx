import React, { useState, useEffect } from 'react';
import { 
  generateDashboardWelcome, 
  getDayMotivation, 
  getBusinessPhrase,
  markUserLogin,
  isReturningUser,
  WelcomeMessage,
  getTimeOfDay
} from '../services/ghanaianGreetings';
import { 
  getTodayStats, 
  getShopKeeperMessage, 
  getRepairerMessage, 
  getManagerMessage,
  DailyStats 
} from '../services/statsService';

interface WelcomeBannerProps {
  userName: string;
  userRole: string;
  userId: string | number;
  compact?: boolean;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ 
  userName, 
  userRole, 
  userId,
  compact = false 
}) => {
  const [welcomeData, setWelcomeData] = useState<WelcomeMessage | null>(null);
  const [dayMotivation, setDayMotivation] = useState({ twi: '', english: '' });
  const [businessPhrase, setBusinessPhrase] = useState({ twi: '', english: '' });
  const [showTranslation, setShowTranslation] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [stats, setStats] = useState<DailyStats | null>(null);

  // Check if banner should be shown
  useEffect(() => {
    const today = new Date().toDateString();
    const dismissedDate = localStorage.getItem(`welcome_dismissed_${userId}`);
    
    // Show banner if not dismissed today
    if (dismissedDate !== today) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [userId]);

  useEffect(() => {
    // Generate welcome message
    const isReturning = isReturningUser(userId);
    const welcome = generateDashboardWelcome(userName, userRole, isReturning);
    setWelcomeData(welcome);
    
    // Get day-specific motivation
    setDayMotivation(getDayMotivation());
    
    // Fetch real-time stats for dynamic tips
    fetchStatsAndUpdateTips();
    
    // Mark this login
    markUserLogin(userId);
    
    // Trigger animation
    setTimeout(() => setAnimateIn(true), 100);
  }, [userName, userRole, userId]);

  const fetchStatsAndUpdateTips = async () => {
    const todayStats = await getTodayStats();
    setStats(todayStats);
    
    // Get dynamic business phrase based on role and real stats
    const timeOfDay = getTimeOfDay();
    let dynamicTip = getBusinessPhrase(userRole);
    
    // Override with real-time stats for specific roles
    if (userRole === 'shop_keeper' && todayStats) {
      dynamicTip = getShopKeeperMessage(todayStats, timeOfDay);
    } else if (userRole === 'repairer' && todayStats) {
      dynamicTip = getRepairerMessage(todayStats, timeOfDay);
    } else if ((userRole === 'manager' || userRole === 'ceo') && todayStats) {
      dynamicTip = getManagerMessage(todayStats, timeOfDay);
    }
    
    setBusinessPhrase(dynamicTip);
  };

  // Handle close banner
  const handleClose = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`welcome_dismissed_${userId}`, today);
    setIsVisible(false);
  };

  if (!welcomeData || !isVisible) return null;

  // Get simple icon based on time of day
  const getTimeIcon = () => {
    switch (welcomeData.timeOfDay) {
      case 'morning':
        return '☀️';
      case 'afternoon':
        return '🌤️';
      case 'evening':
        return '🌆';
      case 'night':
        return '🌙';
      default:
        return '☀️';
    }
  };

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm transition-all duration-500 relative ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        title="Dismiss for today"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main Greeting */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <span className="text-3xl md:text-4xl">
          {getTimeIcon()}
        </span>
        <div className="flex-1">
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 mb-0.5">
            {welcomeData.greeting.twi}, {userName}!
          </h1>
          {welcomeData.greeting.ahanta && (
            <p className="text-xs text-blue-600 italic mb-0.5">
              {welcomeData.greeting.ahanta}
            </p>
          )}
          <p className="text-xs md:text-sm text-gray-600">
            {welcomeData.greeting.english}
          </p>
        </div>
      </div>

      {/* Day Motivation */}
      <div className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-0.5">
          {dayMotivation.twi}
        </p>
        <p className="text-xs text-gray-600">
          {dayMotivation.english}
        </p>
      </div>

      {/* Business Phrase */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <p className="text-sm font-medium text-gray-900 mb-0.5">
          💼 {businessPhrase.twi}
        </p>
        <p className="text-xs text-gray-600">
          {businessPhrase.english}
        </p>
      </div>

      {/* Additional info for admins */}
      {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager' || userRole === 'ceo') && (
        <div className="mt-3 flex items-center gap-2 text-gray-500 text-xs">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Logged in as {userRole.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  );
};

export default WelcomeBanner;

