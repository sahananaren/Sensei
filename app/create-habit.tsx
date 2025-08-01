import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { X, ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useVisions } from '@/hooks/useVisions';
import { useVisionsForMastery, VisionWithHabits } from '@/hooks/useVisions';

interface VisionDropdownProps {
  visions: Array<{ id: string; name: string; color: string }>;
  selectedVision: { id: string; name: string; color: string } | null;
  onSelectVision: (vision: { id: string; name: string; color: string }) => void;
}

function VisionDropdown({ visions, selectedVision, onSelectVision }: VisionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>
          {selectedVision ? selectedVision.name : 'Select a vision...'}
        </Text>
        <ChevronDown size={20} color="#A7A7A7" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdownModal}>
            {visions.map((vision) => (
              <TouchableOpacity
                key={vision.id}
                style={styles.dropdownOption}
                onPress={() => {
                  onSelectVision(vision);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.visionColorDot, { backgroundColor: vision.color }]} />
                <Text style={[
                  styles.dropdownOptionText,
                  selectedVision?.id === vision.id && styles.dropdownOptionTextActive
                ]}>
                  {vision.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

interface ExitWarningModalProps {
  visible: boolean;
  onCancel: () => void;
  onExit: () => void;
}

function ExitWarningModal({ visible, onCancel, onExit }: ExitWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.exitModalOverlay}>
        <View style={styles.exitModalContainer}>
          <Text style={styles.exitModalTitle}>Your progress will be lost</Text>
          <Text style={styles.exitModalSubtitle}>
            Are you sure you want to exit? All your progress will be lost.
          </Text>
          
          <View style={styles.exitModalButtons}>
            <TouchableOpacity
              style={styles.exitModalCancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.exitModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.exitModalExitButton}
              onPress={onExit}
              activeOpacity={0.7}
            >
              <Text style={styles.exitModalExitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface LimitWarningModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}

function LimitWarningModal({ visible, title, subtitle, onClose }: LimitWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.limitModalContainer}>
          <Text style={styles.limitModalTitle}>{title}</Text>
          <Text style={styles.limitModalSubtitle}>{subtitle}</Text>
          
          <TouchableOpacity
            style={styles.limitModalButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.limitModalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

interface CongratsModalProps {
  visible: boolean;
  habitName: string;
  onClose: () => void;
}

function CongratsModal({ visible, habitName, onClose }: CongratsModalProps) {
  const handleClose = () => {
    console.log('Congrats modal close button tapped');
    onClose();
  };

  const handleOverlayPress = () => {
    console.log('Congrats modal overlay tapped');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={handleOverlayPress}>
        <View style={styles.congratsContainer}>
          <TouchableOpacity
            style={styles.congratsCloseButton}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#A7A7A7" />
          </TouchableOpacity>
          
          <Text style={styles.congratsTitle}>
            Congrats on creating your new habit '{habitName}'
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function CreateHabitScreen() {
  const { user } = useAuth();
  const { visions, loading: visionsLoading } = useVisions();
  
  const [habitName, setHabitName] = useState('');
  const [selectedVision, setSelectedVision] = useState<{ id: string; name: string; color: string } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const hasFormData = () => {
    return habitName.trim() !== '' || selectedVision !== null;
  };

  const handleClose = () => {
    if (hasFormData()) {
      setShowExitModal(true);
    } else {
      router.back();
    }
  };

  const handleExit = () => {
    setShowExitModal(false);
    router.back();
  };

  const handleCongratsClose = () => {
    setShowCongratsModal(false);
    // Navigate to today page instead of just going back
    router.replace('/(tabs)');
  };

  const canCreateHabit = habitName.trim() !== '' && selectedVision !== null;

  const handleCreateHabit = async () => {
    if (!user || !canCreateHabit) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Check habit limit for the selected vision
    if (selectedVision) {
      const selectedVisionData = visions.find(v => v.id === selectedVision.id);
      if (selectedVisionData && selectedVisionData.habits.length >= 3) {
        setShowLimitModal(true);
        return;
      }
    }

    setIsCreating(true);
    
    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          vision_id: selectedVision!.id,
          name: habitName.trim(),
        });

      if (error) throw error;

      // Show congrats modal instead of navigating back immediately
      setShowCongratsModal(true);
      
    } catch (error) {
      console.error('Error creating habit:', error);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (visionsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Habit</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#329BA4" />
          <Text style={styles.loadingText}>Loading visions...</Text>
        </View>
      </View>
    );
  }

  if (visions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Habit</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No visions found</Text>
          <Text style={styles.errorSubtext}>You need to create a vision first before adding habits.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Habit</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>What habit do you want to add?</Text>
            <TextInput
              style={styles.textInput}
              value={habitName}
              onChangeText={setHabitName}
              placeholder="Practice public speaking..."
              placeholderTextColor="#666666"
              maxLength={200}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>What vision is this related to?</Text>
            <VisionDropdown
              visions={visions}
              selectedVision={selectedVision}
              onSelectVision={setSelectedVision}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.createButton,
            canCreateHabit && !isCreating ? styles.createButtonActive : styles.createButtonInactive
          ]}
          onPress={handleCreateHabit}
          disabled={!canCreateHabit || isCreating}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.createButtonText,
            canCreateHabit && !isCreating ? styles.createButtonTextActive : styles.createButtonTextInactive
          ]}>
            {isCreating ? 'Creating...' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ExitWarningModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onExit={handleExit}
      />
      
      <CongratsModal
        visible={showCongratsModal}
        habitName={habitName}
        onClose={handleCongratsClose}
      />
      
      <LimitWarningModal
        visible={showLimitModal}
        title="Maximum of 3 habits to maintain focus"
        subtitle="Graduate or delete an existing habit to start a new one."
        onClose={() => setShowLimitModal(false)}
      />
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModal: {
    backgroundColor: '#111111',
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 320,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  visionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    flex: 1,
  },
  dropdownOptionTextActive: {
    color: '#329BA4',
    fontWeight: '500',
  },
  bottomNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  createButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  createButtonActive: {
    backgroundColor: '#329BA4',
  },
  createButtonInactive: {
    backgroundColor: '#333333',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  createButtonTextActive: {
    color: '#FFFFFF',
  },
  createButtonTextInactive: {
    color: '#666666',
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  exitModalContainer: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  exitModalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exitModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exitModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
  },
  exitModalCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  exitModalExitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#C04B76',
    alignItems: 'center',
  },
  exitModalExitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
  limitModalContainer: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  limitModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 12,
  },
  limitModalSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  limitModalButton: {
    backgroundColor: '#329BA4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  limitModalButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  congratsContainer: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    position: 'relative',
  },
  congratsCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40, // Increased from 32
    height: 40, // Increased from 32
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
    paddingRight: 32,
  },
});