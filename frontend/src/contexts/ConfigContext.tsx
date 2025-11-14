import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface PricingConfig {
  basic: {
    monthly: number;
    yearly: number;
  };
  premium: {
    monthly: number;
    yearly: number;
  };
}

interface ConfigContextValue {
  pricing: PricingConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const useConfig = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config/pricing');
      if (response.data.success) {
        setPricing(response.data.pricing);
      } else {
        throw new Error('Failed to load pricing config');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load subscription pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value: ConfigContextValue = {
    pricing,
    loading,
    refresh: fetchConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};







