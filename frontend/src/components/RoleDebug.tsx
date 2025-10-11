import React from 'react';

interface RoleDebugProps {
  user: any;
}

const RoleDebug: React.FC<RoleDebugProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">🔍 Role Debug Info</h3>
      <div className="space-y-1">
        <div><strong>Username:</strong> {user.username}</div>
        <div><strong>Role:</strong> <span className="text-yellow-400">{user.role}</span></div>
        <div><strong>Full Name:</strong> {user.full_name}</div>
        <div><strong>ID:</strong> {user.id}</div>
        {user.unique_id && <div><strong>Unique ID:</strong> {user.unique_id}</div>}
        {user.company_name && <div><strong>Company:</strong> {user.company_name}</div>}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-300">
          <strong>Expected Menu Items for {user.role}:</strong>
        </div>
        {user.role === 'manager' && (
          <div className="text-green-400 text-xs mt-1">
            ✅ Should see: Phone Brands, Product Categories
          </div>
        )}
        {user.role === 'ceo' && (
          <div className="text-yellow-400 text-xs mt-1">
            ⚠️ CEO role - different menu structure
          </div>
        )}
        {user.role !== 'manager' && user.role !== 'ceo' && (
          <div className="text-red-400 text-xs mt-1">
            ❌ Not manager/CEO - no brands/categories
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDebug;
