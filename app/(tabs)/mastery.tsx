import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, Check, X, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import { useVisionsForMastery, VisionWithHabits } from '@/hooks/useVisions';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useMilestones } from '@/hooks/useMilestones';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { supabase } from '@/lib/supabase';

interface VisionTabsProps {
  visions: VisionWithHabits[];
  selectedVision: VisionWithHabits | null;
  onSelectVision: (vision: VisionWithHabits) => void;
  onDeleteVision: (vision: VisionWithHabits) => void;
}

function VisionTabs({ visions, selectedVision, onSelectVision, onDeleteVision }: VisionTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {visions.map((vision) => (
          <TouchableOpacity
            key={vision.id}
            style={[
              styles.tab,
              selectedVision?.id === vision.id && styles.tabActive,
              vision.status === 'graduated' && styles.tabGraduated
            ]}
            onPress={() => onSelectVision(vision)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              selectedVision?.id === vision.id && styles.tabTextActive,
              vision.status === 'graduated' && styles.tabTextGraduated
            ]}>
              {vision.name}
            </Text>
            {selectedVision?.id === vision.id && (
              <View style={[styles.tabIndicator, { backgroundColor: vision.color }]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface EditableDescriptionProps {
  description: string;
  onSave: (newDescription: string) => void;
  placeholder: string;
}

function EditableDescription({ description, onSave, placeholder }: EditableDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(description);

  const handleSave = () => {
    onSave(editText.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(description);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.descriptionEditContainer}>
        <TextInput
          style={styles.descriptionInput}
          value={editText}
          onChangeText={setEditText}
          placeholder={placeholder}
          placeholderTextColor="#666666"
          multiline
          autoFocus
        />
        <View style={styles.descriptionActions}>
          <TouchableOpacity onPress={handleCancel} style={styles.descriptionAction}>
            <X size={16} color="#A7A7A7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.descriptionAction}>
            <Check size={16} color="#329BA4" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={() => setIsEditing(true)}
      activeOpacity={0.7}
    >
      <Text style={styles.descriptionText}>
        "{description || placeholder}"
      </Text>
    </TouchableOpacity>
  );
}

interface EditableVisionNameProps {
  name: string;
  onSave: (newName: string) => void;
}

function EditableVisionName({ name, onSave }: EditableVisionNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(name);

  const handleSave = () => {
    if (editText.trim()) {
      onSave(editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(name);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.visionNameEditContainer}>
        <TextInput
          style={styles.visionNameInput}
          value={editText}
          onChangeText={setEditText}
          autoFocus
        />
        <View style={styles.descriptionActions}>
          <TouchableOpacity onPress={handleCancel} style={styles.descriptionAction}>
            <X size={16} color="#A7A7A7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.descriptionAction}>
            <Check size={16} color="#329BA4" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={() => setIsEditing(true)}
      activeOpacity={0.7}
    >
      <Text style={styles.visionTitle}>{name}</Text>
    </TouchableOpacity>
  );
}

interface StatsCardsProps {
  sessions: Array<{
    completed_at: string;
    duration_minutes: number;
  }>;
  visionCreatedAt: string;
  isGraduated?: boolean;
  graduatedAt?: string | null;
}

function StatsCards({ sessions, visionCreatedAt, isGraduated, graduatedAt }: StatsCardsProps) {
  const calculateStats = () => {
    const now = new Date(); // Use local time
    const createdDate = new Date(visionCreatedAt);
    
    // For graduated visions, use graduation date instead of current date
    const endDate = isGraduated && graduatedAt ? new Date(graduatedAt) : now;
    
    const daysSinceCreation = Math.max(1, Math.floor((endDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Get unique days with sessions (only up to graduation date for graduated visions)
    const sessionDays = new Set(
      sessions
        .filter(session => {
          if (isGraduated && graduatedAt) {
            return new Date(session.completed_at) <= new Date(graduatedAt);
          }
          return true;
        })
        .map(session => 
          new Date(session.completed_at).toDateString() // Use local time
        )
    );
    const engagedDays = sessionDays.size;
    
    // Calculate total minutes and daily average
    const totalMinutes = sessions
      .filter(session => {
        if (isGraduated && graduatedAt) {
          return new Date(session.completed_at) <= new Date(graduatedAt);
        }
        return true;
      })
      .reduce((sum, session) => sum + session.duration_minutes, 0);
    const dailyAverage = daysSinceCreation > 0 ? Math.round(totalMinutes / daysSinceCreation) : 0;
    
    // Calculate longest streak - use local time
    const sortedSessionDates = Array.from(sessionDays)
      .map(dateStr => new Date(dateStr)) // Use local time
      .sort((a, b) => a.getTime() - b.getTime());
    
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < sortedSessionDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const currentDate = sortedSessionDates[i];
        const previousDate = sortedSessionDates[i - 1];
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, currentStreak);
    
    return {
      engagedDays,
      totalDays: daysSinceCreation,
      dailyAverage,
      longestStreak,
    };
  };

  const stats = calculateStats();

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.engagedDays} days</Text>
        <Text style={styles.statLabel}>out of {stats.totalDays}</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.dailyAverage} mins</Text>
        <Text style={styles.statLabel}>Daily Average</Text>
      </View>
      
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.longestStreak} days</Text>
        <Text style={styles.statLabel}>Longest Streak</Text>
      </View>
    </View>
  );
}

interface MilestonesAccordionProps {
  visionId: string;
  visionColor: string;
  isGraduated: boolean; // Add this prop
}

function MilestonesAccordion({ visionId, visionColor, isGraduated }: MilestonesAccordionProps) {
  const { milestones, addMilestone, updateMilestone, deleteMilestone } = useMilestones(visionId);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const completedCount = milestones.filter(m => m.status === 'completed').length;

  const handleAddMilestone = async () => {
    if (!newMilestoneText.trim()) return;
    
    try {
      await addMilestone(newMilestoneText);
      setNewMilestoneText('');
      setIsAdding(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add milestone');
    }
  };

  const handleEditMilestone = async (id: string) => {
    if (!editText.trim()) return;
    
    try {
      await updateMilestone(id, { name: editText.trim() });
      setEditingId(null);
      setEditText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete milestone');
            }
          },
        },
      ]
    );
  };

  const handleToggleMilestone = async (milestone: any) => {
    let newStatus: 'not_started' | 'in_progress' | 'completed';
    
    if (milestone.status === 'completed') {
      // When uncompleting, check if milestone has ever been used in sessions
      newStatus = milestone.has_sessions ? 'in_progress' : 'not_started';
    } else {
      newStatus = 'completed';
    }
    
    try {
      await updateMilestone(milestone.id, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone status');
    }
  };

  const getMilestoneStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: visionColor,
          borderColor: visionColor,
        };
      case 'in_progress':
        return {
          backgroundColor: `${visionColor}40`,
          borderColor: visionColor,
        };
      default:
        return {
          backgroundColor: 'transparent',
          borderColor: '#A7A7A7',
        };
    }
  };

  return (
    <View style={styles.milestonesContainer}>
      <TouchableOpacity
        style={styles.milestonesHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.milestonesTitle}>
          Milestones ({completedCount}/{milestones.length} completed)
        </Text>
        {isExpanded ? (
          <ChevronUp size={20} color="#A7A7A7" />
        ) : (
          <ChevronDown size={20} color="#A7A7A7" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.milestonesContent}>
          {milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneItem}>
              {editingId === milestone.id ? (
                <View style={styles.milestoneEditContainer}>
                  <TextInput
                    style={styles.milestoneInput}
                    value={editText}
                    onChangeText={setEditText}
                    autoFocus
                  />
                  <View style={styles.milestoneActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                      style={styles.milestoneAction}
                    >
                      <X size={16} color="#A7A7A7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEditMilestone(milestone.id)}
                      style={styles.milestoneAction}
                    >
                      <Check size={16} color="#329BA4" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.milestoneIndicator, getMilestoneStyle(milestone.status)]}
                    onPress={() => handleToggleMilestone(milestone)}
                    activeOpacity={0.7}
                  >
                    {milestone.status === 'completed' && (
                      <Check size={8} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.milestoneText}>{milestone.name}</Text>
                  {!isGraduated && ( // Only show edit/delete buttons for active visions
                    <View style={styles.milestoneActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(milestone.id);
                          setEditText(milestone.name);
                        }}
                        style={styles.milestoneAction}
                      >
                        <Pencil size={16} color="#A7A7A7" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteMilestone(milestone.id)}
                        style={styles.milestoneAction}
                      >
                        <Trash2 size={16} color="#C04B76" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}

          {isAdding ? (
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneEditContainer}>
                <TextInput
                  style={styles.milestoneInput}
                  value={newMilestoneText}
                  onChangeText={setNewMilestoneText}
                  placeholder="Enter milestone name..."
                  placeholderTextColor="#666666"
                  autoFocus
                />
                <View style={styles.milestoneActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsAdding(false);
                      setNewMilestoneText('');
                    }}
                    style={styles.milestoneAction}
                  >
                    <X size={16} color="#A7A7A7" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddMilestone}
                    style={styles.milestoneAction}
                  >
                    <Check size={16} color={visionColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            !isGraduated && ( // Only show add milestone button for active visions
              <TouchableOpacity
                style={styles.addMilestoneButton}
                onPress={() => setIsAdding(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={visionColor} />
                <Text style={[styles.addMilestoneText, { color: visionColor }]}>
                  Add Milestone
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </View>
  );
}

interface DayLogViewerProps {
  selectedDate: string;
  getSessionsForDate: (date: string) => any[];
  visionName: string;
}

function DayLogViewer({ selectedDate, getSessionsForDate, visionName }: DayLogViewerProps) {
  const sessions = getSessionsForDate(selectedDate);
  
  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <View style={styles.dayLogContainer}>
      <Text style={styles.dayLogHeading}>
        What you did on {formatSelectedDate(selectedDate)}
      </Text>

      {/* Session Details */}
      <View style={styles.sessionDetails}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No logs for this day yet.</Text>
          </View>
        ) : (
          <View style={styles.visionGroup}>
            <Text style={styles.visionGroupTitle}>{visionName}</Text>
            {sessions.map((session, index) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionHabit}>{session.habit.name}</Text>
                  <Text style={styles.sessionDuration}>
                    {session.duration_minutes < 60 
                      ? `${session.duration_minutes} mins`
                      : `${Math.round(session.duration_minutes / 60 * 10) / 10} hrs`
                    }
                  </Text>
                </View>
                <Text style={styles.sessionAccomplishment}>
                  "{session.accomplishment}"
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
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

export default function MasteryTab() {
  const { visions, loading, error, refetch } = useVisionsForMastery();
  const { sessions, refetch: refetchSessions } = useFocusSessions();
  const [selectedVision, setSelectedVision] = useState<VisionWithHabits | null>(null);
  const [showDeleteVisionModal, setShowDeleteVisionModal] = useState(false);
  const [visionToDelete, setVisionToDelete] = useState<VisionWithHabits | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Set today as default

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSessions();
    }, [refetch, refetchSessions])
  );

  // Set the first vision as selected when visions load
  React.useEffect(() => {
    if (visions.length > 0 && !selectedVision) {
      setSelectedVision(visions[0]);
    }
  }, [visions, selectedVision]);

  const handleDeleteVision = (vision: VisionWithHabits) => {
    setVisionToDelete(vision);
    setShowDeleteVisionModal(true);
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
      
      // If the deleted vision was selected, select the first available vision
      if (selectedVision?.id === visionToDelete.id) {
        const remainingVisions = visions.filter(v => v.id !== visionToDelete.id);
        if (remainingVisions.length > 0) {
          setSelectedVision(remainingVisions[0]);
        } else {
          setSelectedVision(null);
        }
      }
    } catch (error) {
      console.error('Error deleting vision:', error);
      Alert.alert('Error', 'Failed to delete vision. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateVisionDescription = async (newDescription: string) => {
    if (!selectedVision) return;

    try {
      const { error } = await supabase
        .from('visions')
        .update({ description: newDescription })
        .eq('id', selectedVision.id);

      if (error) throw error;

      // Update local state
      setSelectedVision(prev => prev ? { ...prev, description: newDescription } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update description');
    }
  };

  const updateVisionName = async (newName: string) => {
    if (!selectedVision) return;

    try {
      const { error } = await supabase
        .from('visions')
        .update({ name: newName })
        .eq('id', selectedVision.id);

      if (error) throw error;

      // Update local state
      setSelectedVision(prev => prev ? { ...prev, name: newName } : null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update vision name');
    }
  };

  const updateMilestoneStatus = async (milestoneId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', milestoneId);

      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone status');
    }
  };

  // Add a function to filter sessions by vision:
  const getVisionSessions = () => {
    if (!selectedVision) return [];
    
    // Get all habit IDs for the selected vision
    const visionHabitIds = selectedVision.habits.map(habit => habit.id);
    
    // Filter sessions to only include those from this vision's habits
    return sessions.filter(session => visionHabitIds.includes(session.habit_id));
  };

  // Update the component calls to use filtered sessions:
  const getSessionsForSelectedDate = (date: string) => {
    if (!date || !selectedVision) return [];
    
    try {
      const targetDate = new Date(date); // Use local time
      const visionSessions = getVisionSessions();
      
      return visionSessions.filter(session => 
        new Date(session.completed_at).toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]
      );
    } catch (error) {
      console.error('Error parsing date:', error);
      return [];
    }
  };

  // Calculate mastery stats and full days
  const calculateMasteryStats = () => {
    const visionSessions = getVisionSessions();
    if (!visionSessions.length || !selectedVision) return { hours: 0, timeUnit: 'days', timeValue: 1, showFullDays: false };

    const totalMinutes = visionSessions.reduce((sum, session) => sum + session.duration_minutes, 0);
    const hours = Math.round(totalMinutes / 60);
    
    // Calculate days since vision creation (minimum 1 day) - use local time
    const visionCreated = new Date(selectedVision.created_at);
    
    // For graduated visions, use graduation date instead of current date
    const endDate = selectedVision.status === 'graduated' && selectedVision.graduated_at 
      ? new Date(selectedVision.graduated_at)
      : new Date(); // Use local time
        
    const daysSinceStart = Math.max(1, Math.floor((endDate.getTime() - visionCreated.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Show "full days" caption only after 24+ hours
    const showFullDays = hours >= 24;
    
    if (daysSinceStart < 60) {
      return { hours, timeUnit: 'days', timeValue: daysSinceStart, showFullDays };
    } else {
      const months = Math.round(daysSinceStart / 30 * 2) / 2; // Round to nearest 0.5
      return { hours, timeUnit: 'months', timeValue: months, showFullDays };
    }
  };
  const masteryStats = calculateMasteryStats();
  const fullDays = Math.floor(masteryStats.hours / 24);

  const handleCreateVision = () => {
    router.push('/create-vision');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#329BA4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (visions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <EmptyState onCreateVision={handleCreateVision} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VisionTabs
        visions={visions}
        selectedVision={selectedVision}
        onSelectVision={setSelectedVision}
        onDeleteVision={handleDeleteVision}
      />

      {selectedVision && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.scrollContent}>
            {/* Add graduated vision elements here, above the vision header */}
            {selectedVision.status === 'graduated' && (
              <View style={styles.graduatedVisionHeader}>
                <View style={[styles.graduatedTag, { 
                  backgroundColor: `${selectedVision.color}40`, // 40% opacity
                  borderColor: selectedVision.color // 100% opacity stroke
                }]}>
                  <Text style={[styles.graduatedTagText, { color: selectedVision.color }]}>
                    Graduated  |  {new Date(selectedVision.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: '2-digit', 
                      year: '2-digit' 
                    })} - {selectedVision.graduated_at ? new Date(selectedVision.graduated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: '2-digit', 
                      year: '2-digit' 
                    }) : 'Present'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteVisionButton}
                  onPress={() => handleDeleteVision(selectedVision)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#C04B76" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.visionHeader}>
              <Text style={styles.visionTitle}>
                {selectedVision.name}
              </Text>
              <Text style={styles.visionDescription}>
                "{selectedVision.description || 'Write a motivating description for your Vision...'}"
              </Text>
            </View>

            <View style={styles.masteryStatsContainer}>
              <Text style={styles.masteryStatsTitle}>
                {masteryStats.hours} hours in {masteryStats.timeValue} {masteryStats.timeUnit}
              </Text>
              {masteryStats.showFullDays && (
                <Text style={styles.masteryStatsSubtitle}>
                  That's {fullDays} full days!
                </Text>
              )}
            </View>

            <StatsCards 
              sessions={getVisionSessions()} 
              visionCreatedAt={selectedVision.created_at}
              isGraduated={selectedVision.status === 'graduated'}
              graduatedAt={selectedVision.graduated_at}
            />

            <MilestonesAccordion 
              visionId={selectedVision.id}
              visionColor={selectedVision.color}
              isGraduated={selectedVision.status === 'graduated'} // Add this prop
            />

            <CalendarHeatmap 
              sessions={getVisionSessions()}
              habits={selectedVision.habits}
              selectedHabitId={selectedHabitId}
              onSelectHabit={setSelectedHabitId}
              visionColor={selectedVision.color}
              onDayPress={setSelectedDate}
              selectedDate={selectedDate}
            />

            <View style={{ height: 40 }} />

            {/* Daily Log Viewer */}
            <DayLogViewer
              selectedDate={selectedDate}
              getSessionsForDate={getSessionsForSelectedDate}
              visionName={selectedVision.name}
            />
          </View>
        </ScrollView>
      )}

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
    paddingHorizontal: 0,
    paddingBottom: 0,
    position: 'relative',
  },
  headerLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#111111',
  },
  visionHeader: {
    marginBottom: 24,
  },
  visionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  visionDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    lineHeight: 24,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  tabsContainer: {
    marginBottom: 0,
    paddingTop: 80,
    height: 'auto',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  tabsContent: {
    paddingHorizontal: 0,
    paddingLeft: 0,
    gap: 12,
  },
  tab: {
    paddingVertical: 0, // Reduce from 8 to 4
    paddingHorizontal: 16,
    position: 'relative',
    height: 40,
  },
  tabActive: {
    // Active styling handled by indicator
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  descriptionContainer: {
    // Removed background styling
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  descriptionEditContainer: {
    // Removed background styling
  },
  descriptionInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
    minHeight: 60,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderBottomColor: '#329BA4',
    paddingVertical: 4,
  },
  descriptionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  descriptionAction: {
    padding: 8,
  },
  visionNameEditContainer: {
    marginBottom: 16,
  },
  visionNameInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    borderBottomWidth: 1,
    borderBottomColor: '#329BA4',
    paddingVertical: 4,
    marginBottom: 12,
  },
  masteryStatsContainer: {
    marginBottom: 24,
  },
  masteryStatsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  masteryStatsSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  milestonesContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  milestonesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  milestoneIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  milestoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  milestoneAction: {
    padding: 8,
  },
  milestoneEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    borderBottomWidth: 1,
    borderBottomColor: '#329BA4',
    paddingVertical: 4,
    marginRight: 12,
  },
  addMilestoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  addMilestoneText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  dayLogContainer: {
  },
  dayLogHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  sessionDetails: {
    minHeight: 200,
  },
  emptyStateSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTextSmall: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  visionGroup: {
    marginBottom: 24,
  },
  visionGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  sessionItem: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionHabit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  sessionAccomplishment: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    lineHeight: 20,
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
  emptyStateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#C04B76',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#329BA4',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
  content: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 0,
  },
  tabContainer: {
    marginRight: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 4,
  },
  graduatedTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  graduatedTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteVisionButton: {
    padding: 8,
  },
  tabGraduated: {
    opacity: 0.6,
  },
  tabTextGraduated: {
    opacity: 0.4,
  },
  graduatedVisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});