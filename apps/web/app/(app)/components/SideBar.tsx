"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Film,
  Users,
  Layers,
  DollarSign,
  FileText,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Wallet,
  Package,
  Menu,
  X,
  Video,
  Megaphone,
  UserCog,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Film, label: "Projects", href: "/projects" },
  { icon: Layers, label: "Phases", href: "/phases" },
  {
    icon: UserCog,
    label: "Team Management",
    href: "/team",
  },
  { section: "Finance" },
  { icon: FileText, label: "Quotations", href: "/quotations" },
  { icon: DollarSign, label: "Budget", href: "/budget" },
  { icon: TrendingUp, label: "Cashflow", href: "/cashflow" },
  { icon: DollarSign, label: "Financing", href: "/financing-sources" },
  { section: "Procurement" },
  { icon: Package, label: "Vendors", href: "/vendors" },
  { icon: ShoppingCart, label: "Purchase Orders", href: "/purchase-orders" },
  { icon: Receipt, label: "Invoices", href: "/invoices" },
  { icon: Wallet, label: "Payments", href: "/payments" },
  { icon: Receipt, label: "Scheduled Payments", href: "/scheduled-payments" },
  { icon: TrendingUp, label: "Budget Variance", href: "/budget-variance" },
  { section: "Production" },
  { icon: Video, label: "Post Production", href: "/post-production" }, // ✅ Added
  { icon: Megaphone, label: "Publicity & P&A", href: "/publicity" }, 
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-gray-100 h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <Film className="w-8 h-8 text-blue-400" />
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            FilmFinance
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            // Section Header
            if ("section" in item) {
              return (
                <div key={index} className="pt-4 pb-2 px-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.section}
                  </p>
                </div>
              );
            }

            // Menu Item
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu} // Close menu on mobile after click
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
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
    </>
  );
}
