// components/Sidebar.tsx - Navigation sidebar

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Users, Layers, DollarSign, FileText, TrendingUp } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Film, label: 'Projects', href: '/projects' },
  { icon: Users, label: 'Investors', href: '/investors' },
  { icon: Layers, label: 'Phases', href: '/phases' },
  { icon: DollarSign, label: 'Budget', href: '/budget', disabled: true },
  { icon: FileText, label: 'Vendors', href: '/vendors', disabled: true },
  { icon: TrendingUp, label: 'Cashflow', href: '/cashflow', disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-gray-100 h-screen flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Film className="w-8 h-8 text-blue-400" />
        <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          FilmFinance
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isDisabled = item.disabled;

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : ''}
                ${!isActive && !isDisabled ? 'hover:bg-gray-800 text-gray-300' : ''}
                ${isDisabled ? 'opacity-40 cursor-not-allowed text-gray-500' : 'cursor-pointer'}
              `}
              onClick={(e) => isDisabled && e.preventDefault()}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isDisabled && (
                <span className="ml-auto text-xs bg-gray-800 px-2 py-0.5 rounded">Soon</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4">
          <p className="text-sm font-semibold text-white mb-1">Need Help?</p>
          <p className="text-xs text-blue-100 mb-3">Check our documentation</p>
          <button className="w-full bg-white text-blue-600 text-sm font-medium py-2 rounded-md hover:bg-blue-50 transition-colors">
            View Docs
          </button>
        </div>
      </div>
    </div>
  );
}