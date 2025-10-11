import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../services/authService';
import Breadcrumb from '../components/Breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faBriefcase, faImage, faEdit } from '@fortawesome/free-solid-svg-icons';

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error: any) {
      setMessage(`❌ Failed to update profile: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
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
      <div className="px-6 py-6">
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account settings</p>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
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
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Editable Fields */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Editable Information</h3>
                  <FontAwesomeIcon icon={faEdit} className="text-blue-500" />
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      This name will be shown across the system instead of your full name
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Read-Only Fields */}
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
                    <strong>🔒 Security:</strong> Email, phone number, and password cannot be changed here. Contact your administrator for assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

