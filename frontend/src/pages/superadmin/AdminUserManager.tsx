import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createOrPromoteAdmin,
  createUserAccount,
  fetchSuperAdminUsers,
  updateSuperAdminUserStatus,
  type SuperAdminUser,
  type SuperAdminUserResponse,
  type SuperAdminUserListParams,
} from '../../services/superadmin';

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

const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(defaultPagination);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'super_admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params: SuperAdminUserListParams = {
          page,
          per_page: pagination.per_page,
          search: searchTerm.trim(),
        };
        if (roleFilter !== 'all') {
          params.role = roleFilter;
        }
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await fetchSuperAdminUsers(params);
        const data: SuperAdminUserResponse = response.data;
        if (!data.success) {
          throw new Error('Failed to fetch users');
        }

        setUsers(data.data);
        setPagination(data.pagination);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Unable to fetch users');
      } finally {
        setLoading(false);
      }
    },
    [pagination.per_page, searchTerm, roleFilter, statusFilter],
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleCreateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingAdmin(true);
    try {
      await createOrPromoteAdmin(createAdminForm);
      toast.success('Admin created successfully');
      setCreateAdminForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = createUserForm.name.trim();
    const email = createUserForm.email.trim();
    const password = createUserForm.password;

    if (!name || !email || !password) {
      toast.error('Please fill in all user details.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setCreatingUser(true);
    try {
      await createUserAccount({ name, email, password });
      toast.success('User created successfully!');
      setCreateUserForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to create user. Please check input or email duplication.',
      );
    } finally {
      setCreatingUser(false);
    }
  };

  const handlePromote = async (userId: number) => {
    try {
      await createOrPromoteAdmin({ user_id: userId });
      toast.success('User promoted to admin');
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    }
  };

  const handleUpdateStatus = async (userId: number, payload: { status?: 'active' | 'disabled'; role?: 'user' | 'admin' | 'super_admin' }) => {
    try {
      await updateSuperAdminUserStatus(userId, payload);
      toast.success('User updated');
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const pageRange = Array.from({ length: pagination.total_pages }, (_, index) => index + 1).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-secondary-200 rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900 mb-3">Create Admin Account</h2>
          <form className="space-y-4" onSubmit={handleCreateAdmin}>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
              <input
                type="text"
                className="input-field"
                value={createAdminForm.name}
                onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={createAdminForm.email}
                onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Password</label>
              <input
                type="password"
                className="input-field"
                value={createAdminForm.password}
                onChange={(e) => setCreateAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Temporary password"
                minLength={8}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-6 py-2" disabled={creatingAdmin}>
                {creatingAdmin ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </div>

        <div className="border border-secondary-200 rounded-lg p-5 bg-white">
          <h2 className="text-lg font-semibold text-secondary-900 mb-3">Create User Account</h2>
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
              <input
                type="text"
                className="input-field"
                value={createUserForm.name}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Temporary Password</label>
              <input
                type="password"
                className="input-field"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-6 py-2" disabled={creatingUser}>
                {creatingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="border border-secondary-200 rounded-lg p-5 bg-white">
        <div className="space-y-2 mb-4">
          <h2 className="text-lg font-semibold text-secondary-900">Manage Existing Accounts</h2>
          <p className="text-sm text-secondary-600">
            Search for users, promote them to admins, or toggle their access as needed.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Search Users
            </label>
            <input
              type="search"
              className="input-field"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div>
              <label className="block text-xs font-medium text-secondary-500 uppercase tracking-wide mb-1">
                Role
              </label>
              <select
                className="input-field"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              >
                <option value="all">All</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
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
                <option value="disabled">Disabled</option>
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-secondary-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-secondary-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{userItem.name}</div>
                      <div className="text-xs text-secondary-500">{userItem.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          userItem.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-700'
                            : userItem.role === 'admin'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-secondary-100 text-secondary-700'
                        }`}
                      >
                        {userItem.role.replace('_', ' ')}
                      </span>
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm capitalize text-secondary-700">
                      {userItem.subscription_plan}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        {userItem.role === 'user' && (
                          <button
                            onClick={() => handlePromote(userItem.id)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Promote to Admin
                          </button>
                        )}
                        {userItem.role === 'admin' && (
                          <button
                            onClick={() => handleUpdateStatus(userItem.id, { role: 'user' })}
                            className="text-secondary-600 hover:text-secondary-900 font-medium"
                          >
                            Demote to User
                          </button>
                        )}
                        {userItem.role !== 'super_admin' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(userItem.id, {
                                status: userItem.status === 'active' ? 'disabled' : 'active',
                              })
                            }
                            className="text-amber-600 hover:text-amber-700 font-medium"
                          >
                            {userItem.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
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
      </div>
    </div>
  );
};

export default AdminUserManager;

