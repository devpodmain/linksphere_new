import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import Home from '../components/dashboard/Home';
import Profile from '../components/dashboard/Profile';
import Account from '../components/dashboard/Account';
import Support from '../components/dashboard/Support';
import AdminLayout from './admin/AdminLayout';
import AdminOverview from './admin/AdminOverview';
import UserManagement from './admin/UserManagement';
import AdminSubscriptionManagement from './admin/SubscriptionManagement';
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import SystemOverview from './superadmin/SystemOverview';
import SuperAdminUserManager from './superadmin/AdminUserManager';
import SubscriptionManagement from './superadmin/SubscriptionManagement';
import GlobalConfig from './superadmin/GlobalConfig';

// Error Boundary to catch any rendering errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Profile component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-red-600">Something went wrong</h2>
              <p className="text-secondary-600 mb-4">
                {this.state.error?.message || 'An error occurred while loading the profile page'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = user.role === 'admin';

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/profile"
          element={
            <ErrorBoundary>
              <Profile />
            </ErrorBoundary>
          }
        />
        <Route path="/account" element={<Account />} />
        <Route path="/support" element={<Support />} />
        {isAdmin ? (
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="subscriptions" element={<AdminSubscriptionManagement />} />
          </Route>
        ) : (
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
        )}
        {isSuperAdmin ? (
          <Route path="/superadmin/*" element={<SuperAdminLayout />}>
            <Route index element={<SystemOverview />} />
            <Route path="admins" element={<SuperAdminUserManager />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="config" element={<GlobalConfig />} />
          </Route>
        ) : (
          <Route path="/superadmin/*" element={<Navigate to="/dashboard" replace />} />
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;


