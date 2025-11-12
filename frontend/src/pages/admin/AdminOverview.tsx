import React, { useEffect, useState } from 'react';
import { getUsers, fetchAdminSubscriptions } from '../../services/admin';

interface Metrics {
  totalUsers: number;
  disabledUsers: number;
  activeSubscriptions: number;
  premiumSubscribers: number;
}

const AdminOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    disabledUsers: 0,
    activeSubscriptions: 0,
    premiumSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          totalUsersRes,
          disabledUsersRes,
          activeSubsRes,
          premiumSubsRes,
        ] = await Promise.all([
          getUsers({ per_page: 1 }),
          getUsers({ status: 'disabled', per_page: 1 }),
          fetchAdminSubscriptions({ status: 'active', per_page: 1 }),
          fetchAdminSubscriptions({ plan: 'premium', per_page: 1 }),
        ]);

        if (
          !totalUsersRes.data.success ||
          !disabledUsersRes.data.success ||
          !activeSubsRes.data.success ||
          !premiumSubsRes.data.success
        ) {
          throw new Error('Failed to load admin metrics');
        }

        setMetrics({
          totalUsers: totalUsersRes.data.pagination.total,
          disabledUsers: disabledUsersRes.data.pagination.total,
          activeSubscriptions: activeSubsRes.data.pagination.total,
          premiumSubscribers: premiumSubsRes.data.pagination.total,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-secondary-500">
        Loading admin metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: metrics.totalUsers,
      description: 'All registered accounts',
      accent: 'bg-primary-100 text-primary-700',
    },
    {
      label: 'Active Subscriptions',
      value: metrics.activeSubscriptions,
      description: 'Users on active plans',
      accent: 'bg-green-100 text-green-700',
    },
    {
      label: 'Premium Subscribers',
      value: metrics.premiumSubscribers,
      description: 'Users on premium plan',
      accent: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Disabled Accounts',
      value: metrics.disabledUsers,
      description: 'Manually disabled users',
      accent: 'bg-red-100 text-red-700',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-5 rounded-lg border border-secondary-200 bg-secondary-50">
            <p className="text-sm text-secondary-500">{card.label}</p>
            <p className="text-3xl font-bold text-secondary-900 mt-2">{card.value}</p>
            <span className={`inline-flex mt-3 px-2 py-1 rounded-full text-xs font-semibold ${card.accent}`}>
              {card.description}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-secondary-200 rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Activity</h2>
          <p className="text-sm text-secondary-500 mt-1">
            Admin audit trail coming soon.
          </p>
        </div>
        <div className="border border-secondary-200 rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900">Upcoming Actions</h2>
          <ul className="mt-3 space-y-2 text-sm text-secondary-600">
            <li>• Review pending support tickets</li>
            <li>• Monitor subscription renewals</li>
            <li>• Sync marketing campaigns with premium users</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;

