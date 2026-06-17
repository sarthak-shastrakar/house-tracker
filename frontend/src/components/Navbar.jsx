import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Sun, Moon, ChevronDown, User, Settings, LogOut, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine page title based on current pathname
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/dashboard') return 'Dashboard';
    if (path === '/projects') return 'Projects';
    if (path.startsWith('/projects/')) return 'Project Details';
    if (path === '/materials') return 'Material Ledger';
    if (path === '/contractors') return 'Contractors';
    if (path.startsWith('/contractors/')) return 'Contractor Details';
    if (path === '/bills') return 'Bills & Invoices';
    if (path === '/analytics') return 'Financial Analytics';
    if (path === '/audit-log') return 'Audit Log';
    if (path === '/settings') return 'Settings';

    return 'BuildLedger';
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-700 md:hidden dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Page Title */}
        <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Light/Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-500 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-gray-100 p-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 transition-colors duration-200"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-primary-500 to-indigo-600 text-xs font-bold text-white shadow-xs">
              {getInitials(user?.name)}
            </div>
            <span className="hidden text-sm font-semibold text-gray-700 md:block dark:text-gray-300">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-lg ring-1 ring-black/5 dark:border-gray-800 dark:bg-gray-950 dark:shadow-2xl">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'Guest User'}
                </p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {user?.email || 'guest@buildledger.com'}
                </p>
                <span className="mt-2 inline-flex items-center rounded-md bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-400">
                  Owner
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900/60"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </Link>
                <Link
                  to="/audit-log"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900/60"
                >
                  <ClipboardList className="h-4 w-4 text-gray-400" />
                  Audit Log
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
