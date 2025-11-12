import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Home,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  QrCode,
  ChevronDown,
  Shield,
  Crown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState<string>('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Fetch profile URL when user is available
  useEffect(() => {
    const fetchProfileUrl = async () => {
      if (user) {
        try {
          const response = await api.get('/profiles/me');
          if (response.data.success && response.data.profile?.profile_url) {
            setProfileUrl(response.data.profile.profile_url);
          }
        } catch (error) {
          console.error('Failed to fetch profile URL:', error);
        }
      }
    };

    fetchProfileUrl();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = isSuperAdmin || user?.role === 'admin';

  const baseNavigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Account', href: '/dashboard/account', icon: Settings },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
  ];

  const navigation = [...baseNavigation];

  if (isAdmin && !isSuperAdmin) {
    navigation.push({ name: 'Admin Panel', href: '/dashboard/admin', icon: Shield });
  }

  if (isSuperAdmin) {
    navigation.push({ name: 'Super Admin Panel', href: '/dashboard/superadmin', icon: Crown });
  }

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-200">
            <h1 className="text-xl font-bold text-primary-600">Linksphere</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 px-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-secondary-200">
          <div className="flex items-center h-16 px-4 border-b border-secondary-200">
            <h1 className="text-xl font-bold text-primary-600">Linksphere</h1>
          </div>
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-secondary-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side - Mobile menu button and View Profile Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-secondary-600 hover:text-secondary-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* View Profile Button */}
              {profileUrl && (
                <Link
                  to={`/connect/${profileUrl}`}
                  className="hidden sm:inline-flex items-center px-3 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 font-medium rounded-lg transition-colors text-sm"
                  target="_blank"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              )}
            </div>
            
            {/* Right side - User Info & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                {/* User Info - Hidden on mobile */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                </div>
                
                <ChevronDown className={`h-4 w-4 text-secondary-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50 transform translate-x-0">
                  <div className="px-4 py-2 border-b border-secondary-100 md:hidden">
                    <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                    <p className="text-xs text-secondary-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile Settings
                  </Link>
                  
                  <Link
                    to="/dashboard/account"
                    className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Account Settings
                  </Link>
                  
                  <div className="border-t border-secondary-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

