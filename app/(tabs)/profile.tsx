import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { User, Mail, Lock, Crown, LogOut, Trash2, Pencil, Check, X, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder: string;
  icon: React.ReactNode;
  isPassword?: boolean;
  disabled?: boolean;
}

function EditableField({ 
  label, 
  value, 
  onSave, 
  placeholder, 
  icon, 
  isPassword = false,
  disabled = false 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update. Please try again.');
      setEditValue(value); // Reset to original value
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.editContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>{icon}</View>
            <TextInput
              style={styles.textInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={placeholder}
              placeholderTextColor="#666666"
              secureTextEntry={isPassword}
              autoFocus
              editable={!loading}
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.editAction}
              disabled={loading}
              activeOpacity={0.7}
            >
              <X size={16} color="#A7A7A7" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.editAction}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#329BA4" />
              ) : (
                <Check size={16} color="#329BA4" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.fieldDisplay, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setIsEditing(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <View style={styles.fieldContent}>
          <View style={styles.fieldIcon}>{icon}</View>
          <Text style={[styles.fieldValue, disabled && styles.fieldValueDisabled]}>
            {isPassword ? '••••••••' : (value || placeholder)}
          </Text>
        </View>
        {!disabled && <Pencil size={16} color="#A7A7A7" />}
      </TouchableOpacity>
    </View>
  );
}

interface PlanCardProps {
  planType: 'free' | 'trial' | 'pro';
  onUpgrade: () => void;
  onManage: () => void;
}

