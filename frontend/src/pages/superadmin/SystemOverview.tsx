import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchSuperAdminStats } from '../../services/superadmin';

const SystemOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_users: 0,
    active_subscriptions: 0,
    estimated_monthly_revenue: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchSuperAdminStats();
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          toast.error('Failed to load system stats');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load system stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center text-secondary-500">
        Loading system metrics...
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: stats.total_users.toLocaleString(),
      description: 'All registered accounts',
      accent: 'bg-primary-100 text-primary-700',
    },
    {
      label: 'Active Subscriptions',
      value: stats.active_subscriptions.toLocaleString(),
      description: 'Paid plans currently active',
      accent: 'bg-green-100 text-green-700',
    },
    {
      label: 'Estimated Monthly Revenue',
      value: `₹${stats.estimated_monthly_revenue.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      })}`,
      description: 'Based on active plans & pricing',
      accent: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h2 className="text-lg font-semibold text-secondary-900">Platform Health</h2>
          <p className="text-sm text-secondary-500 mt-1">
            Monitor subscription trends and plan conversion. Integrate analytics here in future iterations.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-secondary-600">
            <li>• Track user growth week-over-week.</li>
            <li>• Review churn to identify friction points.</li>
            <li>• Coordinate with finance on revenue reporting cadence.</li>
          </ul>
        </div>

        <div className="border border-secondary-200 rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900">Upcoming Administration Tasks</h2>
          <ul className="mt-3 space-y-2 text-sm text-secondary-600">
            <li>• Audit admin access quarterly.</li>
            <li>• Review global configurations after marketing promotions.</li>
            <li>• Align support SLAs with updated contact details.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;







