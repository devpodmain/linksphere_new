import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const adminNav = [
  {
    name: 'Overview',
    to: '/dashboard/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: 'Users',
    to: '/dashboard/admin/users',
    icon: Users,
  },
  {
    name: 'Subscriptions',
    to: '/dashboard/admin/subscriptions',
    icon: CreditCard,
  },
];

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Admin Panel</h1>
            <p className="text-secondary-600 mt-2">
              Manage users, subscriptions, and platform health
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-secondary-700 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white shadow'
                      : 'bg-white text-secondary-600 border border-secondary-200 hover:border-primary-200 hover:text-primary-700'
                  }`
                }
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </NavLink>
            );
          })}
        </div>

        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

