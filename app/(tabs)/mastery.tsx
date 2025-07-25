import React, { useState } from 'react';
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
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, Check, X } from 'lucide-react-native';
import { useVisions, VisionWithHabits } from '@/hooks/useVisions';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useMilestones } from '@/hooks/useMilestones';
import CalendarHeatmap from '@/components/CalendarHeatmap';
import { supabase } from '@/lib/supabase';

interface VisionTabsProps {
  visions: VisionWithHabits[];
  selectedVision: VisionWithHabits | null;
  onSelectVision: (vision: VisionWithHabits) => void;
}

function VisionTabs({ visions, selectedVision, onSelectVision }: VisionTabsProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {visions.map((vision) => (
        <TouchableOpacity
          key={vision.id}
          style={[
            styles.tab,
            selectedVision?.id === vision.id && styles.tabActive
          ]}
          onPress={() => onSelectVision(vision)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedVision?.id === vision.id && styles.tabTextActive
          ]}>
            {vision.name}
          </Text>
          {selectedVision?.id === vision.id && (
            <View style={[styles.tabIndicator, { backgroundColor: vision.color }]} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
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
}

function StatsCards({ sessions, visionCreatedAt }: StatsCardsProps) {
  const calculateStats = () => {
    const now = new Date();
    const createdDate = new Date(visionCreatedAt);
    const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Get unique days with sessions
    const sessionDays = new Set(
      sessions.map(session => 
        new Date(session.completed_at).toDateString()
      )
    );
    const engagedDays = sessionDays.size;
    
    // Calculate total minutes and daily average
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
    const dailyAverage = daysSinceCreation > 0 ? Math.round(totalMinutes / daysSinceCreation) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
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
    
    while (true) {
      const dateString = checkDate.toDateString();
      if (sessionDays.has(dateString)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return {
      engagedDays,
      totalDays: daysSinceCreation,
      dailyAverage,
      currentStreak,
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
        <Text style={styles.statValue}>{stats.currentStreak} days</Text>
        <Text style={styles.statLabel}>Current Streak</Text>
      </View>
    </View>
  );
}

interface MilestonesAccordionProps {
  visionId: string;
  visionColor: string;
}

function MilestonesAccordion({ visionId, visionColor }: MilestonesAccordionProps) {
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
                      <Trash2 size={16} color="#A7A7A7" />
                    </TouchableOpacity>
                  </View>
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
            <TouchableOpacity
              style={styles.addMilestoneButton}
              onPress={() => setIsAdding(true)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={visionColor} />
              <Text style={[styles.addMilestoneText, { color: visionColor }]}>Add Milestone</Text>
            </TouchableOpacity>
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

export default function MasteryTab() {
  const { visions, loading: visionsLoading } = useVisions();
  const [selectedVision, setSelectedVision] = useState<VisionWithHabits | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { sessions, loading: sessionsLoading } = useFocusSessions(selectedVision?.id);

  // Set first vision as selected when visions load
  React.useEffect(() => {
    if (visions.length > 0 && !selectedVision) {
      setSelectedVision(visions[0]);
    }
  }, [visions, selectedVision]);

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

  const getSessionsForSelectedDate = (date: string) => {
    const targetDate = new Date(date).toISOString().split('T')[0];
    return sessions.filter(session => 
      new Date(session.completed_at).toISOString().split('T')[0] === targetDate
    );
  };

  const calculateMasteryStats = () => {
    if (!sessions.length || !selectedVision) return { hours: 0, timeUnit: 'days', timeValue: 1, showFullDays: false };

    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
    const hours = Math.round(totalMinutes / 60);
    
    // Calculate days since vision creation (minimum 1 day)
    const visionCreated = new Date(selectedVision.created_at);
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - visionCreated.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Show "full days" caption only after 24+ hours
    const showFullDays = hours >= 24;
    
    if (daysSinceStart < 60) {
      return { hours, timeUnit: 'days', timeValue: daysSinceStart, showFullDays };
    } else {
      const months = Math.round(daysSinceStart / 30 * 2) / 2; // Round to nearest 0.5
      return { hours, timeUnit: 'months', timeValue: months, showFullDays };
    }
  };

  if (visionsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#329BA4" />
          <Text style={styles.loadingText}>Loading your visions...</Text>
        </View>
      </View>
    );
  }

  if (visions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No visions yet. Create your first vision to start tracking your mastery journey!
          </Text>
        </View>
      </View>
    );
  }

  if (!selectedVision) {
    return (
      <View style={styles.container}>
      </View>
    );
  }

  const masteryStats = calculateMasteryStats();
  const fullDays = Math.round(masteryStats.hours / 24);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLine} />
        {visions.length > 1 && (
          <VisionTabs
            visions={visions}
            selectedVision={selectedVision}
            onSelectVision={setSelectedVision}
          />
        )}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.visionHeader}>
          <EditableVisionName
            name={selectedVision.name}
            onSave={updateVisionName}
          />
          <EditableDescription
            description={selectedVision.description || ''}
            onSave={updateVisionDescription}
            placeholder="Write a motivating description for your Vision..."
          />
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
          sessions={sessions} 
          visionCreatedAt={selectedVision.created_at}
        />

        <MilestonesAccordion 
          visionId={selectedVision.id}
          visionColor={selectedVision.color}
        />

        <CalendarHeatmap 
          sessions={sessions}
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
      </ScrollView>
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
    height: 2,
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
    marginBottom: 16,
  },
  tabsContent: {
    paddingHorizontal: 0,
    paddingLeft: 0,
    gap: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'relative',
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
    height: 4,
    borderRadius: 1,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
  },
});