import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle,
  faClock,
  faCheckCircle,
  faPercent,
  faMobileAlt,
  faTools,
  faMoneyBillWave,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';

interface DashboardCardProps {
  id: string;
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

const iconMap: { [key: string]: any } = {
  faUserCircle,
  faClock,
  faCheckCircle,
  faPercent,
  faMobileAlt,
  faTools,
  faMoneyBillWave,
  faChartLine
};

const colorMap: { [key: string]: { bg: string; border: string; text: string; icon: string } } = {
  blue: {
    bg: 'bg-white',
    border: 'border-blue-200',
    text: 'text-gray-900',
    icon: 'text-blue-400'
  },
  yellow: {
    bg: 'bg-white',
    border: 'border-yellow-200',
    text: 'text-gray-900',
    icon: 'text-yellow-400'
  },
  green: {
    bg: 'bg-white',
    border: 'border-green-200',
    text: 'text-gray-900',
    icon: 'text-green-400'
  },
  red: {
    bg: 'bg-white',
    border: 'border-red-200',
    text: 'text-gray-900',
    icon: 'text-red-400'
  },
  purple: {
    bg: 'bg-white',
    border: 'border-purple-200',
    text: 'text-gray-900',
    icon: 'text-purple-400'
  },
  indigo: {
    bg: 'bg-white',
    border: 'border-indigo-200',
    text: 'text-gray-900',
    icon: 'text-indigo-400'
  },
  orange: {
    bg: 'bg-white',
    border: 'border-orange-200',
    text: 'text-gray-900',
    icon: 'text-orange-400'
  }
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  value,
  icon = 'faChartLine',
  color = 'blue',
  subtitle,
  onClick
}) => {
  const cardIcon = iconMap[icon] || iconMap.faChartLine;
  const colors = colorMap[color] || colorMap.blue;
  
  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg shadow-sm p-5 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${colors.icon} text-2xl sm:text-3xl`}>
          <FontAwesomeIcon icon={cardIcon} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;

