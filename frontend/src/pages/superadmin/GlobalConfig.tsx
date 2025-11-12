import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchSystemConfig, updateSystemConfig } from '../../services/superadmin';
import { useConfig } from '../../contexts/ConfigContext';

const defaultConfig = {
  pricing_basic_monthly: '',
  pricing_basic_yearly: '',
  pricing_premium_monthly: '',
  pricing_premium_yearly: '',
  support_email: '',
  support_phone: '',
};

const GlobalConfig: React.FC = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refresh: refreshPricing } = useConfig();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetchSystemConfig();
        if (response.data.success) {
          setConfig((prev) => ({
            ...prev,
            ...response.data.config,
          }));
        } else {
          toast.error('Failed to load configuration');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (key: keyof typeof defaultConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSystemConfig(config);
      toast.success('Configuration updated');
      refreshPricing();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-secondary-500">
        Loading configuration...
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section>
        <h2 className="text-lg font-semibold text-secondary-900">Subscription Pricing</h2>
        <p className="text-sm text-secondary-600 mt-1">
          Adjust pricing values that appear across dashboards and invoice estimates.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Basic Plan (Monthly)
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={config.pricing_basic_monthly}
              onChange={(e) => handleInputChange('pricing_basic_monthly', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Basic Plan (Yearly)
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={config.pricing_basic_yearly}
              onChange={(e) => handleInputChange('pricing_basic_yearly', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Premium Plan (Monthly)
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={config.pricing_premium_monthly}
              onChange={(e) => handleInputChange('pricing_premium_monthly', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Premium Plan (Yearly)
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={config.pricing_premium_yearly}
              onChange={(e) => handleInputChange('pricing_premium_yearly', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-secondary-900">Support Contact</h2>
        <p className="text-sm text-secondary-600 mt-1">
          Update the global contact information surfaced in support forms and customer communication.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Support Email
            </label>
            <input
              type="email"
              className="input-field"
              value={config.support_email}
              onChange={(e) => handleInputChange('support_email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Support Phone
            </label>
            <input
              type="text"
              className="input-field"
              value={config.support_phone}
              onChange={(e) => handleInputChange('support_phone', e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary px-6 py-2" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
};

export default GlobalConfig;

