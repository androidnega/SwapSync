import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';
import axios from 'axios';
import { getToken } from '../services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faKey, faUserPlus, faUserShield, faUser } from '@fortawesome/free-solid-svg-icons';

interface StaffMember {
  id: number;
  unique_id?: string;
  username: string;
  full_name: string;
  display_name?: string;
  company_name?: string;  // For Managers
  role: string;
  email: string;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
  audit_code?: string;
}

interface CurrentUser {
  role: string;
}

interface Activity {
  id: number;
  user_id: number;
  username: string;
  action: string;
  module: string;
  timestamp: string;
  details?: string;
}

interface Company {
  manager: StaffMember & { phone_number?: string };
  staff: StaffMember[];
  staff_count: number;
  recent_activities: Activity[];
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'staff' | 'companies'>('staff');

  // Form state for creating user
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone_number: '',
    company_name: '',
    password: '',
    role: 'shop_keeper'
  });

  // Edit form state
  const [editData, setEditData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    is_active: true
  });

  // Reset password state
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchCurrentUser();
    fetchStaff();
  }, []);

  useEffect(() => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    if (isAdmin && viewMode === 'companies') {
      fetchCompanies();
    }
  }, [viewMode, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/staff/my-staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
      setLoading(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to fetch staff');
      } else {
        setError('Failed to fetch staff');
      }
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/staff/admin/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const isSystemAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/auth/register`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`${isSystemAdmin() ? 'Manager' : 'Staff member'} ${formData.username} created successfully!`);
      setShowCreateForm(false);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        phone_number: '',
        company_name: '',
        password: '',
        role: isSystemAdmin() ? 'manager' : 'shop_keeper'
      });
      fetchStaff();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to create user');
      } else {
        setError('Failed to create user');
      }
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      await axios.put(
        `${API_URL}/staff/update/${selectedUser.id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`User ${selectedUser.username} updated successfully!`);
      setShowEditForm(false);
      setSelectedUser(null);
      fetchStaff();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to update user');
      } else {
        setError('Failed to update user');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      await axios.post(
        `${API_URL}/staff/reset-password/${selectedUser.id}`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Password for ${selectedUser.username} reset successfully!`);
      setShowResetPassword(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to reset password');
      } else {
        setError('Failed to reset password');
      }
    }
  };

  const handleDeleteUser = async (user: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      await axios.delete(
        `${API_URL}/staff/delete/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`User ${user.username} deleted successfully!`);
      fetchStaff();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to delete user');
      } else {
        setError('Failed to delete user');
      }
    }
  };

  const openEditForm = (user: StaffMember) => {
    setSelectedUser(user);
    setEditData({
      email: user.email,
      full_name: user.full_name,
      company_name: user.company_name || '',
      is_active: user.is_active
    });
    setShowEditForm(true);
    setShowResetPassword(false);
  };

  const openResetPasswordForm = (user: StaffMember) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowResetPassword(true);
    setShowEditForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const pageTitle = isSystemAdmin() ? 'Manager Management' : 'Staff Management';
  const createButtonText = isSystemAdmin() ? 'Create New Manager' : 'Create New Staff';
  const entityName = isSystemAdmin() ? 'Manager' : 'Staff Member';

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="mx-0 md:mx-6 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{pageTitle}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {isSystemAdmin() 
                ? 'Manage Manager accounts and business access'
                : 'Manage your shopkeepers and repairers'
              }
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowEditForm(false);
              setShowResetPassword(false);
              setFormData({
                username: '',
                email: '',
                full_name: '',
                phone_number: '',
                company_name: '',
                password: '',
                role: isSystemAdmin() ? 'manager' : 'shop_keeper'
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            {showCreateForm ? 'Cancel' : createButtonText}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 md:px-4 py-2 md:py-3 rounded text-sm md:text-base">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded text-sm md:text-base">
            {error}
          </div>
        )}

        {/* Tab Switcher for Admin */}
        {isSystemAdmin() && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setViewMode('staff')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'staff'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👥 My Staff
            </button>
            <button
              onClick={() => setViewMode('companies')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'companies'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏢 All Companies
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={isSystemAdmin() ? faUserShield : faUser} />
              Create New {entityName}
            </h2>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {isSystemAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name {isSystemAdmin() && '*'}
                    </label>
                    <input
                      type="text"
                      required={isSystemAdmin()}
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="TechFix Ghana"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0241234567"
                  />
                  <p className="text-xs text-gray-500 mt-1">For OTP login & password reset</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>

                {!isSystemAdmin() && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="shop_keeper">Shop Keeper</option>
                      <option value="repairer">Repairer</option>
                    </select>
                  </div>
                )}

                {isSystemAdmin() && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Creating a Manager account will give them full access to manage their own business operations,
                        including creating shopkeepers and repairers, viewing reports, and managing customers.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create {entityName}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && selectedUser && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Edit User: {selectedUser.username}
            </h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {selectedUser && (selectedUser.role === 'manager' || selectedUser.role === 'ceo') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editData.company_name}
                      onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="TechFix Ghana"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editData.is_active}
                      onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Account Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reset Password Form */}
        {showResetPassword && selectedUser && (
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Reset Password for: {selectedUser.username}
            </h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        {viewMode === 'staff' && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
            {isSystemAdmin() ? 'All Managers' : 'Your Staff'} ({staff.length})
          </h2>
          
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Username</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Role</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-800 font-medium">
                      {member.company_name && (member.role === 'manager' || member.role === 'ceo') ? (
                        <div>
                          <div className="font-bold text-purple-700">{member.company_name}</div>
                          <div className="text-sm text-gray-600">{member.full_name}</div>
                        </div>
                      ) : (
                        member.full_name
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{member.username}</td>
                    <td className="p-3 text-gray-600">{member.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        (member.role === 'manager' || member.role === 'ceo') ? 'bg-purple-100 text-purple-800' :
                        member.role === 'shop_keeper' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'repairer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'shop_keeper' ? 'SHOP KEEPER' :
                         member.role === 'repairer' ? 'REPAIRER' :
                         member.role === 'manager' ? 'MANAGER' : member.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(member)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          title="Edit User"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => openResetPasswordForm(member)}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                          title="Reset Password"
                        >
                          <FontAwesomeIcon icon={faKey} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          title="Delete User"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No {isSystemAdmin() ? 'Managers' : 'staff members'} yet. Click "{createButtonText}" to add your first {isSystemAdmin() ? 'Manager' : 'team member'}!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown on Mobile */}
          <div className="md:hidden space-y-4">
            {staff.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No {isSystemAdmin() ? 'Managers' : 'staff members'} yet. Click "{createButtonText}" to add your first {isSystemAdmin() ? 'Manager' : 'team member'}!
              </div>
            ) : (
              staff.map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      {member.company_name && (member.role === 'manager' || member.role === 'ceo') ? (
                        <div>
                          <div className="font-bold text-purple-700 text-base">{member.company_name}</div>
                          <div className="text-sm text-gray-600">{member.full_name}</div>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-gray-900">{member.full_name}</h3>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Username:</span>
                      <span className="text-gray-900">{member.username}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="text-gray-900">{member.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Role:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        (member.role === 'manager' || member.role === 'ceo') ? 'bg-purple-100 text-purple-800' :
                        member.role === 'shop_keeper' ? 'bg-blue-100 text-blue-800' :
                        member.role === 'repairer' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'shop_keeper' ? 'SHOP KEEPER' :
                         member.role === 'repairer' ? 'REPAIRER' :
                         member.role === 'manager' ? 'MANAGER' : member.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => openEditForm(member)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openResetPasswordForm(member)}
                      className="flex-1 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FontAwesomeIcon icon={faKey} />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(member)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* Companies View - Admin Only */}
        {viewMode === 'companies' && isSystemAdmin() && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
              <h2 className="text-base md:text-lg font-semibold text-blue-900 mb-1">📊 All Companies Overview</h2>
              <p className="text-xs md:text-sm text-blue-700">View all companies (managers) and their staff members</p>
            </div>

            {companies.length === 0 ? (
              <div className="bg-white p-8 md:p-12 rounded-xl shadow text-center">
                <div className="text-4xl md:text-6xl mb-4">🏢</div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No Companies Yet</h3>
                <p className="text-sm md:text-base text-gray-600">Create managers to see companies here</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {companies.map((company) => (
                  <div key={company.manager.id} className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                    {/* Company Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 md:p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-purple-900 mb-1">
                            {company.manager.company_name || 'Unnamed Company'}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-3">Manager: {company.manager.full_name}</p>
                          <div className="flex flex-col md:flex-row md:gap-4 gap-1 text-xs md:text-sm">
                            <span className="flex items-center gap-1">
                              <span className="font-semibold">Email:</span> <span className="truncate">{company.manager.email}</span>
                            </span>
                            {company.manager.phone_number && (
                              <span className="flex items-center gap-1">
                                <span className="font-semibold">Phone:</span> {company.manager.phone_number}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-0 md:text-right">
                          <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap ${
                            company.manager.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {company.manager.is_active ? '✓ Active' : '✗ Inactive'}
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 md:mt-2">
                            {company.staff_count} staff member{company.staff_count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Staff List */}
                    {company.staff.length > 0 ? (
                      <div className="p-4 md:p-6">
                        <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>👥</span> Staff Members
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                          {company.staff.map((staff) => (
                            <div key={staff.id} className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="font-semibold text-gray-800 text-sm md:text-base truncate flex-1">{staff.full_name}</div>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                                  staff.role === 'shop_keeper' ? 'bg-blue-100 text-blue-800' :
                                  staff.role === 'repairer' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {staff.role === 'shop_keeper' ? 'Shop' :
                                   staff.role === 'repairer' ? 'Repair' : staff.role}
                                </span>
                              </div>
                              <div className="text-xs md:text-sm text-gray-600 mb-1 truncate">@{staff.username}</div>
                              <div className="text-xs md:text-sm text-gray-600 truncate">{staff.email}</div>
                              <div className="mt-2">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  staff.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {staff.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <div className="text-3xl mb-2">👤</div>
                        <p>No staff members yet</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
