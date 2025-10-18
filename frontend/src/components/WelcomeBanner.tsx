import React, { useState, useEffect } from 'react';
import { 
  generateDashboardWelcome, 
  getDayMotivation, 
  getBusinessPhrase,
  markUserLogin,
  isReturningUser,
  WelcomeMessage
} from '../services/ghanaianGreetings';

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

  useEffect(() => {
    // Generate welcome message
    const isReturning = isReturningUser(userId);
    const welcome = generateDashboardWelcome(userName, userRole, isReturning);
    setWelcomeData(welcome);
    
    // Get day-specific motivation
    setDayMotivation(getDayMotivation());
    
    // Get business phrase
    setBusinessPhrase(getBusinessPhrase());
    
    // Mark this login
    markUserLogin(userId);
    
    // Trigger animation
    setTimeout(() => setAnimateIn(true), 100);
  }, [userName, userRole, userId]);

  if (!welcomeData) return null;

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
      className={`bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
      {/* Main Greeting */}
      <div className="flex items-start gap-4 mb-4">
        <span className="text-4xl md:text-5xl">
          {getTimeIcon()}
        </span>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
            {welcomeData.greeting.twi}, {userName}!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {welcomeData.greeting.english}
          </p>
        </div>
      </div>

      {/* Day Motivation */}
      <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
        <p className="text-base font-medium text-gray-900 mb-1">
          {dayMotivation.twi}
        </p>
        <p className="text-sm text-gray-600">
          {dayMotivation.english}
        </p>
      </div>

      {/* Business Phrase */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <p className="text-base font-medium text-gray-900 mb-1">
          💼 {businessPhrase.twi}
        </p>
        <p className="text-sm text-gray-600">
          {businessPhrase.english}
        </p>
      </div>

      {/* Additional info for admins */}
      {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager' || userRole === 'ceo') && (
        <div className="mt-4 flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Logged in as {userRole.replace('_', ' ')}</span>
        </div>
      )}
    </div>
  );
};

export default WelcomeBanner;

