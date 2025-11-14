import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  Mail,
  Calendar,
  Trash2,
  AlertTriangle,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfig } from '../../contexts/ConfigContext';
import { PLAN_FEATURES, PLAN_LABELS, FEATURE_LABELS } from '../../constants/subscriptions';
import type { SubscriptionPlan, SubscriptionPeriod } from '../../services/subscriptions';

interface AccountData {
  id: number;
  name: string;
  email: string;
  subscription_plan: SubscriptionPlan;
  created_at: string;
}

const Account: React.FC = () => {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<Record<SubscriptionPlan, SubscriptionPeriod>>({
    free: 'monthly',
    basic: 'monthly',
    premium: 'monthly',
    trial: 'trial',
  });
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { pricing, loading: pricingLoading } = useConfig();
  const { subscription, refreshSubscription } = useAuth();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AccountData>();

  useEffect(() => {
    fetchAccount();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      setRazorpayLoaded(false);
      toast.error('Failed to load payment gateway. Please refresh and try again.');
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
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

  const formatPrice = (plan: SubscriptionPlan, period: 'monthly' | 'yearly') => {
    if (plan === 'trial') {
      return 'Included';
    }
    if (plan === 'free') {
      return period === 'monthly' ? '₹0/month' : '₹0/year';
    }
    const amount =
      plan === 'basic' || plan === 'premium'
        ? pricing?.[plan]?.[period]
        : undefined;
    if (amount === undefined || amount === null) {
      return '—';
    }
    return `₹${amount}/${period === 'monthly' ? 'month' : 'year'}`;
  };

  const handleCheckout = async (planId: Extract<SubscriptionPlan, 'basic' | 'premium'>) => {
    if (processingPlan) return;
    if (!razorpayLoaded) {
      toast.error('Payment gateway unavailable. Please try again later.');
      return;
    }
    if (!pricing) {
      toast.error('Pricing information unavailable. Please try again later.');
      setProcessingPlan(null);
      return;
    }
    const period = (selectedPeriods[planId] as Extract<SubscriptionPeriod, 'monthly' | 'yearly'>) ?? 'monthly';
    setProcessingPlan(`${planId}-${period}`);
    try {
      const { data } = await api.post('/payments/create-order', {
        plan: planId,
        period
      });

      if (!data?.success) {
        throw new Error(data?.message || 'Unable to initiate payment');
      }

      // Store order ID for verification
      const orderId = data.order.id;

      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Linksphere',
        description: `${PLAN_LABELS[planId]} plan (${period})`,
        order_id: orderId,
        prefill: {
          name: account?.name,
          email: account?.email
        },
        theme: {
          color: '#4f46e5'
        },
        handler: async (response: any) => {
          try {
            // Extract payment ID (required)
            // Backend will fetch order_id and generate signature if missing
            const verificationData: any = {
              razorpay_payment_id: response.razorpay_payment_id || response.payment_id
            };

            // Add order_id if available (from response or stored)
            if (response.razorpay_order_id || response.order_id) {
              verificationData.razorpay_order_id = response.razorpay_order_id || response.order_id;
            } else if (orderId) {
              verificationData.razorpay_order_id = orderId;
            }

            // Add signature if available
            if (response.razorpay_signature || response.signature) {
              verificationData.razorpay_signature = response.razorpay_signature || response.signature;
            }

            // Validate that payment_id is present (minimum requirement)
            if (!verificationData.razorpay_payment_id) {
              console.error('Missing payment ID. Original response:', response);
              toast.error('Payment verification failed: Missing payment ID. Please contact support.');
              return;
            }

            await api.post('/payments/verify', verificationData);
            toast.success('Your subscription has been upgraded!');
            setLoading(true);
            await fetchAccount();
            await refreshSubscription();
          } catch (verifyError: any) {
            const message = verifyError?.response?.data?.message || 'Payment verification failed. Please contact support.';
            toast.error(message);
          } finally {
            setProcessingPlan(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (failure: any) => {
        toast.error(failure?.error?.description || 'Payment failed. Please try again.');
        setProcessingPlan(null);
      });
      rzp.open();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to initiate payment. Please try again.';
      toast.error(message);
      setProcessingPlan(null);
    }
  };

  const rawPlan: SubscriptionPlan = subscription?.plan ?? account?.subscription_plan ?? 'free';
  const activeStatus = subscription?.status ?? 'active';
  const activePlan: SubscriptionPlan = rawPlan !== 'free' && activeStatus !== 'active' ? 'free' : rawPlan;
  const remainingDays = subscription?.remaining_days ?? null;
  const expiresAt = subscription?.expires_at ?? null;
  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const planOrder: SubscriptionPlan[] = ['trial', 'free', 'basic', 'premium'];
  const allFeatures = useMemo(() => Object.keys(FEATURE_LABELS), []);
  const upcomingExpiry = activeStatus === 'active' && remainingDays !== null && remainingDays <= 3;
  const downgradeNotice = activeStatus !== 'active' && rawPlan !== 'free';
  const getPlanDescription = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'trial':
        return 'Full access to every feature for your first 15 days.';
      case 'free':
        return 'Stay visible online with basic profile and public page access.';
      case 'basic':
        return 'Unlock social and custom links to grow your presence.';
      case 'premium':
        return 'Everything in Basic plus payment integrations.';
      default:
        return '';
    }
  };

  const getPlanPricingDetails = (plan: SubscriptionPlan) => {
    if (plan === 'trial') {
      return { primary: 'Included for 15 days', secondary: 'Auto-activated on first login' };
    }
    if (plan === 'free') {
      return { primary: '₹0', secondary: 'Limited access mode' };
    }
    const monthly = formatPrice(plan, 'monthly');
    const yearly = formatPrice(plan, 'yearly');
    return {
      primary: monthly,
      secondary: `or ${yearly}`,
    };
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
                className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Subscription */}
        {downgradeNotice && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Your subscription expired</p>
              <p className="text-sm">
                You have been downgraded to the Free plan. Upgrade to regain premium features.
              </p>
            </div>
          </div>
        )}
        {upcomingExpiry && !downgradeNotice && (
          <div className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-primary-800">
            <AlertCircle className="h-5 w-5 mt-0.5 text-primary-600" />
            <div>
              <p className="font-semibold">Plan renews soon</p>
              <p className="text-sm">
                {remainingDays === 0 ? 'Expires today.' : `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}.`}
              </p>
            </div>
          </div>
        )}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
              <p className="text-sm text-gray-500">
                Review what each plan unlocks and upgrade when you need more.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <div className="font-semibold text-gray-900">
                Current Plan: {PLAN_LABELS[activePlan]}
              </div>
              {activeStatus === 'active' && formattedExpiry && (
                <p className="text-xs text-gray-400 mt-1">Expires on {formattedExpiry}</p>
              )}
              {activeStatus === 'expired' && (
                <p className="text-xs text-red-500 mt-1">
                  Last expired {formattedExpiry ? `on ${formattedExpiry}` : 'recently'}
                </p>
              )}
              {activeStatus === 'paused' && (
                <p className="text-xs text-amber-600 mt-1">
                  Subscription paused by an administrator.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {planOrder.map((planId) => {
              const features = PLAN_FEATURES[planId];
              const included = new Set(features);
              const pricingInfo = getPlanPricingDetails(planId);
              const description = getPlanDescription(planId);
              const isSelectable = planId === 'basic' || planId === 'premium';
              const currentPeriod = isSelectable
                ? (selectedPeriods[planId] as Extract<SubscriptionPeriod, 'monthly' | 'yearly'>)
                : null;
              const isActivePlan = activePlan === planId && activeStatus === 'active';
              const isExpiredPlan = activePlan === planId && activeStatus === 'expired';
              const isProcessing = isSelectable && currentPeriod
                ? processingPlan === `${planId}-${currentPeriod}`
                : false;
              let badgeText: string | null = null;
              if (isActivePlan) {
                badgeText = 'Current Plan';
              } else if (isExpiredPlan) {
                badgeText = 'Expired';
              } else if (planId === 'free' && downgradeNotice) {
                badgeText = activeStatus === 'paused' ? 'Paused' : 'Downgraded';
              } else if (planId === 'trial' && activePlan !== 'trial') {
                badgeText = 'Available';
              }

              const cardBorderClass = isExpiredPlan
                ? 'border border-amber-400'
                : isActivePlan
                  ? 'border-2 border-blue-500 shadow-md'
                  : 'border border-gray-200';

              const buttonDisabled = isSelectable
                ? isActivePlan || isProcessing || !!processingPlan || pricingLoading || !pricing
                : true;

              const helperText = !isSelectable
                ? planId === 'trial'
                  ? activePlan === 'trial' && activeStatus === 'active'
                    ? remainingDays !== null
                      ? `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
                      : 'Trial active'
                    : 'Included automatically for new users.'
                  : planId === 'free'
                    ? downgradeNotice
                      ? activeStatus === 'paused'
                        ? 'Access limited while your previous plan is paused.'
                        : 'Downgraded after your previous plan expired.'
                      : 'Limited access to core profile features.'
                    : null
                : null;

              return (
                <div
                  key={planId}
                  className={`rounded-2xl bg-white shadow-sm p-4 sm:p-6 h-full flex flex-col justify-between ${cardBorderClass}`}
                >
                  <div className="space-y-3 text-center md:text-left">
                    {badgeText && (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mx-auto md:mx-0 ${
                          isActivePlan
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {badgeText}
                      </span>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {PLAN_LABELS[planId]} Plan
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{description}</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{pricingInfo.primary}</div>
                      {pricingInfo.secondary && (
                        <div className="text-xs text-gray-400 mt-1">{pricingInfo.secondary}</div>
                      )}
                      {isActivePlan && remainingDays !== null && (
                        <div className="text-xs text-blue-600 mt-1">
                          {remainingDays === 0
                            ? 'Expires today'
                            : `Expires in ${remainingDays} day${remainingDays === 1 ? '' : 's'}`}
                        </div>
                      )}
                      {isExpiredPlan && (
                        <div className="text-xs text-red-500 mt-1">
                          Plan expired
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {allFeatures.map((feature) => {
                        const enabled = included.has(feature);
                        const isPublicProfile = feature === 'public_profile';
                        const textClass = enabled
                          ? 'text-gray-800'
                          : isPublicProfile
                            ? 'text-gray-800'
                            : 'text-gray-400 line-through';
                        return (
                          <div key={feature} className="flex items-center gap-2">
                            {enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm ${textClass}`}
                            >
                              {FEATURE_LABELS[feature] ?? feature}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3 mt-6">
                    {isSelectable ? (
                      <>
                        <div className="text-left">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Billing Period
                          </label>
                          <select
                            className="input-field"
                            value={currentPeriod ?? 'monthly'}
                            onChange={(e) =>
                              setSelectedPeriods((prev) => ({
                                ...prev,
                                [planId]: e.target.value as Extract<SubscriptionPeriod, 'monthly' | 'yearly'>,
                              }))
                            }
                            disabled={!!processingPlan}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                        <button
                          className={`rounded-lg py-2 w-full font-medium transition ${
                            isActivePlan
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } ${isProcessing ? 'opacity-75 cursor-wait' : ''}`}
                          disabled={buttonDisabled}
                          onClick={() => handleCheckout(planId)}
                        >
                          {isActivePlan
                            ? 'Current Plan'
                            : isProcessing
                              ? 'Processing...'
                              : `Upgrade to ${PLAN_LABELS[planId]}`}
                        </button>
                      </>
                    ) : (
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                        {helperText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
