// components/SettingsPanel.tsx - Updated with proper routes

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Moon, Sun, Globe, Bell, Lock, 
  Download, Trash2, Shield 
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

          {/* Language */}
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Language & Region</span>
          </button>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Security */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Account & Security
          </p>
          
          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Privacy & Security</span>
          </button>

          <button
            onClick={() => router.push('/settings')}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Download Data</span>
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