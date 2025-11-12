import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, Settings2, ArrowLeft, Layers } from 'lucide-react';

const superAdminNav = [
  {
    name: 'System Overview',
    to: '/dashboard/superadmin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    name: 'User & Admin Management',
    to: '/dashboard/superadmin/admins',
    icon: Users,
  },
  {
    name: 'Subscription Management',
    to: '/dashboard/superadmin/subscriptions',
    icon: Layers,
  },
  {
    name: 'Global Config',
    to: '/dashboard/superadmin/config',
    icon: Settings2,
  },
];

const SuperAdminLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Super Admin Console</h1>
            <p className="text-secondary-600 mt-2">
              Monitor platform health, manage privileged accounts, and fine-tune global settings.
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
          {superAdminNav.map((item) => {
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

export default SuperAdminLayout;

