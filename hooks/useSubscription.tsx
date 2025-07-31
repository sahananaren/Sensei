import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubscriptionContextType {
  isUpgradeVisible: boolean;
  showUpgrade: () => void;
  hideUpgrade: () => void;
  handleUpgrade: (plan: string) => void;
  subscription: {
    isPro: boolean;
    visionCount: number;
    maxVisions: number;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isUpgradeVisible, setIsUpgradeVisible] = useState(false);

  const showUpgrade = () => setIsUpgradeVisible(true);
  const hideUpgrade = () => setIsUpgradeVisible(false);
  
  const handleUpgrade = (plan: string) => {
    console.log('Selected plan:', plan);
    hideUpgrade();
  };

  const subscription = {
    isPro: false, // Default to free plan
    visionCount: 0,
    maxVisions: 3, // Free plan limit
  };

  const value = {
    isUpgradeVisible,
    showUpgrade,
    hideUpgrade,
    handleUpgrade,
    subscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}