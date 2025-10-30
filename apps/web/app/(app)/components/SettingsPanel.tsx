// components/SettingsPanel.tsx - Settings dropdown

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Moon, Sun, Globe, Bell, Lock, Palette, 
  Database, Download, Trash2, Shield 
} from 'lucide-react';

export default function SettingsPanel() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Quick Settings</h3>
      </div>

      {/* Settings List */}
      <div className="py-2">
        {/* Appearance */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Appearance
          </p>
          
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-4 h-4 text-gray-600" />
              ) : (
                <Sun className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-sm text-gray-700">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Theme */}
          <button
            onClick={() => router.push('/settings/theme')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Palette className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Theme Customization</span>
          </button>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Preferences */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Preferences
          </p>
          
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Push Notifications</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  notifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Auto-save</span>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoSave ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoSave ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Language */}
          <button
            onClick={() => router.push('/settings/language')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Language</span>
            <span className="ml-auto text-xs text-gray-500">English</span>
          </button>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Data & Security */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Data & Security
          </p>
          
          <button
            onClick={() => router.push('/settings/security')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Privacy & Security</span>
          </button>

          <button
            onClick={() => router.push('/settings/backup')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Backup & Export</span>
          </button>

          <button
            onClick={() => router.push('/settings/security')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Two-Factor Auth</span>
          </button>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Danger Zone */}
        <div className="px-4 py-2">
          <button
            onClick={() => router.push('/settings/danger')}
            className="w-full flex items-center gap-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-600">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 text-center">
        <button
          onClick={() => router.push('/settings')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Open Full Settings
        </button>
      </div>
    </div>
  );
}