import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Plus, Target, Clock, Flame, MoreVertical } from 'lucide-react-native';
import { Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useVisions, VisionWithHabits, Habit } from '@/hooks/useVisions';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HabitCardProps {
  habit: Habit;
  visionColor: string;
  onPress: (habit: Habit, vision: VisionWithHabits) => void;
  onGraduateHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
  vision: VisionWithHabits;
}

function HabitCard({ habit, visionColor, onPress, onGraduateHabit, onDeleteHabit, vision }: HabitCardProps) {
  const { sessions } = useFocusSessions();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // Calculate today's time for this habit
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(session => 
    session.habit_id === habit.id && 
    new Date(session.completed_at).toDateString() === today
  );
  const timeToday = todaySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  
  // Calculate streak - consecutive days with sessions including today
  const calculateStreak = () => {
    const habitSessions = sessions.filter(session => session.habit_id === habit.id);
    if (habitSessions.length === 0) return 0;
    
    // Get unique days with sessions
    const sessionDays = new Set(
      habitSessions.map(session => 
        new Date(session.completed_at).toDateString()
      )
    );
    
    let streak = 0;
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    // Start checking from today if there's a session today, otherwise from yesterday
    let checkDate = new Date(now);
    if (!sessionDays.has(today) && sessionDays.has(yesterdayString)) {
      // If no session today but there was one yesterday, start from yesterday
      checkDate = yesterday;
    }
    
    // Check consecutive days starting from today
    while (true) {
      const dateString = checkDate.toDateString();
      if (sessionDays.has(dateString)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const streak = calculateStreak();
  const hasActivityToday = timeToday > 0;

  const handleMenuPress = (event: any) => {
    // Get the position of the button
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuPosition({ x: pageX + width - 120, y: pageY + height + 5 }); // Position menu below and align right
      setShowMenu(true);
    });
  };

  return (
    <>
      <TouchableOpacity style={styles.habitCard} onPress={() => onPress(habit, vision)} activeOpacity={0.7}>
        <View style={styles.habitCardContent}>
          <View style={[styles.streakCircle, { borderColor: hasActivityToday ? visionColor : '#A7A7A7' }]}>
            <Text style={[styles.streakNumber, { color: hasActivityToday ? visionColor : '#A7A7A7' }]}>
              {streak}
            </Text>
          </View>
          
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.timeToday}>
              {timeToday > 0 ? `${timeToday} mins today` : '0 mins today'}
            </Text>
          </View>
          
          <View style={styles.habitActions}>
            <Flame size={16} color={hasActivityToday ? visionColor : '#A7A7A7'} />
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <MoreVertical size={16} color="#A7A7A7" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Habit Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            left: menuPosition.x,
            top: menuPosition.y,
          }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onGraduateHabit(habit);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Graduate</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDeleteHabit(habit);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

interface VisionSectionProps {
  vision: VisionWithHabits;
  onHabitPress: (habit: Habit, vision: VisionWithHabits) => void;
  onGraduateVision: (vision: VisionWithHabits) => void;
  onDeleteVision: (vision: VisionWithHabits) => void;
  onGraduateHabit: (habit: Habit) => void;
  onDeleteHabit: (habit: Habit) => void;
}

function VisionSection({ vision, onHabitPress, onGraduateVision, onDeleteVision, onGraduateHabit, onDeleteHabit }: VisionSectionProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleMenuPress = (event: any) => {
    // Get the position of the button
    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuPosition({ x: pageX + width - 120, y: pageY + height + 5 }); // Position menu below and align right
      setShowMenu(true);
    });
  };

  return (
    <View style={styles.visionSection}>
      <View style={styles.visionHeader}>
        <Text style={styles.visionTitle}>{vision.name}</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <MoreVertical size={18} color="#A7A7A7" />
        </TouchableOpacity>
      </View>
      {vision.habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          visionColor={vision.color}
          onPress={onHabitPress}
          onGraduateHabit={onGraduateHabit}
          onDeleteHabit={onDeleteHabit}
          vision={vision}
        />
      ))}

      {/* Vision Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            left: menuPosition.x,
            top: menuPosition.y,
          }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onGraduateVision(vision);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Graduate</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDeleteVision(vision);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

interface AddMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddVision: () => void;
  onAddHabit: () => void;
}

function AddMenu({ visible, onClose, onAddVision, onAddHabit }: AddMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.addMenuContainer}>
          <TouchableOpacity 
            style={styles.addMenuItem} 
            onPress={() => {
              onClose();
              onAddVision();
            }}
            activeOpacity={0.7}
          >
            <Target size={20} color="#FFFFFF" />
            <Text style={styles.addMenuText}>Add Vision</Text>
          </TouchableOpacity>
          
          <View style={styles.addMenuDivider} />
          
          <TouchableOpacity 
            style={styles.addMenuItem} 
            onPress={() => {
              onClose();
              onAddHabit();
            }}
            activeOpacity={0.7}
          >
            <Clock size={20} color="#FFFFFF" />
            <Text style={styles.addMenuText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

function EmptyState({ onCreateVision }: { onCreateVision: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateContent}>
        <Target size={48} color="#A7A7A7" strokeWidth={1.5} />
        <Text style={styles.emptyStateTitle}>No visions yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Create your first vision to start tracking habits and building momentum
        </Text>
        <TouchableOpacity 
          style={styles.createVisionButton} 
          onPress={onCreateVision}
          activeOpacity={0.8}
        >
          <Text style={styles.createVisionButtonText}>Create your First Vision</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color="#329BA4" />
      <Text style={styles.loadingText}>Loading your visions...</Text>
    </View>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <View style={styles.errorState}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TodayTab() {
  const { user } = useAuth();
  const { visions, loading, error, refetch } = useVisions();
  const { showUpgrade, incrementVisionCount, checkUpgradeRequired } = useSubscription();
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGraduateVisionModal, setShowGraduateVisionModal] = useState(false);
  const [showGraduateHabitModal, setShowGraduateHabitModal] = useState(false);
  const [selectedVision, setSelectedVision] = useState<VisionWithHabits | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showDeleteVisionModal, setShowDeleteVisionModal] = useState(false);
  const [showDeleteHabitModal, setShowDeleteHabitModal] = useState(false);
  const [visionToDelete, setVisionToDelete] = useState<VisionWithHabits | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Show upgrade on first visit
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisited = await AsyncStorage.getItem('has_visited_before');
      if (!hasVisited) {
        await AsyncStorage.setItem('has_visited_before', 'true');
        // Show upgrade after a short delay
        setTimeout(() => {
          showUpgrade();
        }, 2000);
      }
    };
    
    checkFirstVisit();
  }, []);

  // Refetch visions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 TodayTab: Screen focused, refetching visions...');
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddVision = () => {
    if (checkUpgradeRequired()) {
      showUpgrade();
      return;
    }
    router.push('/create-vision');
  };

  const handleAddHabit = () => {
    router.push('/create-habit');
  };

  const handleCreateVision = () => {
    router.push('/create-vision');
  };

  const handleHabitPress = (habit: Habit, vision: VisionWithHabits) => {
    router.push(`/focus-session/${habit.id}`);
  };

  const handleDeleteVision = (vision: VisionWithHabits) => {
    setVisionToDelete(vision);
    setShowDeleteVisionModal(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit);
    setShowDeleteHabitModal(true);
  };

  const handleGraduateVision = (vision: VisionWithHabits) => {
    setSelectedVision(vision);
    setShowGraduateVisionModal(true);
  };

  const handleGraduateHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowGraduateHabitModal(true);
  };

  const confirmGraduateVision = async () => {
    if (!selectedVision) return;

    try {
      const { error } = await supabase
        .from('visions')
        .update({
          status: 'graduated',
          graduated_at: new Date().toISOString(),
        })
        .eq('id', selectedVision.id);

      if (error) throw error;

      setShowGraduateVisionModal(false);
      setSelectedVision(null);
      refetch(); // Refresh the visions list
    } catch (error) {
      console.error('Error graduating vision:', error);
      Alert.alert('Error', 'Failed to graduate vision. Please try again.');
    }
  };

  const confirmGraduateHabit = async () => {
    if (!selectedHabit) return;

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          status: 'graduated',
          graduated_at: new Date().toISOString(),
        })
        .eq('id', selectedHabit.id);

      if (error) throw error;

      setShowGraduateHabitModal(false);
      setSelectedHabit(null);
      refetch(); // Refresh the visions list
    } catch (error) {
      console.error('Error graduating habit:', error);
      Alert.alert('Error', 'Failed to graduate habit. Please try again.');
    }
  };

  const confirmDeleteVision = async () => {
    if (!visionToDelete) return;

    setIsDeleting(true);
    try {
      // Delete all habits associated with this vision first
      const { error: habitsError } = await supabase
        .from('habits')
        .delete()
        .eq('vision_id', visionToDelete.id);

      if (habitsError) throw habitsError;

      // Delete the vision
      const { error: visionError } = await supabase
        .from('visions')
        .delete()
        .eq('id', visionToDelete.id);

      if (visionError) throw visionError;

      setShowDeleteVisionModal(false);
      setVisionToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting vision:', error);
      Alert.alert('Error', 'Failed to delete vision. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitToDelete.id);

      if (error) throw error;

      setShowDeleteHabitModal(false);
      setHabitToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Time to Focus</Text>
              <Text style={styles.subtitle}>Pick a habit to focus on</Text>
            </View>
          </View>
        </View>
        <LoadingState />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Time to Focus</Text>
              <Text style={styles.subtitle}>Pick a habit to focus on</Text>
            </View>
          </View>
        </View>
        <ErrorState error={error} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Time to Focus</Text>
            <Text style={styles.subtitle}>Pick a habit to focus on</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddMenu(true)}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#329BA4"
          />
        }
      >
        {visions.length > 0 ? (
          visions.map((vision) => (
            <VisionSection
              key={vision.id}
              vision={vision}
              onHabitPress={handleHabitPress}
              onGraduateVision={handleGraduateVision}
              onDeleteVision={handleDeleteVision}
              onGraduateHabit={handleGraduateHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          ))
        ) : (
          <EmptyState onCreateVision={handleCreateVision} />
        )}
      </ScrollView>

      {/* Add Menu Modal */}
      <AddMenu
        visible={showAddMenu}
        onClose={() => setShowAddMenu(false)}
        onAddVision={handleAddVision}
        onAddHabit={handleAddHabit}
      />

      {/* Graduate Vision Confirmation Modal */}
      <ConfirmationModal
        visible={showGraduateVisionModal}
        title="Graduate a vision to complete it forever"
        message="You can not contribute to the vision anymore. However, you can still see logs of your vision."
        confirmText="Graduate"
        cancelText="Cancel"
        onConfirm={confirmGraduateVision}
        onCancel={() => {
          setShowGraduateVisionModal(false);
          setSelectedVision(null);
        }}
        destructive={false}
      />

      {/* Graduate Habit Confirmation Modal */}
      <ConfirmationModal
        visible={showGraduateHabitModal}
        title="Graduate a habit to complete it forever"
        message="You won't be able to work on the habit anymore. However, you can still see logs of that habit."
        confirmText="Graduate"
        cancelText="Cancel"
        onConfirm={confirmGraduateHabit}
        onCancel={() => {
          setShowGraduateHabitModal(false);
          setSelectedHabit(null);
        }}
        destructive={false}
      />

      {/* Delete Vision Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteVisionModal}
        title="Delete Vision"
        message={`Are you sure you want to delete "${visionToDelete?.name}"? This action cannot be undone and will permanently delete all associated habits and focus sessions.`}
        confirmText="Delete Vision"
        cancelText="Cancel"
        onConfirm={confirmDeleteVision}
        onCancel={() => {
          setShowDeleteVisionModal(false);
          setVisionToDelete(null);
        }}
        loading={isDeleting}
        destructive={true}
      />

      {/* Delete Habit Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteHabitModal}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habitToDelete?.name}"? This action cannot be undone and will permanently delete all associated focus sessions.`}
        confirmText="Delete Habit"
        cancelText="Cancel"
        onConfirm={confirmDeleteHabit}
        onCancel={() => {
          setShowDeleteHabitModal(false);
          setHabitToDelete(null);
        }}
        loading={isDeleting}
        destructive={true}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
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
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#329BA4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Account for tab bar
  },
  visionSection: {
    marginBottom: 32,
  },
  visionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  habitCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  habitCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  streakCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  timeToday: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  habitActions: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteHabitButton: {
    padding: 4,
  },
  visionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteVisionButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createVisionButton: {
    backgroundColor: '#329BA4',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createVisionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 104, // Position below header + add button
    paddingRight: 20,
  },
  addMenuContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    minWidth: 160,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addMenuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginLeft: 12,
  },
  addMenuDivider: {
    height: 1,
    backgroundColor: '#1C1C1C',
    marginHorizontal: 16,
  },
  loadingState: {
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
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#329BA4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  menuButton: {
    padding: 4,
  },
  menuContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  deleteMenuItemText: {
    color: '#C04B76',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#1C1C1C',
    marginVertical: 4,
  },
});