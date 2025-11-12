import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchSuperAdminSubscriptions,
  fetchSuperAdminSubscriptionHistory,
  updateUserSubscription,
  expireSuperAdminSubscription,
  type SuperAdminUser,
  type SuperAdminUserListParams,
} from '../../services/superadmin';
import {
  type SubscriptionPlan,
  type SubscriptionStatus,
  type SubscriptionPeriod,
  type SubscriptionHistoryEntry,
} from '../../services/subscriptions';

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

const defaultPagination: PaginationState = {
  page: 1,
  per_page: 10,
  total: 0,
  total_pages: 1,
};

const PLAN_PERIOD_OPTIONS: Record<SubscriptionPlan, SubscriptionPeriod[]> = {
  free: [],
  trial: ['trial'],
  basic: ['monthly', 'yearly'],
  premium: ['monthly', 'yearly'],
};

const STATUS_OPTIONS: SubscriptionStatus[] = ['active', 'expired', 'paused'];

const toLocalInputValue = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoString = (localValue: string): string | null => {
  if (!localValue) return null;
  return new Date(localValue).toISOString();
};

const computeExpiryInputValue = (plan: SubscriptionPlan, period: SubscriptionPeriod | null): string => {
  if (plan === 'free') {
    return '';
  }
  const now = new Date();
  const days =
    plan === 'trial' || period === 'trial'
      ? 15
      : period === 'yearly'
        ? 365
        : 30;
  now.setDate(now.getDate() + days);
  return toLocalInputValue(now.toISOString());
};

const formatDisplayDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatHistoryLine = (entry: SubscriptionHistoryEntry): string => {
  const planLabel = entry.new_plan.charAt(0).toUpperCase() + entry.new_plan.slice(1);
  const statusLabel = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
  const expiryLabel = entry.expires_at ? formatDisplayDate(entry.expires_at) : 'No expiry';
  return `${planLabel} → ${statusLabel} → ${expiryLabel}`;
};

