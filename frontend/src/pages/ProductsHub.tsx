import React, { useState } from 'react';
import Products from './Products';
import ProductSales from './ProductSales';
import SoldItems from './SoldItems';
import Breadcrumb from '../components/Breadcrumb';

type TabType = 'products' | 'sales' | 'sold';

const ProductsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('products');

  // Listen for tab switch events from child components
  React.useEffect(() => {
    const handleSwitchTab = (event: CustomEvent) => {
      setActiveTab(event.detail as TabType);
    };
    
    window.addEventListener('switchTab' as any, handleSwitchTab);
    
    return () => {
      window.removeEventListener('switchTab' as any, handleSwitchTab);
    };
  }, []);

  const tabs = [
    { id: 'products' as TabType, label: 'Product Inventory', icon: '📦' },
    { id: 'sales' as TabType, label: 'Product Sales', icon: '💰' },
    { id: 'sold' as TabType, label: 'Sold Items', icon: '📊' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'sales':
        return <ProductSales />;
      case 'sold':
        return <SoldItems />;
      case 'products':
        return <Products />;
      default:
        return <Products />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb />
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products Hub</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage product sales and inventory (phones, accessories, etc.)
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default ProductsHub;
