import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { RevenueCatService, SubscriptionPlan } from '@/lib/revenueCat';
import { useAuth } from '@/hooks/useAuth';
import { CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/lib/supabase';

interface SubscriptionContextType {
  isUpgradeVisible: boolean;
  showUpgrade: () => void;
  hideUpgrade: () => void;
  handleUpgrade: (planId: string) => Promise<void>;
  subscription: {
    isPro: boolean;
    visionCount: number;
    maxVisions: number;
    nextBillingDate?: string;
    planType?: string;
  };
  incrementVisionCount: () => void;
  checkUpgradeRequired: () => boolean;
  subscriptionPlans: SubscriptionPlan[];
  loading: boolean;
  restorePurchases: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { user } = useAuth();
  const [isUpgradeVisible, setIsUpgradeVisible] = useState(false);
  const [visionCount, setVisionCount] = useState(0);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Load subscription plans
  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  // Load customer info when user changes
  useEffect(() => {
    if (user) {
      loadCustomerInfo();
      loadVisionCount(); // Add this line
    }
  }, [user]);

  // Add this function to load actual vision count from database
  const loadVisionCount = async () => {
    try {
      if (!user?.id) return;
      
      const { data: visions, error } = await supabase
        .from('visions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) {
        console.error('Error loading vision count:', error);
        return;
      }
      
      setVisionCount(visions?.length || 0);
    } catch (error) {
      console.error('Error loading vision count:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      console.log('🔄 Starting to load subscription plans from RevenueCat...');
      setLoading(true);
      
      const plans = await RevenueCatService.getOfferings();
      console.log('✅ RevenueCat plans loaded successfully:', {
        count: plans.length,
        plans: plans.map(p => ({ id: p.id, title: p.title, price: p.price }))
      });
      
      setSubscriptionPlans(plans);
    } catch (error: any) {
      console.error('❌ CRITICAL: RevenueCat failed to load plans:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerInfo = async () => {
    try {
      const info = await RevenueCatService.getCustomerInfo();
      setCustomerInfo(info);
      
      // Identify user with RevenueCat
      if (user?.id) {
        await RevenueCatService.identifyUser(user.id);
      }
    } catch (error) {
      console.error('Error loading customer info:', error);
    }
  };

  const showUpgrade = () => setIsUpgradeVisible(true);
  const hideUpgrade = () => setIsUpgradeVisible(false);
  
  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      const selectedPlan = subscriptionPlans.find(plan => plan.id === planId);
      
      if (!selectedPlan) {
        throw new Error('Selected plan not found');
      }

      const customerInfo = await RevenueCatService.purchasePackage(selectedPlan.package);
      setCustomerInfo(customerInfo);
      
      Alert.alert('Success', 'Welcome to Sensei Pro!');
      hideUpgrade();
    } catch (error: any) {
      console.error('Error during purchase:', error);
      
      if (error.userCancelled) {
        // User cancelled the purchase
        return;
      }
      
      Alert.alert('Error', error.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setLoading(true);
      const customerInfo = await RevenueCatService.restorePurchases();
      setCustomerInfo(customerInfo);
      
      if (customerInfo.entitlements.active['pro']) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
      }
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      await RevenueCatService.cancelSubscription();
      Alert.alert(
        'Cancel Subscription',
        'To cancel your subscription, please go to your device settings:\n\n' +
        'Google Play Store > Account > Subscriptions'
      );
    } catch (error: any) {
      console.error('Error handling subscription cancellation:', error);
      Alert.alert('Error', 'Failed to process cancellation request.');
    }
  };

  const incrementVisionCount = () => {
    setVisionCount(prev => prev + 1);
  };

  // COMMENTED OUT: Check if user has active pro subscription
  // const isPro = customerInfo?.entitlements.active['pro'] !== undefined;
  // const maxVisions = isPro ? 4 : 1;
  
  // TEMPORARILY REMOVED LIMITS: All users can create 4 visions
  const isPro = true; // Temporarily set all users as pro
  const maxVisions = 4; // All users get 4 visions

  // Get next billing date
  const nextBillingDate = customerInfo?.entitlements.active['pro']?.expirationDate;

  const checkUpgradeRequired = () => {
    // COMMENTED OUT: Vision limit check
    // return visionCount >= maxVisions;
    return false; // No limits for now
  };

  const subscription = {
    isPro,
    visionCount,
    maxVisions,
    nextBillingDate: nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : undefined,
    planType: customerInfo?.entitlements.active['pro']?.productIdentifier,
  };

  const value = {
    isUpgradeVisible,
    showUpgrade,
    hideUpgrade,
    handleUpgrade,
    subscription,
    incrementVisionCount,
    checkUpgradeRequired,
    subscriptionPlans,
    loading,
    restorePurchases,
    cancelSubscription,
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