const SubscriptionManagement: React.FC = () => {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlan>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [saving, setSaving] = useState(false);
  const [manageModalUser, setManageModalUser] = useState<SuperAdminUser | null>(null);
  const [manageForm, setManageForm] = useState<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    period: '' | SubscriptionPeriod;
    expires_at: string;
  }>({
    plan: 'free',
    status: 'active',
    period: '',
    expires_at: '',
  });
  const [historyModalUser, setHistoryModalUser] = useState<SuperAdminUser | null>(null);
  const [historyEntries, setHistoryEntries] = useState<SubscriptionHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params: SuperAdminUserListParams = {
          page,
          per_page: pagination.per_page,
          search: searchTerm.trim(),
        };
        if (planFilter !== 'all') {
          params.plan = planFilter;
        }
        if (statusFilter !== 'all') {
          params.subscription_status = statusFilter;
        }

        const response = await fetchSuperAdminSubscriptions(params);
        const data = response.data;
        if (!data.success) {
          throw new Error('Failed to fetch subscriptions');
        }

        setUsers(data.data);
        setPagination(data.pagination);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Unable to load subscriptions');
      } finally {
        setLoading(false);
      }
    },
    [pagination.per_page, planFilter, searchTerm, statusFilter],
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleExpire = async (userId: number) => {
    try {
      await expireSuperAdminSubscription(userId);
      toast.success('Subscription expired');
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to expire subscription');
    }
  };

  const openManageModal = (user: SuperAdminUser) => {
    const availablePeriods = PLAN_PERIOD_OPTIONS[user.subscription_plan];
    const defaultPeriod =
      user.subscription_plan === 'free'
        ? ''
        : (user.subscription_period as SubscriptionPeriod | null) ??
          (availablePeriods.length > 0 ? availablePeriods[0] : '');

    const expiresInput =
      user.subscription_plan === 'free'
        ? ''
        : user.subscription_expires_at
          ? toLocalInputValue(user.subscription_expires_at)
          : computeExpiryInputValue(
              user.subscription_plan,
              defaultPeriod ? (defaultPeriod as SubscriptionPeriod) : null,
            );

    setManageModalUser(user);
    setManageForm({
      plan: user.subscription_plan,
      status: user.subscription_status,
      period: defaultPeriod ? (defaultPeriod as SubscriptionPeriod) : '',
      expires_at: expiresInput,
    });
  };

  const closeManageModal = () => {
    setManageModalUser(null);
  };

  const openHistoryModal = async (user: SuperAdminUser) => {
    setHistoryModalUser(user);
    setHistoryEntries(user.history ?? []);
    setHistoryLoading(true);
    try {
      const { data } = await fetchSuperAdminSubscriptionHistory(user.id);
      if (data.success) {
        setHistoryEntries(data.data);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load subscription history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryModalUser(null);
    setHistoryEntries([]);
  };

  const handlePlanChange = (plan: SubscriptionPlan) => {
    setManageForm((prev) => {
      const options = PLAN_PERIOD_OPTIONS[plan];
      const nextPeriod = options.length > 0 ? options[0] : '';
      const nextExpiry =
        plan === 'free'
          ? ''
          : computeExpiryInputValue(plan, nextPeriod ? (nextPeriod as SubscriptionPeriod) : null);
      return {
        ...prev,
        plan,
        period: nextPeriod ? (nextPeriod as SubscriptionPeriod) : '',
        expires_at: nextExpiry,
        status: plan === 'free' && prev.status === 'expired' ? 'expired' : prev.status,
      };
    });
  };

  const handlePeriodChange = (period: SubscriptionPeriod) => {
    setManageForm((prev) => ({
      ...prev,
      period,
      expires_at: computeExpiryInputValue(prev.plan, period),
    }));
  };

  const handleStatusChange = (status: SubscriptionStatus) => {
    setManageForm((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleManageSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!manageModalUser) return;

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        plan: manageForm.plan,
        status: manageForm.status,
      };
      if (manageForm.period) {
        payload.period = manageForm.period;
      }
      if (manageForm.plan !== 'free') {
        payload.expires_at = manageForm.expires_at ? toIsoString(manageForm.expires_at) : null;
      }

      await updateUserSubscription(manageModalUser.id, payload as any);
      toast.success('Subscription updated successfully.');
      closeManageModal();
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update subscription.');
    } finally {
      setSaving(false);
    }
  };

  const pageRange = useMemo(
    () => Array.from({ length: pagination.total_pages }, (_, index) => index + 1).slice(0, 5),
    [pagination.total_pages],
  );

  const renderStatusBadge = (status: string) => {
    let color = 'bg-gray-100 text-gray-700';
    if (status === 'active') color = 'bg-green-100 text-green-700';
    if (status === 'expired') color = 'bg-red-100 text-red-600';
    if (status === 'paused') color = 'bg-amber-100 text-amber-700';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>
        {status}
      </span>
    );
  };

  const renderPlanBadge = (plan: string) => {
    let color = 'bg-gray-100 text-gray-700';
    if (plan === 'basic') color = 'bg-indigo-100 text-indigo-700';
    if (plan === 'premium') color = 'bg-purple-100 text-purple-700';
    if (plan === 'trial') color = 'bg-amber-100 text-amber-700';
    if (plan === 'free') color = 'bg-secondary-100 text-secondary-700';
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>
        {plan}
      </span>
    );
  };

  const renderSkeletonRows = () => (
    <tbody className="bg-white divide-y divide-secondary-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-3">
            <div className="h-3.5 bg-secondary-200 rounded w-40 mb-2 animate-pulse" />
            <div className="h-3 bg-secondary-200 rounded w-32 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 bg-secondary-200 rounded-full w-20 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 bg-secondary-200 rounded-full w-16 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-secondary-200 rounded w-16 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-secondary-200 rounded w-28 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-secondary-200 rounded w-32 animate-pulse" />
          </td>
          <td className="px-4 py-3">
            <div className="h-8 bg-secondary-200 rounded w-32 animate-pulse" />
          </td>
        </tr>
      ))}
    </tbody>
  );

  const renderEmptyState = () => (
    <tbody>
      <tr>
        <td colSpan={7} className="px-4 py-10 text-center text-secondary-500">
          No users found.
        </td>
      </tr>
    </tbody>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Search Users
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            placeholder="Search by name or email"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Plan
            </label>
            <select
              className="input-field"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Status
            </label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Actions
            </label>
            <button
              className="btn-secondary w-full"
              onClick={() => fetchUsers(1)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-secondary-200 rounded-lg">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                History
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          {loading ? (
            renderSkeletonRows()
          ) : users.length === 0 ? (
            renderEmptyState()
          ) : (
            <tbody className="bg-white divide-y divide-secondary-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-secondary-900">{user.name}</div>
                    <div className="text-xs text-secondary-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">{renderPlanBadge(user.subscription_plan)}</td>
                  <td className="px-4 py-3">{renderStatusBadge(user.subscription_status)}</td>
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {user.subscription_period
                      ? user.subscription_period.charAt(0).toUpperCase() + user.subscription_period.slice(1)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-600">
                    {formatDisplayDate(user.subscription_expires_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.history && user.history.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openHistoryModal(user)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        View All
                      </button>
                    ) : (
                      <span className="text-secondary-400 text-xs">No history</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openManageModal(user)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => handleExpire(user.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Expire
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-secondary-500">
          Showing {(pagination.page - 1) * pagination.per_page + 1}-
          {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} users
        </p>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg border border-secondary-200 text-sm text-secondary-600 hover:bg-secondary-100 disabled:opacity-50"
            disabled={pagination.page === 1 || loading}
            onClick={() => fetchUsers(pagination.page - 1)}
          >
            Previous
          </button>

          {pageRange.map((page) => (
            <button
              key={page}
              className={`px-3 py-2 rounded-lg border text-sm ${
                pagination.page === page
                  ? 'border-primary-500 text-primary-600 bg-primary-50'
                  : 'border-secondary-200 text-secondary-600 hover:bg-secondary-100'
              }`}
              disabled={loading}
              onClick={() => fetchUsers(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="px-3 py-2 rounded-lg border border-secondary-200 text-sm text-secondary-600 hover:bg-secondary-100 disabled:opacity-50"
            disabled={pagination.page >= pagination.total_pages || loading}
            onClick={() => fetchUsers(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {manageModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Manage Subscription
            </h3>
            <form className="space-y-4" onSubmit={handleManageSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Plan</label>
                  <select
                    className="input-field"
                    value={manageForm.plan}
                    onChange={(e) => handlePlanChange(e.target.value as SubscriptionPlan)}
                    disabled={saving}
                  >
                    <option value="free">Free</option>
                    <option value="trial">Trial</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
                  <select
                    className="input-field"
                    value={manageForm.status}
                    onChange={(e) => handleStatusChange(e.target.value as SubscriptionStatus)}
                    disabled={saving}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Billing Period</label>
                  <select
                    className="input-field"
                    value={manageForm.period}
                    onChange={(e) => handlePeriodChange(e.target.value as SubscriptionPeriod)}
                    disabled={saving || PLAN_PERIOD_OPTIONS[manageForm.plan].length === 0}
                  >
                    {PLAN_PERIOD_OPTIONS[manageForm.plan].length === 0 ? (
                      <option value="">Not applicable</option>
                    ) : (
                      PLAN_PERIOD_OPTIONS[manageForm.plan].map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Expiry Date</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={manageForm.expires_at}
                    onChange={(e) => setManageForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                    disabled={saving || manageForm.plan === 'free'}
                  />
                  {manageForm.plan !== 'free' && (
                    <p className="text-xs text-secondary-500 mt-1">
                      Changing plan or period recalculates this automatically, but you can adjust it manually.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary px-4 py-2"
                  onClick={closeManageModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Subscription History — {historyModalUser.name}
              </h3>
              <button
                onClick={closeHistoryModal}
                className="btn-secondary px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto pr-2">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Expires At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                      Changed By
                    </th>
                  </tr>
                </thead>
                {historyLoading ? (
                  <tbody className="bg-white divide-y divide-secondary-100">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="h-3.5 bg-secondary-200 rounded w-32 animate-pulse" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-secondary-200 rounded-full w-20 animate-pulse" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-secondary-200 rounded-full w-16 animate-pulse" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-secondary-200 rounded w-28 animate-pulse" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-secondary-200 rounded w-28 animate-pulse" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ) : historyEntries.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-secondary-500">
                        No history found for this user.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="bg-white divide-y divide-secondary-100">
                    {historyEntries.map((entry, index) => (
                      <tr key={`${entry.changed_at}-${index}`}>
                        <td className="px-4 py-3 text-sm text-secondary-600">
                          {formatDisplayDate(entry.changed_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-600 capitalize">
                          {entry.new_plan}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-600 capitalize">
                          {entry.status}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-600">
                          {formatDisplayDate(entry.expires_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-secondary-500">
                          {entry.changed_by ?? 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;

