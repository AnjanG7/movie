// components/SettingsPanel.tsx - Updated with proper routes

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Lock,
  Download,
  Trash2,
  Shield,
} from "lucide-react";

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
        {/* Security */}
        <div className="px-4 py-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Account & Security
          </p>

          <button
            onClick={() => router.push("/settings")}
            className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Privacy & Security</span>
          </button>

          <button
            onClick={() => router.push("/settings")}
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
          onClick={() => router.push("/settings")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Open Full Settings
        </button>
      </div>
    </div>
  );
}
