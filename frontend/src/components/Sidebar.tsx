import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUserShield,
  faCog,
  faUsers,
  faExchangeAlt,
  faTools,
  faMobileAlt,
  faClock,
  faUserTie,
  faClipboardList,
  faShoppingCart,
  faMoneyBillWave,
  faChevronLeft,
  faChevronRight,
  faBars,
  faSignOutAlt,
  faUserCircle,
  faDatabase,
  faServer,
  faKey,
  faShieldAlt,
  faFileArchive,
  faChartPie,
  faEye,
  faTags,
  faBox,
  faUser,
  faSms,
  faComment,
  faCashRegister
} from '@fortawesome/free-solid-svg-icons';

interface SidebarItem {
  name: string;
  icon: any;
  route: string;
  badge?: number;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  email: string;
}

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

// ✨ Clean Role-Based Sidebar Configuration
const sidebarMenus: { [key: string]: SidebarItem[] } = {
  // 👑 SYSTEM ADMINISTRATOR - Platform & System Management ONLY
  super_admin: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'User Management', icon: faUsers, route: '/users' },
    { name: 'Manager Management', icon: faUserShield, route: '/staff-management' },
    { name: 'SMS Broadcast', icon: faSms, route: '/sms-broadcast' },
    { name: 'Audit Access', icon: faEye, route: '/audit-access' },
    { name: 'System Logs', icon: faServer, route: '/activity-logs' },
    { name: 'Database', icon: faDatabase, route: '/database' },
    { name: 'Settings', icon: faCog, route: '/settings' }
  ],
  
  // 👑 ADMIN - Same as Super Admin (System Management ONLY)
  admin: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'User Management', icon: faUsers, route: '/users' },
    { name: 'Manager Management', icon: faUserShield, route: '/staff-management' },
    { name: 'SMS Broadcast', icon: faSms, route: '/sms-broadcast' },
    { name: 'Audit Access', icon: faEye, route: '/audit-access' },
    { name: 'System Logs', icon: faServer, route: '/activity-logs' },
    { name: 'Database', icon: faDatabase, route: '/database' },
    { name: 'Settings', icon: faCog, route: '/settings' }
  ],
  
  // 👔 MANAGER - Business Owner (Full Business Operations)
  manager: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'Manager Analytics', icon: faUserTie, route: '/manager-dashboard' },
    { name: 'Staff Management', icon: faUsers, route: '/staff-management' },
    { name: 'POS Monitor', icon: faEye, route: '/pos-monitor' },
    { name: 'Swapping Hub', icon: faExchangeAlt, route: '/swapping-hub' },
    { name: 'Products Hub', icon: faShoppingCart, route: '/products-hub' },
    { name: 'Repairer Hub', icon: faTools, route: '/repairs' },
    { name: 'Customers', icon: faUserCircle, route: '/customers' },
    { name: 'Profit Reports', icon: faChartPie, route: '/profit-reports' },
    { name: 'Phone Brands', icon: faTags, route: '/brands' },
    { name: 'Categories', icon: faBox, route: '/categories' },
    { name: 'Activity Logs', icon: faServer, route: '/activity-logs' },
    { name: 'Audit Code', icon: faKey, route: '/audit-code' },
    { name: 'Profile', icon: faUser, route: '/profile' }
  ],
  
  // 👔 CEO - Backward compatibility alias (maps to manager)
  ceo: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'Manager Analytics', icon: faUserTie, route: '/manager-dashboard' },
    { name: 'Staff Management', icon: faUsers, route: '/staff-management' },
    { name: 'POS Monitor', icon: faEye, route: '/pos-monitor' },
    { name: 'Swapping Hub', icon: faExchangeAlt, route: '/swapping-hub' },
    { name: 'Products Hub', icon: faShoppingCart, route: '/products-hub' },
    { name: 'Repairer Hub', icon: faTools, route: '/repairs' },
    { name: 'Customers', icon: faUserCircle, route: '/customers' },
    { name: 'Profit Reports', icon: faChartPie, route: '/profit-reports' },
    { name: 'Phone Brands', icon: faTags, route: '/brands' },
    { name: 'Categories', icon: faBox, route: '/categories' },
    { name: 'Activity Logs', icon: faServer, route: '/activity-logs' },
    { name: 'Audit Code', icon: faKey, route: '/audit-code' },
    { name: 'Profile', icon: faUser, route: '/profile' }
  ],
  
  // 👤 SHOP KEEPER - Daily Transactions
  shop_keeper: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'POS System', icon: faCashRegister, route: '/pos' },
    { name: 'My Transactions', icon: faClipboardList, route: '/my-transactions' },
    { name: 'Customers', icon: faUserCircle, route: '/customers' },
    { name: 'Swapping Hub', icon: faExchangeAlt, route: '/swapping-hub' },
    { name: 'Products Hub', icon: faShoppingCart, route: '/products-hub' },
    { name: 'Profile', icon: faUser, route: '/profile' }
  ],
  
  // 🔧 REPAIRER - Repairs & Maintenance
  repairer: [
    { name: 'Dashboard', icon: faChartLine, route: '/' },
    { name: 'Repair Services', icon: faTools, route: '/repairs' },
    { name: 'Customers', icon: faUserCircle, route: '/customers' },
    { name: 'Profile', icon: faUser, route: '/profile' }
  ]
};

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  
  const menuItems = sidebarMenus[user.role] || [];
  
  const isActive = (route: string) => {
    return location.pathname === route;
  };
  
  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      super_admin: 'bg-red-600',
      admin: 'bg-red-600',
      ceo: 'bg-purple-600',
      shop_keeper: 'bg-blue-600',
      repairer: 'bg-green-600'
    };
    return colors[role] || 'bg-gray-600';
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').toUpperCase();
  };

  return (
    <>
      {/* Mobile Hamburger Button - Fixed Position */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg"
      >
        <FontAwesomeIcon icon={faBars} className="text-xl" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ease-in-out
          md:relative fixed inset-y-0 left-0 z-40
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-6 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10"
        >
          <FontAwesomeIcon 
            icon={isCollapsed ? faChevronRight : faChevronLeft} 
            className="text-xs"
          />
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 text-white text-2xl"
        >
          ×
        </button>

      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-center">
          {isCollapsed ? (
            <div className="text-2xl font-bold">SS</div>
          ) : (
            <div>
              <h1 className="text-xl font-bold">SwapSync</h1>
              <p className="text-xs text-gray-400">Shop Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className={`p-4 border-b border-gray-800 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'items-center space-x-3'}`}>
          {/* Profile Picture */}
          {user.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.full_name}
              className={`${
                isCollapsed ? 'w-12 h-12' : 'w-12 h-12'
              } rounded-full object-cover border-2 border-gray-700 flex-shrink-0`}
            />
          ) : (
            <div className={`${getRoleColor(user.role)} ${
              isCollapsed ? 'w-12 h-12 text-lg' : 'w-12 h-12 text-xl'
            } rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* User Info */}
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-sm truncate">
                {user.display_name || user.full_name}
              </div>
              <div className="text-xs text-gray-400 truncate">{user.username}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`${getRoleColor(user.role)} text-xs px-2 py-0.5 rounded-full`}>
                  {getRoleLabel(user.role)}
                </span>
                {user.unique_id && (
                  <span className="text-xs text-gray-400">{user.unique_id}</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {isCollapsed && (
          <div className="text-center mt-2">
            <div className="text-xs text-gray-400">{user.unique_id || `#${user.id}`}</div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuItems.map((item) => (
          <Link
            key={item.route}
            to={item.route}
            onClick={() => setIsMobileOpen(false)}  // Auto-close on mobile
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'px-4'
            } py-3 mx-2 rounded-lg transition-colors ${
              isActive(item.route)
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title={isCollapsed ? item.name : ''}
          >
            <FontAwesomeIcon 
              icon={item.icon} 
              className={`${isCollapsed ? 'text-lg' : 'mr-3'}`}
            />
            {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
            {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => {
            setIsMobileOpen(false);
            onLogout();
          }}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'px-4'
          } py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className={isCollapsed ? '' : 'mr-3'} />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;

