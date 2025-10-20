/**
 * Training Manual Download Component
 * Shows role-specific training manual download button
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faDownload, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { trainingAPI } from '../services/api';
import { getToken } from '../services/authService';
import axios from 'axios';

interface TrainingManualProps {
  role: 'shopkeeper' | 'manager' | 'repairer';
  compact?: boolean;
}

const TrainingManualDownload: React.FC<TrainingManualProps> = ({ role, compact = false }) => {
  const [downloading, setDownloading] = React.useState(false);

  const manualConfig = {
    shopkeeper: {
      title: 'Shop Keeper Training Manual',
      description: 'Complete guide for POS operations, customer service, and daily tasks',
      url: trainingAPI.getShopkeeperManual(),
      filename: 'SwapSync_ShopKeeper_Training_Manual.pdf',
      color: 'green'
    },
    manager: {
      title: 'Manager Training Manual',
      description: 'Business management, staff oversight, analytics, and growth strategies',
      url: trainingAPI.getManagerManual(),
      filename: 'SwapSync_Manager_Training_Manual.pdf',
      color: 'orange'
    },
    repairer: {
      title: 'Repairer Training Manual',
      description: 'Phone repair management, status updates, and customer communication',
      url: trainingAPI.getRepairerManual(),
      filename: 'SwapSync_Repairer_Training_Manual.pdf',
      color: 'purple'
    }
  };

  const config = manualConfig[role];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = getToken();
      const response = await axios.get(config.url, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', config.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download training manual:', error);
      alert('Failed to download training manual. Please try again or contact support.');
    } finally {
      setDownloading(false);
    }
  };

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      button: 'bg-green-600 hover:bg-green-700',
      icon: 'text-green-600'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      button: 'bg-orange-600 hover:bg-orange-700',
      icon: 'text-orange-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      button: 'bg-purple-600 hover:bg-purple-700',
      icon: 'text-purple-600'
    }
  };

  const colors = colorClasses[config.color];

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`flex items-center gap-2 px-4 py-2 ${colors.button} text-white rounded-lg transition disabled:opacity-50`}
      >
        <FontAwesomeIcon icon={downloading ? faGraduationCap : faBook} className={downloading ? 'animate-pulse' : ''} />
        {downloading ? 'Downloading...' : 'Training Manual'}
      </button>
    );
  }

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 md:p-6`}>
      <div className="flex items-start gap-4">
        <div className={`${colors.icon} text-3xl md:text-4xl`}>
          <FontAwesomeIcon icon={faBook} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg md:text-xl font-bold ${colors.text} mb-2`}>
            📖 {config.title}
          </h3>
          <p className="text-sm md:text-base text-gray-700 mb-4">
            {config.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${colors.button} text-white rounded-lg transition disabled:opacity-50 text-sm md:text-base font-medium`}
            >
              <FontAwesomeIcon icon={downloading ? faGraduationCap : faDownload} className={downloading ? 'animate-pulse' : ''} />
              {downloading ? 'Downloading PDF...' : 'Download Training Manual (PDF)'}
            </button>
            {!downloading && (
              <div className="text-xs md:text-sm text-gray-600 flex items-center gap-1 px-2">
                <FontAwesomeIcon icon={faBook} />
                <span>Complete walkthrough & Q&A</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingManualDownload;

