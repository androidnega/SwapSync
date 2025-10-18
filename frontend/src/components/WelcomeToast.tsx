import React, { useEffect, useState } from 'react';
import { generateLoginSuccessMessage } from '../services/ghanaianGreetings';

interface WelcomeToastProps {
  userName: string;
  userRole: string;
  onClose: () => void;
  duration?: number;
}

const WelcomeToast: React.FC<WelcomeToastProps> = ({ 
  userName, 
  userRole, 
  onClose, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message] = useState(() => generateLoginSuccessMessage(userName, userRole));

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md border border-green-400">
        <div className="flex items-start gap-3">
          {/* Emoji */}
          <span className="text-4xl animate-bounce">
            {message.emoji}
          </span>
          
          {/* Content */}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              {message.title}
            </h3>
            <p className="text-sm text-white/90">
              {message.subtitle}
            </p>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/50 rounded-full transition-all ease-linear"
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomeToast;

