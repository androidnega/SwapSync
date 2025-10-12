import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faBriefcase, 
  faLock, 
  faSave,
  faEdit,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

interface UserAccount {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  full_name: string;
  company_name: string;
  role: string;
}

const AccountSettings: React.FC = () => {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Account details form
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    full_name: '',
    company_name: ''
  });
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await api.get('/profile/me');
      setAccount(response.data);
      setAccountForm({
        username: response.data.username,
        email: response.data.email,
        phone_number: response.data.phone_number || '',
        full_name: response.data.full_name,
        company_name: response.data.company_name || ''
      });
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch account:', error);
      setMessage(`❌ Failed to load account: ${error.response?.data?.detail || error.message}`);
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('⚠️ Are you sure you want to update your account details?\n\nThis will affect your login credentials.')) {
      return;
    }
    
    setSaving(true);
    setMessage('');

    try {
      const response = await api.put('/profile/account', accountForm);
      setAccount(response.data);
      setAccountForm({
        username: response.data.username,
        email: response.data.email,
        phone_number: response.data.phone_number || '',
        full_name: response.data.full_name,
        company_name: response.data.company_name || ''
      });
      setMessage('✅ Account details updated successfully!');
      setEditMode(false);
      
      // If username changed, update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.username !== response.data.username) {
        user.username = response.data.username;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to update account: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage('❌ New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      setMessage('❌ Password must be at least 6 characters long');
      return;
    }
    
    setSaving(true);
    setMessage('');

    try {
      await api.post('/profile/change-password', passwordForm);
      setMessage('✅ Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to change password: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (account) {
      setAccountForm({
        username: account.username,
        email: account.email,
        phone_number: account.phone_number || '',
        full_name: account.full_name,
        company_name: account.company_name || ''
      });
    }
    setEditMode(false);
    setMessage('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading account settings...</div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb customItems={[{ label: 'Dashboard', path: '/' }, { label: 'Account Settings' }]} />
      
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage your account details and security settings
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <FontAwesomeIcon 
              icon={message.includes('✅') ? faCheckCircle : faExclamationTriangle} 
              className="mr-2"
            />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                    <p className="text-sm text-gray-600">Update your account information</p>
                  </div>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                  )}
                </div>
              </div>
              
              <form onSubmit={handleUpdateAccount} className="p-6 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.full_name}
                    onChange={(e) => setAccountForm({ ...accountForm, full_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={accountForm.phone_number}
                    onChange={(e) => setAccountForm({ ...accountForm, phone_number: e.target.value })}
                    disabled={!editMode}
                    placeholder="+233 XX XXX XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-gray-400" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.company_name}
                    onChange={(e) => setAccountForm({ ...accountForm, company_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                  Change Password
                </h3>
                <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
              </div>
              
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faLock} />
                  {saving ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar - Account Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Role</p>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                    {account.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Account ID</p>
                  <p className="text-sm font-semibold text-gray-900">#{account.id}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Important:</strong> Changing your username or email will affect your login credentials. Make sure to remember your new details.
                </p>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>🔒 Security:</strong> You cannot delete your own account. Contact your system administrator if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;