function PlanCard({ planType, onUpgrade, onManage }: PlanCardProps) {
  const getPlanInfo = () => {
    switch (planType) {
      case 'trial':
        return {
          title: 'Pro Trial',
          subtitle: '12 days remaining',
          color: '#E7975E',
          action: 'Upgrade to Pro',
          onAction: onUpgrade,
        };
      case 'pro':
        return {
          title: 'Pro Plan',
          subtitle: 'Active subscription',
          color: '#329BA4',
          action: 'Manage Plan',
          onAction: onManage,
        };
      default:
        return {
          title: 'Free Plan',
          subtitle: '1 Vision • Basic tracking',
          color: '#A7A7A7',
          action: 'Upgrade to Pro',
          onAction: onUpgrade,
        };
    }
  };

  const planInfo = getPlanInfo();

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <View style={styles.planTitleContainer}>
            <Crown size={20} color={planInfo.color} />
            <Text style={styles.planTitle}>{planInfo.title}</Text>
          </View>
          <Text style={styles.planSubtitle}>{planInfo.subtitle}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.planButton, { backgroundColor: planInfo.color }]}
        onPress={planInfo.onAction}
        activeOpacity={0.8}
      >
        <Text style={styles.planButtonText}>{planInfo.action}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface DeleteAccountModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function DeleteAccountModal({ visible, onCancel, onConfirm, loading }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmValid = confirmText.toLowerCase() === 'delete my account';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalHeader}>
            <AlertTriangle size={24} color="#C04B76" />
            <Text style={styles.deleteModalTitle}>Delete Account</Text>
          </View>
          
          <Text style={styles.deleteModalText}>
            This action cannot be undone. All your visions, habits, and progress will be permanently deleted.
          </Text>
          
          <Text style={styles.deleteModalConfirmLabel}>
            Type "delete my account" to confirm:
          </Text>
          
          <TextInput
            style={styles.deleteModalInput}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="delete my account"
            placeholderTextColor="#666666"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.deleteModalCancelButton}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deleteModalConfirmButton,
                (!isConfirmValid || loading) && styles.deleteModalConfirmButtonDisabled
              ]}
              onPress={onConfirm}
              disabled={!isConfirmValid || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteModalConfirmText}>Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { subscription, showUpgrade, cancelSubscription } = useSubscription();
  
  // Mock plan type - in real app this would come from user data
  const planType: 'free' | 'trial' | 'pro' = 'free';

  const updateName = async (newName: string) => {
    if (!user) return;
    
    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newName }
    });
    
    if (error) throw error;
  };

  const updateEmail = async (newEmail: string) => {
    if (!user) return;
    
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });
    
    if (error) throw error;
    
    Alert.alert(
      'Email Update',
      'Please check your new email address for a confirmation link.'
    );
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return;
    
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    Alert.alert('Success', 'Password updated successfully');
  };

  const handleUpgrade = () => {
    // COMMENTED OUT: Upgrade functionality
    // showUpgrade();
    console.log('Upgrade functionality temporarily disabled');
  };

  const handleManagePlan = async () => {
    // COMMENTED OUT: Manage plan functionality
    // await handleManagePlan();
    console.log('Manage plan functionality temporarily disabled');
  };

  const handleLogOut = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    
    try {
      // Delete user data from our tables first
      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_id: user?.id
      });
      
      if (deleteError) {
        console.error('Error deleting user data:', deleteError);
        // Continue anyway - the user can contact support to delete their auth account
      }
      
      // Note: We can't delete the auth user with anon key
      // The user will need to contact support or delete their account manually
      // For now, we'll just sign them out
      
      // Sign out
      await signOut();
      
      Alert.alert(
        'Account Deleted',
        'Your data has been deleted. Please contact support to completely remove your account.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#329BA4" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const userName = user.user_metadata?.full_name || '';
  const userEmail = user.email || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Settings & account</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <EditableField
            label="Name"
            value={userName}
            onSave={updateName}
            placeholder="Enter your name"
            icon={<User size={20} color="#A7A7A7" />}
          />
          
          <EditableField
            label="Email"
            value={userEmail}
            onSave={updateEmail}
            placeholder="Enter your email"
            icon={<Mail size={20} color="#A7A7A7" />}
          />
          
          <EditableField
            label="Password"
            value="password"
            onSave={updatePassword}
            placeholder="Enter new password"
            icon={<Lock size={20} color="#A7A7A7" />}
            isPassword
          />
        </View>

        {/* COMMENTED OUT: Plan Status */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Status</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionInfo}>
              <Text style={styles.planName}>
                {subscription.isPro ? 'Sensei Pro' : 'Free Plan'}
              </Text>
              <Text style={styles.planDetails}>
                {subscription.visionCount}/{subscription.maxVisions} visions
              </Text>
            </View>
            {subscription.isPro ? (
              <TouchableOpacity style={styles.cancelButton} onPress={() => Alert.alert('Coming Soon', 'Subscription cancellation will be available soon')}>
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.upgradeButton} onPress={showUpgrade}>
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        </View> */}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogOut}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerSectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color="#C04B76" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.dangerWarning}>
            This action cannot be undone. All your data will be permanently deleted.
          </Text>
        </View>
      </ScrollView>

      <DeleteAccountModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  fieldDisplay: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldIcon: {
    marginRight: 12,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
  },
  fieldValueDisabled: {
    color: '#A7A7A7',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#329BA4',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editAction: {
    width: 40,
    height: 40,
    backgroundColor: '#111111',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 20,
  },
  planHeader: {
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  planSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  planButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  actionButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  dangerSection: {
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C04B76',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  dangerButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#C04B76',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C04B76',
    fontFamily: 'Inter',
  },
  dangerWarning: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContainer: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  deleteModalText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    lineHeight: 22,
    marginBottom: 20,
  },
  deleteModalConfirmLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  deleteModalInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#1C1C1C',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#C04B76',
    alignItems: 'center',
  },
  deleteModalConfirmButtonDisabled: {
    backgroundColor: '#333333',
  },
  deleteModalConfirmText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginTop: 16,
  },
  subscriptionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  planDetails: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter-Regular',
  },
  upgradeButton: {
    backgroundColor: '#329BA4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    fontFamily: 'Inter-SemiBold',
  },
});