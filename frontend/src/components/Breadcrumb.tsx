import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChevronRight, faChevronDown, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { getToken } from '../services/authService';

interface BreadcrumbProps {
  customItems?: Array<{ label: string; path?: string }>;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const fetchUser = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const pathMap: { [key: string]: string } = {
    '': 'Dashboard',
    'customers': 'Customers',
    'swapping-hub': 'Swapping Hub',
    'products-hub': 'Products Hub',
    'phones': 'Phone Inventory',
    'products': 'Product Inventory',
    'swaps': 'Phone Swaps',
    'sales': 'Product Sales',
    'pending-resales': 'Pending Resales',
    'repairs': 'Repairs',
    'staff-management': 'Staff Management',
    'activity-logs': 'Activity Logs',
    'reports': 'Reports',
    'profit-reports': 'Profit Reports',
    'settings': 'Settings',
    'brands': 'Phone Brands',
    'categories': 'Product Categories',
  };

  const generateBreadcrumbs = () => {
    if (customItems) return customItems;

    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/' }];

    paths.forEach((path, index) => {
      const fullPath = '/' + paths.slice(0, index + 1).join('/');
      breadcrumbs.push({
        label: pathMap[path] || path.charAt(0).toUpperCase() + path.slice(1),
        path: fullPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm overflow-x-auto">
          <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 whitespace-nowrap">
            <FontAwesomeIcon icon={faHome} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          
          {breadcrumbs.slice(1).map((crumb, index) => (
            <React.Fragment key={index}>
              <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
              {crumb.path && index < breadcrumbs.length - 2 ? (
                <Link
                  to={crumb.path}
                  className="text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium whitespace-nowrap">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Profile Dropdown */}
        {user && (
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 transition-colors"
            >
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="w-6 h-6 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline font-medium">{user.display_name || user.full_name}</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  <span>My Profile</span>
                </Link>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="text-xs" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Breadcrumb;

