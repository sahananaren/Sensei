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
  incrementVisionCount: () => void;
  checkUpgradeRequired: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isUpgradeVisible, setIsUpgradeVisible] = useState(false);
  const [visionCount, setVisionCount] = useState(0);

  const showUpgrade = () => setIsUpgradeVisible(true);
  const hideUpgrade = () => setIsUpgradeVisible(false);
  
  const handleUpgrade = (plan: string) => {
    console.log('Selected plan:', plan);
    hideUpgrade();
  };

  const incrementVisionCount = () => {
    setVisionCount(prev => prev + 1);
  };

  // For testing purposes, set isPro to true to allow 4 visions
  // In production, this would come from actual subscription data
  const isPro = true; // Set to true for testing 4 vision limit
  const maxVisions = isPro ? 4 : 1;

  const checkUpgradeRequired = () => {
    return visionCount >= maxVisions;
  };

  const subscription = {
    isPro,
    visionCount,
    maxVisions,
  };

  const value = {
    isUpgradeVisible,
    showUpgrade,
    hideUpgrade,
    handleUpgrade,
    subscription,
    incrementVisionCount,
    checkUpgradeRequired,
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