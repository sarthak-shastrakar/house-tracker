import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  HardHat,
  Receipt,
  BarChart3,
  ClipboardList,
  Settings,
  LogOut,
  X,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderOpen },
    { name: 'Materials', href: '/materials', icon: Package },
    { name: 'Contractors', href: '/contractors', icon: HardHat },
    { name: 'Bills', href: '/bills', icon: Receipt },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Audit Log', href: '/audit-log', icon: ClipboardList },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Helper to determine active state
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return 'BL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-950 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-md shadow-primary-500/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-400">
              BuildLedger
            </span>
          </Link>

          {/* Close button for mobile screen drawer */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 md:hidden dark:hover:bg-gray-900 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-600 shadow-xs dark:bg-primary-950/40 dark:text-primary-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900/60 dark:hover:text-gray-100'
                }`}
              >
                <Icon className={`h-5 w-5 stroke-[1.75] transition-colors duration-200 ${
                  active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile & logout footer */}
        <div className="border-t border-gray-100 p-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs mb-3">
            {/* User Avatar Initials */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-600 text-sm font-bold text-white shadow-xs">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                {user?.name || 'Guest User'}
              </p>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                Owner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition-colors duration-200 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <LogOut className="h-5 w-5 stroke-[1.75]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
