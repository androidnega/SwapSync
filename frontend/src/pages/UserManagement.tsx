import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faEdit,
  faTrash,
  faKey,
  faSearch,
  faFilter,
  faUserPlus,
  faCheck,
  faTimes,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  full_name: string;
  role: string;
  company_name: string;
  is_active: boolean;
  created_at: string;
  parent_user_id?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    full_name: '',
    role: '',
    company_name: '',
    is_active: true
  });
  
  // Change password state
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, companyFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (error: any) {
      setMessage(`❌ Failed to load users: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.full_name.toLowerCase().includes(term) ||
        user.phone_number.includes(term) ||
        user.company_name.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(user => user.company_name === companyFilter);
    }

    setFilteredUsers(filtered);
  };

  const getUniqueCompanies = (): string[] => {
    const companies = users.map(user => user.company_name).filter(Boolean);
    return Array.from(new Set(companies)).sort();
  };

  const getUserHierarchy = () => {
    // Organize users into hierarchy: Managers -> their staff
    // Exclude system admins from hierarchy
    const managers = users.filter(u => 
      (u.role === 'manager' || u.role === 'ceo') && 
      u.role !== 'admin' && 
      u.role !== 'super_admin'
    );
    const staff = users.filter(u => u.role === 'shop_keeper' || u.role === 'repairer');
    
    return managers.map(manager => {
      const managerStaff = staff.filter(s => s.parent_user_id === manager.id);
      return {
        manager,
        staff: managerStaff
      };
    });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      full_name: user.full_name,
      role: user.role,
      company_name: user.company_name,
      is_active: user.is_active
    });
    setMessage('');
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      await api.put(`/auth/users/${editingUser.id}`, editForm);
      setMessage(`✅ User ${editForm.username} updated successfully!`);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to update user: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    // Prevent deletion of admin accounts
    if (user.role === 'admin' || user.role === 'super_admin') {
      setMessage('❌ Cannot delete administrator accounts. Admins can only be deactivated or have their details changed.');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (!confirm(`⚠️ WARNING: Delete user "${user.username}" (${user.full_name})?\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      await api.delete(`/auth/users/${user.id}`);
      setMessage(`✅ User ${user.username} deleted successfully!`);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to delete user: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleChangePasswordClick = (user: User) => {
    setChangingPasswordFor(user);
    setNewPassword('');
    setShowPassword(false);
    setMessage('');
  };

  const handleChangePassword = async () => {
    if (!changingPasswordFor) return;

    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters long');
      return;
    }

    try {
      await api.post('/auth/admin/change-user-password', null, {
        params: {
          user_id: changingPasswordFor.id,
          new_password: newPassword
        }
      });
      setMessage(`✅ Password changed successfully for ${changingPasswordFor.username}!`);
      setChangingPasswordFor(null);
      setNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ Failed to change password: ${error.response?.data?.detail || error.message}`);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-800',
      ceo: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      repairer: 'bg-green-100 text-green-800',
      shopkeeper: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
          <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl md:text-2xl" />
          User Management
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
          View, edit, and manage all system users
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg text-sm md:text-base ${
          message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode('hierarchy')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'hierarchy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Hierarchy View
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              Search Users
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, phone, company..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="ceo">CEO</option>
              <option value="manager">Manager</option>
              <option value="repairer">Repairer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filter by Company
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Companies</option>
              {getUniqueCompanies().map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* List View - Users Table */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Full Name</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Email</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Phone</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Company</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-xs md:text-sm">{user.username}</div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-gray-900 text-xs md:text-sm">{user.full_name}</div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-gray-600 text-xs">{user.email}</div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="text-gray-600 text-xs">{user.phone_number}</div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-gray-600 text-xs">{user.company_name}</div>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-1 md:gap-2">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit User"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleChangePasswordClick(user)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Change Password"
                      >
                        <FontAwesomeIcon icon={faKey} />
                      </button>
                      {user.role !== 'admin' && user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found matching your criteria
          </div>
        )}
      </div>
    )}

      {/* Hierarchy View - Company Structure */}
      {viewMode === 'hierarchy' && (
        <div className="space-y-6">
          {getUserHierarchy().map(({ manager, staff }) => (
            <div key={manager.id} className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-400">
              {/* Manager Card */}
              <div className="bg-blue-50 p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">👑</span>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">
                          {manager.company_name || manager.full_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {manager.role.toUpperCase()} - {manager.username}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium">{manager.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{manager.phone_number}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      manager.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {manager.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(manager)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleChangePasswordClick(manager)}
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                        title="Change Password"
                      >
                        <FontAwesomeIcon icon={faKey} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Members Under This Manager */}
              {staff.length > 0 ? (
                <div className="p-4 md:p-6 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>👥</span> Staff Members ({staff.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {staff.map(member => (
                      <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{member.full_name}</div>
                            <div className="text-xs text-gray-500">@{member.username}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {member.role === 'shop_keeper' ? 'SHOPKEEPER' : member.role.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600 mb-3">
                          <div className="truncate">{member.email}</div>
                          <div>{member.phone_number}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(member)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleChangePasswordClick(member)}
                              className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"
                              title="Change Password"
                            >
                              <FontAwesomeIcon icon={faKey} className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(member)}
                              className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50">
                  No staff members yet
                </div>
              )}
            </div>
          ))}
          
          {getUserHierarchy().length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No companies or managers found
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  <FontAwesomeIcon icon={faEdit} className="mr-2 text-blue-600" />
                  Edit User: {editingUser.username}
                </h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                    <option value="manager">Manager</option>
                    <option value="repairer">Repairer</option>
                    <option value="shopkeeper">Shopkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={editForm.company_name}
                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active User</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Update User
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPasswordFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  <FontAwesomeIcon icon={faKey} className="mr-2 text-green-600" />
                  Change Password
                </h2>
                <button
                  onClick={() => setChangingPasswordFor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-4">
                  Changing password for: <strong>{changingPasswordFor.username}</strong> ({changingPasswordFor.full_name})
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  disabled={newPassword.length < 6}
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Change Password
                </button>
                <button
                  onClick={() => setChangingPasswordFor(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

