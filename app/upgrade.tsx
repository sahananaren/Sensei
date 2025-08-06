import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionPlan } from '@/lib/revenueCat';

interface UpgradeScreenProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

export default function UpgradeScreen({ visible, onClose, onSelectPlan }: UpgradeScreenProps) {
  const { subscriptionPlans, loading, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Set default selection when plans load
  React.useEffect(() => {
    if (subscriptionPlans.length > 0 && !selectedPlan) {
      // Default to yearly if available, otherwise monthly
      const yearlyPlan = subscriptionPlans.find(plan => plan.title === 'Annual');
      const monthlyPlan = subscriptionPlans.find(plan => plan.title === 'Monthly');
      setSelectedPlan(yearlyPlan?.id || monthlyPlan?.id || subscriptionPlans[0].id);
    }
  }, [subscriptionPlans]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
    } catch (error) {
      console.error('Error restoring purchases:', error);
    }
  };

  if (loading && subscriptionPlans.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#329BA4" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#A7A7A7" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Sensei Pro</Text>
            <Text style={styles.subtitle}>Create up to 4 visions with pro</Text>

            {/* Subscription Options */}
            <View style={styles.optionsContainer}>
              {subscriptionPlans.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    selectedPlan === option.id && styles.selectedOption,
                  ]}
                  onPress={() => handlePlanSelect(option.id)}
                >
                  {/* Selection Indicator */}
                  <View style={styles.selectionIndicator}>
                    {selectedPlan === option.id ? (
                      <View style={styles.selectedCircle}>
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </View>

                  {/* Option Content */}
                  <View style={styles.optionContent}>
                    <View style={styles.optionHeader}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {option.discount && (
                        <View style={styles.discountTag}>
                          <Text style={styles.discountText}>{option.discount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.optionDuration}>
                      {option.duration} • {option.price}
                    </Text>
                  </View>

                  {/* Price */}
                  <View style={styles.priceContainer}>
                    <Text style={styles.monthlyPrice}>{option.monthlyPrice}</Text>
                    {option.savings && (
                      <Text style={styles.savingsText}>{option.savings}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={[styles.continueButton, !selectedPlan && styles.continueButtonDisabled]} 
              onPress={handleContinue}
              disabled={!selectedPlan || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
              <Text style={styles.restoreButtonText}>Restore purchases</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#111111',
    borderRadius: 16,
    width: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  header: {
    alignItems: 'flex-end',
    padding: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Inter-Regular',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    backgroundColor: '#0A0A0A',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#329BA4',
    backgroundColor: '#0A0A0A',
  },
  selectionIndicator: {
    marginRight: 12,
  },
  selectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#329BA4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    backgroundColor: '#111111',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  discountTag: {
    backgroundColor: '#329BA4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  optionDuration: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  monthlyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#329BA4',
    marginTop: 2,
    fontFamily: 'Inter-Regular',
  },
  continueButton: {
    backgroundColor: '#329BA4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#333333',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  restoreButton: {
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter-Regular',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
}); 