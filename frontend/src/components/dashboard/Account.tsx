import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
// import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { 
  Mail, 
  Calendar, 
  CreditCard, 
  Trash2, 
  AlertTriangle,
  Save
} from 'lucide-react';

interface AccountData {
  id: number;
  name: string;
  email: string;
  subscription_plan: string;
  created_at: string;
}

const Account: React.FC = () => {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AccountData>();

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const response = await api.get('/account');
      if (response.data.success) {
        const accountData = response.data.account;
        setAccount(accountData);
        setValue('name', accountData.name);
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AccountData) => {
    setSaving(true);
    try {
      const response = await api.put('/account', {
        name: data.name
      });

      if (response.data.success) {
        await fetchAccount();
        alert('Account updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update account:', error);
      alert('Failed to update account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }

    try {
      const response = await api.delete('/account', {
        data: { password: deletePassword }
      });

      if (response.data.success) {
        alert('Account deleted successfully');
        window.location.href = '/';
      }
    } catch (error: any) {
      setDeleteError(error.response?.data?.message || 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Account Settings</h1>
        <p className="text-secondary-600">
          Manage your account information and subscription
        </p>
      </div>

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Personal Information</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                Full Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                id="name"
                className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-900">{account?.email}</span>
                <span className="text-sm text-secondary-500">(Cannot be changed)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Member Since
              </label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-secondary-400" />
                <span className="text-secondary-900">
                  {account?.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Subscription */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Subscription</h2>
          
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="font-medium text-secondary-900 capitalize">
                  {account?.subscription_plan} Plan
                </h3>
                <p className="text-sm text-secondary-600">
                  {account?.subscription_plan === 'free' 
                    ? 'Basic features included' 
                    : 'All premium features included'
                  }
                </p>
              </div>
            </div>
            <button className="btn-secondary">
              {account?.subscription_plan === 'free' ? 'Upgrade' : 'Manage'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <h2 className="text-xl font-semibold text-red-600 mb-6">Danger Zone</h2>
          
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                  This will permanently delete your profile, links, and all associated data.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2 inline" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-secondary-600 mb-4">
              This action cannot be undone. Please enter your password to confirm.
            </p>
            
            <div className="mb-4">
              <label htmlFor="delete-password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="delete-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
              />
              {deleteError && (
                <p className="mt-1 text-sm text-red-600">{deleteError}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
