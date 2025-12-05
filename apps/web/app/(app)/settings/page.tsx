// app/settings/page.tsx - Unified Settings Page

'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';
import { 
  User, Bell, Lock, Shield, Moon, Sun, Globe, 
  Save, Trash2, Eye, EyeOff 
} from 'lucide-react';

type Tab = 'account' | 'preferences' | 'security' | 'privacy';

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account Settings
  const [accountData, setAccountData] = useState({
    username: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    weeklyDigest: false,
  });

  // Security
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSaveAccount = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Validate passwords if changing
      if (accountData.newPassword) {
        if (accountData.newPassword !== accountData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (accountData.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
      }

      const response = await fetch('http://localhost:4000/api/auth/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: accountData.username,
          email: accountData.email,
          currentPassword: accountData.currentPassword,
          newPassword: accountData.newPassword,
        }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      setMessage({ type: 'success', text: 'Account settings updated successfully!' });
      
      // Clear password fields
      setAccountData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:4000/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as Tab);
                    setMessage(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={accountData.username}
                      onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={accountData.currentPassword}
                            onChange={(e) => setAccountData({ ...accountData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={accountData.newPassword}
                            onChange={(e) => setAccountData({ ...accountData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={accountData.confirmPassword}
                          onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAccount}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
                
                <div className="space-y-6">
                  {/* Appearance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {preferences.darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                          <div>
                            <p className="font-medium text-gray-900">Dark Mode</p>
                            <p className="text-sm text-gray-500">Enable dark theme</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPreferences({ ...preferences, darkMode: !preferences.darkMode })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            preferences.darkMode ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            preferences.darkMode ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Language
                        </label>
                        <select
                          value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={preferences.timezone}
                          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                        { key: 'projectUpdates', label: 'Project Updates', desc: 'Get notified about project changes' },
                        { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive weekly summary email' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key as keyof typeof preferences] })}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              preferences[item.key as keyof typeof preferences] ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                              preferences[item.key as keyof typeof preferences] ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Security</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <Lock className="w-6 h-6 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Password Security</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Last changed: Never
                        </p>
                        <button
                          onClick={() => setActiveTab('account')}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Change Password →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <Shield className="w-6 h-6 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Active Sessions</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          You are currently signed in on 1 device
                        </p>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                          Manage Sessions →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data & Privacy</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-700">
                          Your data is encrypted and stored securely. We never share your personal information without your consent.
                        </p>
                      </div>

                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Download My Data
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
                    <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                      <div className="flex items-start gap-4">
                        <Trash2 className="w-6 h-6 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 mb-2">Delete Account</h4>
                          <p className="text-sm text-red-700 mb-4">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                            Delete My Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}