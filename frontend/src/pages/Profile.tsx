import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import Breadcrumb from '../components/Breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faPhone, 
  faBriefcase, 
  faImage, 
  faEdit,
  faLock,
  faSave,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faExclamationTriangle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

import { API_URL } from '../services/api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  full_name: string;
  display_name: string | null;
  profile_picture: string | null;
  role: string;
  company_name: string | null;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  // Account editing state (for managers only)
  const [editMode, setEditMode] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    full_name: '',
    company_name: ''
  });
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setDisplayName(response.data.display_name || response.data.full_name);
      setProfilePicture(response.data.profile_picture || '');
      setAccountForm({
        username: response.data.username,
        email: response.data.email,
        phone_number: response.data.phone_number || '',
        full_name: response.data.full_name,
        company_name: response.data.company_name || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/profile/me`, {
        display_name: displayName.trim() || null,
        profile_picture: profilePicture || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(response.data);
      setMessage('✅ Profile updated successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to update profile: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('⚠️ Are you sure you want to update your account details?\n\nThis will affect your login credentials if you change username or email.')) {
      return;
    }
    
    setSaving(true);
    setMessage('');

    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/profile/account`, accountForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
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
      const token = getToken();
      await axios.post(`${API_URL}/profile/change-password`, passwordForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setShowPasswordForm(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setMessage(`❌ Failed to change password: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setAccountForm({
        username: profile.username,
        email: profile.email,
        phone_number: profile.phone_number || '',
        full_name: profile.full_name,
        company_name: profile.company_name || ''
      });
    }
    setEditMode(false);
    setMessage('');
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      ceo: 'bg-purple-100 text-purple-800',
      shop_keeper: 'bg-blue-100 text-blue-800',
      repairer: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    return role.replace('_', ' ').toUpperCase();
  };

  const isManager = profile?.role === 'manager' || profile?.role === 'ceo';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const canEditAccount = isManager || isAdmin;  // Both managers and admins can edit

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb customItems={[{ label: 'Dashboard', path: '/' }, { label: 'Profile' }]} />
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto">
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your profile and account settings</p>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <FontAwesomeIcon 
                icon={message.includes('✅') ? faCheckCircle : faExclamationTriangle} 
                className="mr-2"
              />
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                
                <div className="flex flex-col items-center">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-4">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <label className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center cursor-pointer transition-colors flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faImage} />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {profilePicture && (
                    <button
                      onClick={() => setProfilePicture('')}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Role Badge */}
                <div className="mt-6 text-center">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleLabel(profile.role)}
                  </span>
                </div>

                {/* Display Name Form */}
                <form onSubmit={handleSubmitProfile} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={profile.full_name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This name will be shown across the system
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>
            </div>

            {/* Account Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details Card - For Managers and Admins */}
              {canEditAccount ? (
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
              ) : (
                /* Read-Only Account Info for Non-Managers */
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                    <span className="text-xs text-gray-500">🔒 Read-only</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Full Name</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 pl-6">{profile.full_name}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Username</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 pl-6">{profile.username}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Email</span>
                      </div>
                      <p className="text-base font-semibold text-gray-900 pl-6">{profile.email}</p>
                    </div>

                    {profile.phone_number && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Phone Number</span>
                        </div>
                        <p className="text-base font-semibold text-gray-900 pl-6">{profile.phone_number}</p>
                      </div>
                    )}

                    {profile.company_name && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FontAwesomeIcon icon={faBriefcase} className="text-gray-400" />
                          <span className="text-sm text-gray-600">Company</span>
                        </div>
                        <p className="text-base font-semibold text-gray-900 pl-6">{profile.company_name}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>🔒 Security:</strong> To change your account details, please contact your administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Change Password Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                        Change Password
                      </h3>
                      <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                    </div>
                    {!showPasswordForm && (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faLock} />
                        Change
                      </button>
                    )}
                  </div>
                </div>
                
                {showPasswordForm && (
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

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faLock} />
                        {saving ? 'Changing...' : 'Change Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  </form>
                )}
                
                {!showPasswordForm && (
                  <div className="p-6">
                    <p className="text-sm text-gray-600">
                      Click "Change" to update your password. You'll need your current password to proceed.
                    </p>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              {canEditAccount && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>🔒 Important:</strong> Changing your username or email will affect your login credentials. {isAdmin ? 'Administrator accounts cannot be deleted.' : 'You cannot delete your own account - contact your system administrator if needed.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
