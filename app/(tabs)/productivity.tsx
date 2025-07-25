import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar } from 'lucide-react-native';
import { ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProductivityData, VisionRanking } from '@/hooks/useProductivityData';
import { ProductivityChart } from '@/components/ProductivityChart';

interface StatsCardProps {
  title: string;
  subtitle: string;
}

function StatsCard({ title, subtitle }: StatsCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

interface VisionRankCardProps {
  vision: VisionRanking;
  onPress: () => void;
}

function VisionRankCard({ vision, onPress }: VisionRankCardProps) {
  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  return (
    <TouchableOpacity style={styles.visionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.visionRank}>
        <Text style={styles.visionRankNumber}>{vision.rank}</Text>
      </View>
      
      <View style={styles.visionInfo}>
        <Text style={styles.visionName}>{vision.name}</Text>
        <Text style={styles.visionDays}>{vision.activeDays} days</Text>
      </View>
      
      <TouchableOpacity style={styles.visionViewButton} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.visionViewText}>view</Text>
        <ArrowRight size={16} color="#A7A7A7" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface WeekNavigatorProps {
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  onCalendarPress: () => void;
}

function WeekNavigator({ weekOffset, onWeekChange, onCalendarPress }: WeekNavigatorProps) {
  const getWeekLabel = (offset: number) => {
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    if (offset > 0) return `${offset} weeks ahead`;
    return `${Math.abs(offset)} weeks ago`;
  };

  const getDateRange = (offset: number) => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (offset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  return (
    <View style={styles.weekNavigatorContainer}>
      <View style={styles.weekHeader}>
        <View style={styles.weekTitleContainer}>
          <Text style={styles.weekLabel}>{getWeekLabel(weekOffset)}</Text>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={onCalendarPress}
            activeOpacity={0.7}
          >
            <Calendar size={16} color="#A7A7A7" />
          </TouchableOpacity>
        </View>
        <Text style={styles.weekDates}>{getDateRange(weekOffset)}</Text>
      </View>
      
      <View style={styles.weekNavButtons}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => onWeekChange(weekOffset - 1)}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#A7A7A7" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => onWeekChange(weekOffset + 1)}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color="#A7A7A7" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate: Date;
  weekOffset: number;
}

function CalendarModal({ visible, onClose, onDateSelect, currentDate, weekOffset }: CalendarModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Reset to current month when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMonth(new Date());
    }
  }, [visible]);
  
  const getWeekStart = (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };
  
  const isSameWeek = (date1: Date, date2: Date) => {
    const week1 = getWeekStart(date1);
    const week2 = getWeekStart(date2);
    return week1.getTime() === week2.getTime();
  };
  
  const getDaysInMonth = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Calculate current week and selected week
    const now = new Date();
    const selectedWeekStart = new Date(now);
    selectedWeekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const isCurrentWeek = isSameWeek(dayDate, now);
      const isSelectedWeek = isSameWeek(dayDate, selectedWeekStart);
      
      days.push({
        date: dayDate,
        isCurrentWeek,
        isSelectedWeek,
      });
    }
    
    return days;
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };
  
  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.calendarModal}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#A7A7A7" />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>{monthName}</Text>
            <TouchableOpacity onPress={() => navigateMonth('next')} activeOpacity={0.7}>
              <ChevronRight size={20} color="#A7A7A7" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarWeekDays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !day && styles.calendarDayEmpty,
                  day && day.isCurrentWeek && styles.calendarDayCurrentWeek,
                  day && day.isSelectedWeek && styles.calendarDaySelectedWeek,
                ]}
                onPress={() => day && handleDateSelect(day.date)}
                disabled={!day}
                activeOpacity={0.7}
              >
                {day && (
                  <Text style={[
                    styles.calendarDayText,
                    day.isSelectedWeek && styles.calendarDayTextSelected,
                  ]}>
                    {day.date.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

interface VisionFilterDropdownProps {
  visions: Array<{ id: string; name: string; color: string }>;
  selectedVisionId: string | null;
  onSelectVision: (visionId: string | null) => void;
}

function VisionFilterDropdown({ visions, selectedVisionId, onSelectVision }: VisionFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedVision = visions.find(v => v.id === selectedVisionId);
  const displayText = selectedVision ? selectedVision.name : 'All Visions';

  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterText}>{displayText}</Text>
        <ChevronDown size={16} color="#A7A7A7" />
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.filterModal}>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                onSelectVision(null);
                setIsOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterOptionText,
                !selectedVisionId && styles.filterOptionTextActive
              ]}>
                All Visions
              </Text>
            </TouchableOpacity>
            
            {visions.map((vision) => (
              <TouchableOpacity
                key={vision.id}
                style={styles.filterOption}
                onPress={() => {
                  onSelectVision(vision.id);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.visionColorDot, { backgroundColor: vision.color }]} />
                <Text style={[
                  styles.filterOptionText,
                  selectedVisionId === vision.id && styles.filterOptionTextActive
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

interface WallOfFameProps {
  sessions: Array<{
    major_win: string | null;
    completed_at: string;
    vision: { id: string; name: string; color: string };
  }>;
  selectedVisionId: string | null;
  uniqueVisions: Array<{ id: string; name: string; color: string }>;
  onSelectVision: (visionId: string | null) => void;
}

function WallOfFame({ sessions, selectedVisionId, uniqueVisions, onSelectVision }: WallOfFameProps) {
  const achievements = sessions
    .filter(session => {
      if (!session.major_win) return false;
      if (selectedVisionId && session.vision.id !== selectedVisionId) return false;
      return true;
    })
    .map(session => ({
      title: session.major_win!,
      date: new Date(session.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      visionName: session.vision.name,
      visionColor: session.vision.color,
    }));

  return (
    <View style={styles.wallOfFameContainer}>
      <View style={styles.wallOfFameHeaderRow}>
        <Text style={styles.wallOfFameTitle}>Wall of Fame</Text>
        <VisionFilterDropdown
          visions={uniqueVisions}
          selectedVisionId={selectedVisionId}
          onSelectVision={onSelectVision}
        />
      </View>
      {achievements.length === 0 ? (
        <Text style={styles.emptyWallText}>
          No achievements yet. Complete sessions with major wins to see them here!
        </Text>
      ) : (
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                {!selectedVisionId && (
                  <View style={styles.achievementVision}>
                    <View style={[styles.visionColorDot, { backgroundColor: achievement.visionColor }]} />
                    <Text style={styles.achievementVisionName}>{achievement.visionName}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProductivityTab() {
  const { 
    sessions, 
    loading, 
    error, 
    calculateStats, 
    getVisionRankings, 
    getWeeklyData
  } = useProductivityData();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedWallOfFameVisionId, setSelectedWallOfFameVisionId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const handleCalendarDateSelect = (date: Date) => {
    // Calculate week offset for the selected date
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    
    const selectedWeekStart = new Date(date);
    selectedWeekStart.setDate(date.getDate() - date.getDay());
    
    const weekDiff = Math.floor((selectedWeekStart.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
    setWeekOffset(weekDiff);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Productivity</Text>
          <Text style={styles.subtitle}>Analytics & insights</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#329BA4" />
          <Text style={styles.loadingText}>Loading your productivity data...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Productivity</Text>
          <Text style={styles.subtitle}>Analytics & insights</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load productivity data</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </View>
    );
  }

  const stats = calculateStats();
  const visionRankings = getVisionRankings();
  const weekData = getWeeklyData(weekOffset);
  
  // Get unique visions for Wall of Fame filter
  const uniqueVisions = Array.from(
    new Map(sessions.map(session => [session.vision.id, session.vision])).values()
  ).map(vision => ({
    id: vision.id,
    name: vision.name,
    color: vision.color,
  }));
  
  // Format header subtitle based on days since joining
  const getHeaderSubtitle = () => {
    if (stats.daysSinceJoining < 60) {
      const dayText = stats.daysSinceJoining === 1 ? 'day' : 'days';
      return `${stats.totalHours} mastery hour${stats.totalHours !== 1 ? 's' : ''} in ${stats.daysSinceJoining} ${dayText}`;
    } else {
      const months = Math.floor(stats.daysSinceJoining / 30);
      const monthText = months === 1 ? 'month' : 'months';
      return `${stats.totalHours} mastery hours in ${months} ${monthText}`;
    }
  };

  const handleVisionPress = (visionId: string) => {
    // Navigate to mastery tab and select this vision
    router.push('/(tabs)/mastery');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productivity</Text>
        <Text style={styles.subtitle}>{getHeaderSubtitle()}</Text>
        {stats.totalHours >= 24 && (
          <Text style={styles.fullDaysText}>
            That's {Math.round(stats.totalHours / 24)} full days!
          </Text>
        )}
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Snapshot */}
        <View style={styles.statsContainer}>
          <StatsCard
            title={`${stats.activeDays} days`}
            subtitle={`out of ${stats.totalDays}`}
          />
          <StatsCard
            title={`${stats.dailyAverage} mins`}
            subtitle="daily average"
          />
        </View>

        {/* Vision Rankings */}
        {visionRankings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Top Visions</Text>
            {visionRankings.map((vision) => (
              <VisionRankCard
                key={vision.id}
                vision={vision}
                onPress={() => handleVisionPress(vision.id)}
              />
            ))}
          </View>
        )}

        {/* Week Navigator */}
        <WeekNavigator
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          onCalendarPress={() => setShowCalendar(true)}
        />

        {/* Productivity Chart */}
        <ProductivityChart weekData={weekData} sessions={sessions} height={400} />

        {/* Wall of Fame */}
        <WallOfFame 
          sessions={sessions}
          selectedVisionId={selectedWallOfFameVisionId}
          uniqueVisions={uniqueVisions}
          onSelectVision={setSelectedWallOfFameVisionId}
        />
      </ScrollView>
      
      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleCalendarDateSelect}
        currentDate={new Date()}
        weekOffset={weekOffset}
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
  fullDaysText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
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
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  visionCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  visionRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  visionRankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  visionInfo: {
    flex: 1,
  },
  visionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  visionDays: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  visionViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visionViewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  weekNavigatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekHeader: {
    flex: 1,
  },
  weekTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarButton: {
    padding: 4,
  },
  weekNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  weekDates: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  visionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  wallOfFameSection: {
    marginBottom: 24,
  },
  wallOfFameHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  wallOfFameContainer: {
    marginBottom: 24,
  },
  wallOfFameHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wallOfFameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  achievementsGrid: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
  },
  achievementHeader: {
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  achievementVision: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  achievementVisionName: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  achievementDate: {
    fontSize: 13,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  emptyWallText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    textAlign: 'left',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarModal: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  calendarDayEmpty: {
    // Empty day cells
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calendarDayCurrentWeek: {
    backgroundColor: '#1C1C1C',
  },
  calendarDaySelectedWeek: {
    backgroundColor: '#329BA4',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterContainer: {
    position: 'relative',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  filterModal: {
    backgroundColor: '#111111',
    borderRadius: 12,
    minWidth: 200,
    maxWidth: 300,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  filterOptionTextActive: {
    color: '#329BA4',
    fontWeight: '500',
  },
});