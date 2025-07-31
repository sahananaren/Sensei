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
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Vision {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'graduated' | 'deleted';
  created_at: string;
  graduated_at: string | null;
}

interface Habit {
  id: string;
  user_id: string;
  vision_id: string;
  name: string;
  status: 'active' | 'graduated' | 'deleted';
  created_at: string;
  graduated_at: string | null;
}

interface Milestone {
  id: string;
  vision_id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  completed_at: string | null;
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
            Are you sure you want to exit?
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
              <Text style={styles.exitModalExitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface TimerCircleProps {
  seconds: number;
}

function TimerCircle({ seconds }: TimerCircleProps) {
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
      </View>
    </View>
  );
}

interface MilestoneCheckboxProps {
  milestone: { id: string; name: string };
  checked: boolean;
  onToggle: () => void;
}

function MilestoneCheckbox({ milestone, checked, onToggle, vision }: MilestoneCheckboxProps & { vision: Vision }) {
  const getCheckboxStyle = () => {
    if (!checked) return styles.checkbox;
    return [
      styles.checkbox,
      styles.checkboxChecked,
      { borderColor: vision.color, backgroundColor: vision.color }
    ];
  };

  return (
    <TouchableOpacity
      style={styles.milestoneItem}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={getCheckboxStyle()}>
        {checked && <Check size={12} color="#FFFFFF" />}
      </View>
      <Text style={styles.milestoneText}>{milestone.name}</Text>
    </TouchableOpacity>
  );
}

export default function FocusSessionScreen() {
  const { habitId, habitData, visionData } = useLocalSearchParams<{ 
    habitId: string;
    habitData?: string;
    visionData?: string;
  }>();
  const { user } = useAuth();
  
  // Screen state
  const [currentStep, setCurrentStep] = useState(1); // 1: Intention, 2: Timer, 3: Complete
  const [showExitModal, setShowExitModal] = useState(false);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  
  // Session data
  const [intention, setIntention] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState('');
  const [accomplishment, setAccomplishment] = useState('');
  const [majorWin, setMajorWin] = useState('');
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data state
  const [habit, setHabit] = useState<Habit | null>(() => {
    try {
      return habitData ? JSON.parse(habitData) : null;
    } catch {
      return null;
    }
  });
  const [vision, setVision] = useState<Vision | null>(() => {
    try {
      return visionData ? JSON.parse(visionData) : null;
    } catch {
      return null;
    }
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Fetch milestones data (habit and vision come from navigation params)
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!user || !vision) return;

      try {
        setMilestonesLoading(true);

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .eq('vision_id', vision.id)
          .order('created_at', { ascending: true });

        if (milestonesError) throw milestonesError;
        setMilestones(milestonesData || []);

      } catch (error) {
        console.error('Error fetching milestones:', error);
        Alert.alert('Error', 'Failed to load milestones');
      } finally {
        setMilestonesLoading(false);
      }
    };

    fetchMilestones();
  }, [user, vision]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (currentStep === 2) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep]);

  const handleClose = () => {
    if (currentStep > 1 || intention.trim() !== '') {
      setShowExitModal(true);
    } else {
      router.back();
    }
  };

  const handleExit = () => {
    setShowExitModal(false);
    router.back();
  };

  const handleSetIntention = () => {
    setCurrentStep(2);
  };

  const handleSkipIntention = () => {
    setCurrentStep(2);
  };

  const handleSaveSession = () => {
    setCurrentStep(3);
  };

  const handleSkipTimer = () => {
    setCurrentStep(3);
  };

  const toggleMilestone = (milestoneId: string) => {
    setSelectedMilestones(prev => 
      prev.includes(milestoneId)
        ? prev.filter(id => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  const handleCompleteSession = async () => {
    if (!user || !habit || !vision) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate final duration
      const finalDurationMinutes = manualMinutes 
        ? parseInt(manualMinutes) 
        : Math.floor(timerSeconds / 60);

      // Update selected milestones to in_progress
      if (selectedMilestones.length > 0) {
        const { error: milestonesError } = await supabase
          .from('milestones')
          .update({ status: 'in_progress' })
          .in('id', selectedMilestones);

        if (milestonesError) throw milestonesError;
      }

      // Create focus session
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          habit_id: habit.id,
          vision_id: vision.id,
          intention: intention.trim() || null,
          duration_minutes: finalDurationMinutes,
          accomplishment: accomplishment.trim(),
          major_win: majorWin.trim() || null,
          milestone_ids: selectedMilestones,
        });

      if (error) throw error;

      // Navigate back to today screen
      router.back();
      
    } catch (error) {
      console.error('Error saving focus session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayDuration = () => {
    if (manualMinutes !== '') {
      return manualMinutes;
    }
    const calculatedMinutes = Math.floor(timerSeconds / 60);
    return calculatedMinutes === 0 ? '' : calculatedMinutes.toString();
  };

  const renderIntentionStep = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set intention for this session</Text>
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
        <View style={styles.stepContainer}>
          <Text style={styles.stepSubtitle}>Set an intention to stay focused</Text>
          
          <View style={styles.fieldContainer}>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={intention}
              onChangeText={setIntention}
              placeholder={`I will write the first draft for my speech in 500 words`}
              placeholderTextColor="#666666"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            intention.trim() !== '' ? styles.actionButtonActive : styles.actionButtonInactive
          ]}
          onPress={handleSetIntention}
          disabled={intention.trim() === ''}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.actionButtonText,
            intention.trim() !== '' ? styles.actionButtonTextActive : styles.actionButtonTextInactive
          ]}>
            Set Intention
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipIntention}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip Intention</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderTimerStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Start Focusing</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerStepContainer}>
        <TimerCircle seconds={timerSeconds} />
      </View>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            timerSeconds >= 10 ? styles.actionButtonActive : styles.actionButtonInactive
          ]}
          onPress={handleSaveSession}
          disabled={timerSeconds < 10}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.actionButtonText,
            timerSeconds >= 10 ? styles.actionButtonTextActive : styles.actionButtonTextInactive
          ]}>
            Save Session
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipTimer}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip Timer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete this Session</Text>
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
        <View style={styles.stepContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Time Spent</Text>
            <View style={styles.timeInputContainer}>
              <TextInput
                style={styles.timeInput}
                value={getDisplayDuration()}
                onChangeText={setManualMinutes}
                placeholder="0"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
              <Text style={styles.timeUnit}>mins</Text>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>What did you accomplish today?</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={accomplishment}
              onChangeText={setAccomplishment}
              placeholder="I completed the first draft
Shot a video of me speaking it
Noted down places that need changing for draft 2"
              placeholderTextColor="#666666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Major Wins (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={majorWin}
              onChangeText={setMajorWin}
              placeholder="Anything for your wall of fame?"
              placeholderTextColor="#666666"
              maxLength={200}
            />
          </View>

          {milestones.length > 0 && (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Milestones Contributed To (Optional)</Text>
              {milestones.map((milestone) => (
                <MilestoneCheckbox
                  key={milestone.id}
                  milestone={milestone}
                  checked={selectedMilestones.includes(milestone.id)}
                  onToggle={() => toggleMilestone(milestone.id)}
                  vision={vision!}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            accomplishment.trim() !== '' && !isSubmitting ? styles.actionButtonActive : styles.actionButtonInactive
          ]}
          onPress={handleCompleteSession}
          disabled={accomplishment.trim() === '' || isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.actionButtonText,
            accomplishment.trim() !== '' && !isSubmitting ? styles.actionButtonTextActive : styles.actionButtonTextInactive
          ]}>
            {isSubmitting ? 'Saving...' : 'Complete Session'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderIntentionStep();
      case 2:
        return renderTimerStep();
      case 3:
        return renderCompleteStep();
      default:
        return renderIntentionStep();
    }
  };

  // If we don't have habit/vision data from params, try to fetch it
  useEffect(() => {
    const fetchHabitAndVision = async () => {
      if (!user || !habitId || habit || vision) return;

      try {
        // Fetch habit
        const { data: habitData, error: habitError } = await supabase
          .from('habits')
          .select('*')
          .eq('id', habitId)
          .eq('user_id', user.id)
          .single();

        if (habitError) throw habitError;
        setHabit(habitData);

        // Fetch vision
        const { data: visionData, error: visionError } = await supabase
          .from('visions')
          .select('*')
          .eq('id', habitData.vision_id)
          .eq('user_id', user.id)
          .single();

        if (visionError) throw visionError;
        setVision(visionData);
      } catch (error) {
        console.error('Error fetching habit/vision data:', error);
        Alert.alert('Error', 'Failed to load habit data');
      }
    };

    fetchHabitAndVision();
  }, [user, habitId, habit, vision]);

  if (!habit || !vision) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loading...</Text>
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {renderCurrentStep()}
      
      <ExitWarningModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onExit={handleExit}
      />
    </>
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
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#329BA4',
  },
  completeButtonInactive: {
    backgroundColor: '#333333',
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  completeButtonTextActive: {
    color: '#FFFFFF',
  },
  completeButtonTextInactive: {
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 24,
  },
  timerStepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginBottom: 32,
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
    height: 120,
    textAlignVertical: 'top',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C1C1C',
  },
  timeInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  timeUnit: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    paddingRight: 16,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 60,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#329BA4',
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#111111',
    borderRadius: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A7A7A7',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#329BA4',
    backgroundColor: '#329BA4',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  milestoneText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    flex: 1,
  },
  bottomNavigation: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#329BA4',
  },
  actionButtonInactive: {
    backgroundColor: '#333333',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtonTextInactive: {
    color: '#666666',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
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
});