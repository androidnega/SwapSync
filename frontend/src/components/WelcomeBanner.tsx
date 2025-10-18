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

  // Get gradient based on time of day
  const getGradient = () => {
    switch (welcomeData.timeOfDay) {
      case 'morning':
        return 'from-orange-400 via-yellow-400 to-amber-300';
      case 'afternoon':
        return 'from-blue-400 via-cyan-400 to-teal-300';
      case 'evening':
        return 'from-purple-400 via-pink-400 to-rose-300';
      case 'night':
        return 'from-indigo-500 via-purple-500 to-blue-500';
      default:
        return 'from-blue-400 via-cyan-400 to-teal-300';
    }
  };

  // Get background pattern
  const getBackgroundPattern = () => {
    return "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";
  };

  if (compact) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-gradient-to-r ${getGradient()} p-4 shadow-md transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{welcomeData.greeting.emoji}</span>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {welcomeData.greeting.twi}
                </h2>
                <p className="text-sm text-white/90">
                  {welcomeData.greeting.english}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${getGradient()} p-6 md:p-8 shadow-lg transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      style={{ 
        backgroundImage: `url("${getBackgroundPattern()}")`,
        backgroundSize: '60px 60px'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20" />
      
      <div className="relative z-10">
        {/* Main Greeting */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl md:text-6xl animate-bounce">
              {welcomeData.greeting.emoji}
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">
                {welcomeData.greeting.twi}, {userName}!
              </h1>
              <p className="text-base md:text-lg text-white/90 italic">
                "{welcomeData.greeting.english}"
              </p>
            </div>
          </div>
        </div>

        {/* Day Motivation */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/30">
          <p className="text-lg md:text-xl font-semibold text-white mb-1">
            {dayMotivation.twi}
          </p>
          <p className="text-sm md:text-base text-white/90 italic">
            {dayMotivation.english}
          </p>
        </div>

        {/* Business Phrase */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-base md:text-lg font-medium text-white mb-1">
                💼 {businessPhrase.twi}
              </p>
              <p className="text-sm text-white/90 italic">
                {businessPhrase.english}
              </p>
            </div>
            
            {/* Toggle Translation Button */}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
              title="Toggle translation"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Additional info for admins */}
        {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager' || userRole === 'ceo') && (
          <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Logged in as {userRole.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
    </div>
  );
};

export default WelcomeBanner;

