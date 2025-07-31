import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SubscriptionOption {
  id: string;
  title: string;
  duration: string;
  price: string;
  monthlyPrice: string;
  discount?: string;
  savings?: string;
}

interface UpgradeScreenProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
}

export default function UpgradeScreen({ visible, onClose, onSelectPlan }: UpgradeScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');

  // Dummy subscription data (will come from RevenueCat)
  const subscriptionOptions: SubscriptionOption[] = [
    {
      id: 'monthly',
      title: 'Monthly',
      duration: '1 mo',
      price: '$9.99',
      monthlyPrice: '$9.99/mo',
    },
    {
      id: 'yearly',
      title: 'Annual',
      duration: '12 mo',
      price: '$69.99',
      monthlyPrice: '$5.83/mo',
      discount: '19% OFF',
      savings: '2 months free',
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    onSelectPlan(selectedPlan);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Sensei Pro</Text>
            <Text style={styles.subtitle}>Create up to 4 visions with pro</Text>

            {/* Subscription Options */}
            <View style={styles.optionsContainer}>
              {subscriptionOptions.map((option) => (
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
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>

            {/* Restore Purchases */}
            <TouchableOpacity style={styles.restoreButton}>
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
    backgroundColor: 'white',
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
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
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
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#329BA4',
    backgroundColor: '#F8FCFC',
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
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
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
    color: '#000',
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
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  optionDuration: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  monthlyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  restoreButton: {
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#329BA4',
    fontFamily: 'Inter-Regular',
  },
}); 