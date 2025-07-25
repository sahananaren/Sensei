import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { X, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < currentStep ? styles.progressDotActive : styles.progressDotInactive,
          ]}
        />
      ))}
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
      <View style={styles.modalOverlay}>
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

interface CongratsModalProps {
  visible: boolean;
  visionName: string;
  onClose: () => void;
}

function CongratsModal({ visible, visionName, onClose }: CongratsModalProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.congratsContainer}>
          <TouchableOpacity
            style={styles.congratsCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color="#A7A7A7" />
          </TouchableOpacity>
          
          <Text style={styles.congratsTitle}>
            Congrats on creating your new vision '{visionName}'
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function CreateVisionScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form data
  const [visionName, setVisionName] = useState('');
  const [visionDescription, setVisionDescription] = useState('');
  const [milestones, setMilestones] = useState<string[]>(['']);
  const [habits, setHabits] = useState<string[]>(['']);

  const hasFormData = () => {
    return visionName.trim() !== '' || 
           visionDescription.trim() !== '' || 
           milestones.some(m => m.trim() !== '') || 
           habits.some(h => h.trim() !== '');
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, '']);
  };

  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
    
    // Add new input if this is the last one and it's not empty
    if (index === milestones.length - 1 && value.trim() !== '') {
      setMilestones([...newMilestones, '']);
    }
  };

  const addHabit = () => {
    if (habits.length < 3) {
      setHabits([...habits, '']);
    }
  };

  const updateHabit = (index: number, value: string) => {
    const newHabits = [...habits];
    newHabits[index] = value;
    setHabits(newHabits);
    
    // Add new input if this is the last one and it's not empty
    if (index === habits.length - 1 && value.trim() !== '' && habits.length < 3) {
      setHabits([...newHabits, '']);
    }
  };

  const getVisionColor = async (userId: string) => {
    // Get current vision count for this user
    const { data: existingVisions } = await supabase
      .from('visions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const visionCount = existingVisions?.length || 0;
    const colors = ['#329BA4', '#5E85E7', '#C04B76', '#E7975E'];
    
    return colors[visionCount % colors.length];
  };

  const createVision = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a vision');
      return;
    }

    setIsCreating(true);
    
    try {
      // Get current vision count for color assignment
      const { data: existingVisions } = await supabase
        .from('visions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const visionCount = existingVisions?.length || 0;
      const colors = ['#329BA4', '#5E85E7', '#C04B76', '#E7975E'];
      const visionColor = colors[visionCount % colors.length];

      // Create vision
      const { data: visionData, error: visionError } = await supabase
        .from('visions')
        .insert({
          user_id: user.id,
          name: visionName.trim(),
          description: visionDescription.trim(),
          color: visionColor,
        })
        .select()
        .single();

      if (visionError) throw visionError;

      // Create milestones
      const validMilestones = milestones.filter(m => m.trim() !== '');
      if (validMilestones.length > 0) {
        const milestoneInserts = validMilestones.map(name => ({
          vision_id: visionData.id,
          name: name.trim(),
        }));

        const { error: milestonesError } = await supabase
          .from('milestones')
          .insert(milestoneInserts);

        if (milestonesError) throw milestonesError;
      }

      // Create habits
      const validHabits = habits.filter(h => h.trim() !== '');
      if (validHabits.length > 0) {
        const habitInserts = validHabits.map(name => ({
          user_id: user.id,
          vision_id: visionData.id,
          name: name.trim(),
        }));

        const { error: habitsError } = await supabase
          .from('habits')
          .insert(habitInserts);

        if (habitsError) throw habitsError;
      }

      // Show success modal
      setShowCongratsModal(true);
    } catch (error) {
      console.error('Error creating vision:', error);
      Alert.alert('Error', 'Failed to create vision. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCongratsClose = () => {
    setShowCongratsModal(false);
    router.back();
  };

  const canProceedStep1 = visionName.trim() !== '' && visionDescription.trim() !== '';
  const canProceedStep2 = milestones.some(m => m.trim() !== '');
  const canProceedStep3 = habits.some(h => h.trim() !== '');

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Create Your Vision';
      case 2:
        return 'Add Milestones';
      case 3:
        return 'Add Habits';
      default:
        return 'Create Your Vision';
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>What do you want to gain mastery over?</Text>
        <TextInput
          style={styles.textInput}
          value={visionName}
          onChangeText={setVisionName}
          placeholder="Public Speaking..."
          placeholderTextColor="#666666"
          maxLength={100}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Describe it in a few words</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={visionDescription}
          onChangeText={setVisionDescription}
          placeholder="I want to confidently speak in conferences and social media platforms..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>When do you know you've made progress?</Text>
      
      {milestones.map((milestone, index) => (
        <View key={index} style={styles.fieldContainer}>
          <TextInput
            style={styles.textInput}
            value={milestone}
            onChangeText={(value) => updateMilestone(index, value)}
            placeholder={index === 0 ? "First Speech on Toastmasters..." : "Another milestone..."}
            placeholderTextColor="#666666"
            maxLength={200}
          />
        </View>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>How will you achieve this vision?</Text>
      
      {habits.map((habit, index) => (
        <View key={index} style={styles.fieldContainer}>
          <TextInput
            style={styles.textInput}
            value={habit}
            onChangeText={(value) => updateHabit(index, value)}
            placeholder={index === 0 ? "1 Practice Speech a Week..." : "Another habit..."}
            placeholderTextColor="#666666"
            maxLength={200}
          />
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const getActionButtonText = () => {
    if (currentStep === 2 && !canProceedStep2) return 'Skip';
    if (currentStep === 3) return isCreating ? 'Creating...' : 'Create Vision';
    return 'Next';
  };

  const getActionButtonActive = () => {
    if (currentStep === 1) return canProceedStep1;
    if (currentStep === 2) return true; // Always active (Next or Skip)
    if (currentStep === 3) return canProceedStep3 && !isCreating;
    return false;
  };

  const handleActionButton = () => {
    if (currentStep === 3) {
      createVision();
    } else if (currentStep === 2 && !canProceedStep2) {
      // Skip milestones
      handleNext();
    } else {
      handleNext();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#A7A7A7" />
            <Text style={styles.previousButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.progressContainer}>
          <ProgressDots currentStep={currentStep} totalSteps={3} />
        </View>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            getActionButtonActive() ? styles.actionButtonActive : styles.actionButtonInactive
          ]}
          onPress={handleActionButton}
          disabled={!getActionButtonActive()}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.actionButtonText,
            getActionButtonActive() ? styles.actionButtonTextActive : styles.actionButtonTextInactive
          ]}>
            {getActionButtonText()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <ExitWarningModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onExit={handleExit}
      />
      
      <CongratsModal
        visible={showCongratsModal}
        visionName={visionName}
        onClose={handleCongratsClose}
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
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  stepSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginBottom: 24,
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
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  bottomNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -20 }],
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#329BA4',
  },
  progressDotInactive: {
    backgroundColor: '#333333',
  },
  previousButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previousButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  actionButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#329BA4',
  },
  actionButtonInactive: {
    backgroundColor: '#333333',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtonTextInactive: {
    color: '#666666',
  },
  modalOverlay: {
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
    width: 32,
    height: 32,
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