import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type {
  AdminUser,
  AdminUserListParams,
  AdminUserDetailResponse,
} from '../../services/admin';
import {
  getUsers,
  getUser,
  updateUserStatus,
  deleteUser,
} from '../../services/admin';

type FilterOption<T extends string> = T | 'all';

interface PaginationState {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface ConfirmState {
  open: boolean;
  action: 'disable' | 'enable' | 'delete';
  user: AdminUser | null;
  loading: boolean;
}

const defaultPagination: PaginationState = {
  page: 1,
  per_page: 10,
  total: 0,
  total_pages: 1,
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterOption<'active' | 'disabled'>>('all');
  const [planFilter, setPlanFilter] = useState<FilterOption<'free' | 'basic' | 'premium'>>('all');
  const [roleFilter, setRoleFilter] = useState<FilterOption<'user' | 'admin'>>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<AdminUserDetailResponse['user'] | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    action: 'disable',
    user: null,
    loading: false,
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: AdminUserListParams = {
        page,
        per_page: pagination.per_page,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (planFilter !== 'all') {
        params.plan = planFilter;
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      const response = await getUsers(params);

      if (!response.data.success) {
        throw new Error('Failed to load users');
      }

      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to fetch users');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, planFilter, roleFilter, pagination.per_page]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const openDetail = async (userId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const response = await getUser(userId);
      if (!response.data.success) {
        throw new Error('Unable to load user details');
      }
      setSelectedDetail(response.data.user);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch user details');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedDetail(null);
  };

  const openConfirm = (action: ConfirmState['action'], user: AdminUser) => {
    setConfirmState({
      open: true,
      action,
      user,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.user) return;
    setConfirmState((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmState.action === 'delete') {
        await deleteUser(confirmState.user.id);
        toast.success('User deleted');
      } else {
        const newStatus = confirmState.action === 'disable' ? 'disabled' : 'active';
        await updateUserStatus(confirmState.user.id, { status: newStatus });
        toast.success(`User ${newStatus === 'disabled' ? 'disabled' : 're-enabled'}`);
      }
      setConfirmState({ open: false, action: 'disable', user: null, loading: false });
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };

  const pageRange = Array.from({ length: pagination.total_pages }, (_, i) => i + 1).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Search Users
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email"
            className="w-full input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Status
            </label>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterOption<'active' | 'disabled'>)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Plan
            </label>
            <select
              className="input-field"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as FilterOption<'free' | 'basic' | 'premium'>)}
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
              Role
            </label>
            <select
              className="input-field"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as FilterOption<'user' | 'admin'>)}
            >
              <option value="all">All</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-secondary-200 rounded-lg">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-secondary-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-secondary-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">{userItem.name}</div>
                    <div className="text-xs text-secondary-500">ID: {userItem.id}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">
                    {userItem.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        userItem.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-secondary-100 text-secondary-700'
                      }`}
                    >
                      {userItem.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm capitalize text-secondary-700">
                    {userItem.subscription_plan}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        userItem.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {userItem.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDetail(userItem.id)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          openConfirm(userItem.status === 'active' ? 'disable' : 'enable', userItem)
                        }
                        className="text-secondary-600 hover:text-secondary-900 text-sm font-medium"
                      >
                        {userItem.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => openConfirm('delete', userItem)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
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
              onClick={() => fetchUsers(page)}
              disabled={loading}
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

      {/* Detail Drawer */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-40" onClick={closeDetail} />
          <div className="w-full max-w-md bg-white shadow-xl h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">User Details</h3>
              <button
                onClick={closeDetail}
                className="text-secondary-500 hover:text-secondary-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            {detailLoading || !selectedDetail ? (
              <div className="py-10 text-center text-secondary-500">Loading details...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm font-medium text-secondary-900">{selectedDetail.name}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm text-secondary-700">{selectedDetail.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wide">Role</p>
                    <p className="text-sm text-secondary-700 capitalize">{selectedDetail.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wide">Account Status</p>
                    <p className="text-sm text-secondary-700 capitalize">{selectedDetail.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wide">Plan</p>
                    <p className="text-sm text-secondary-700 capitalize">{selectedDetail.subscription_plan}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary-500 uppercase tracking-wide">Subscription Status</p>
                    <p className="text-sm text-secondary-700 capitalize">
                      {selectedDetail.subscription_status}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wide">Subscription Period</p>
                  <p className="text-sm text-secondary-700">
                    {selectedDetail.subscription_period ? selectedDetail.subscription_period : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500 uppercase tracking-wide">Subscription Expires At</p>
                  <p className="text-sm text-secondary-700">
                    {selectedDetail.subscription_expires_at
                      ? new Date(selectedDetail.subscription_expires_at).toLocaleString()
                      : '—'}
                  </p>
                </div>

                {selectedDetail.profile && (
                  <div className="border-t border-secondary-200 pt-4">
                    <p className="text-xs text-secondary-500 uppercase tracking-wide mb-2">Profile</p>
                    <dl className="grid grid-cols-1 gap-2 text-sm text-secondary-700">
                      {Object.entries(selectedDetail.profile).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4">
                          <dt className="font-medium capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-right text-secondary-600 break-words">
                            {value === null || value === '' ? '—' : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState.open && confirmState.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {confirmState.action === 'delete'
                ? 'Delete User'
                : confirmState.action === 'disable'
                ? 'Disable User'
                : 'Enable User'}
            </h3>
            <p className="text-sm text-secondary-600 mb-4">
              {confirmState.action === 'delete'
                ? `Are you sure you want to permanently delete ${confirmState.user.name}? This action cannot be undone.`
                : confirmState.action === 'disable'
                ? `This will prevent ${confirmState.user.name} from accessing their account until re-enabled. Continue?`
                : `Re-enable ${confirmState.user.name}'s account so they can log back in.`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmState({ open: false, action: 'disable', user: null, loading: false })
                }
                className="btn-secondary px-4 py-2 text-sm"
                disabled={confirmState.loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  confirmState.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                } ${confirmState.loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={confirmState.loading}
              >
                {confirmState.loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

