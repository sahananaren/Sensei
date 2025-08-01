import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarHeatmapProps {
  sessions: Array<{
    completed_at: string;
    duration_minutes: number;
    habit_id: string;
  }>;
  habits: Array<{ id: string; name: string }>;
  selectedHabitId?: string | null;
  onSelectHabit: (habitId: string | null) => void;
  visionColor: string;
  onDayPress?: (date: string) => void;
  selectedDate?: string;
}

interface FilterDropdownProps {
  habits: Array<{ id: string; name: string }>;
  selectedHabitId: string | null | undefined; // Allow undefined to match parent interface
  onSelectHabit: (habitId: string | null) => void;
}

function FilterDropdown({ habits, selectedHabitId, onSelectHabit }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle the case where selectedHabitId might be undefined
  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const displayText = selectedHabit ? selectedHabit.name : 'All Habits';

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
                onSelectHabit(null);
                setIsOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterOptionText,
                !selectedHabitId && styles.filterOptionTextActive
              ]}>
                All Habits
              </Text>
            </TouchableOpacity>
            
            {habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.filterOption}
                onPress={() => {
                  onSelectHabit(habit.id);
                  setIsOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedHabitId === habit.id && styles.filterOptionTextActive
                ]}>
                  {habit.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// Update the interface:
interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate: Date;
  sessions: Array<{ completed_at: string; duration_minutes: number; habit_id: string }>;
  isGraduated?: boolean;
}

// Update the MonthYearPickerModal to remove inactive months:
function MonthYearPickerModal({ visible, onClose, onDateSelect, currentDate, sessions, isGraduated }: MonthYearPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  
  // Get years and months with activity
  const getActivityData = () => {
    const activityMap = new Map<string, Set<number>>();
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_at);
      const year = sessionDate.getFullYear();
      const month = sessionDate.getMonth();
      
      if (!activityMap.has(year.toString())) {
        activityMap.set(year.toString(), new Set());
      }
      activityMap.get(year.toString())!.add(month);
    });
    
    // For active visions, always include current year and month
    if (!isGraduated) {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      if (!activityMap.has(currentYear.toString())) {
        activityMap.set(currentYear.toString(), new Set());
      }
      activityMap.get(currentYear.toString())!.add(currentMonth);
    }
    
    return activityMap;
  };
  
  // Get available months for selected year
  const getAvailableMonths = (year: number) => {
    const activityMap = getActivityData();
    const activeMonths = activityMap.get(year.toString()) || new Set<number>();
    
    if (isGraduated) {
      // For graduated visions: only show months with activity
      return Array.from(activeMonths).sort((a, b) => a - b);
    } else {
      // For active visions: show active months + current month if it's the current year
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      const allMonths = new Set(activeMonths);
      if (year === currentYear) {
        allMonths.add(currentMonth);
      }
      
      return Array.from(allMonths).sort((a, b) => a - b);
    }
  };
  
  // Get the default month/year based on vision status
  const getDefaultDate = () => {
    const activityMap = getActivityData();
    const activityYears = Array.from(activityMap.keys()).map(Number).sort((a, b) => b - a);
    
    if (isGraduated && activityYears.length > 0) {
      // For graduated visions, use the last activity year
      const lastYear = activityYears[0];
      const lastYearMonths = Array.from(activityMap.get(lastYear.toString())!).sort((a, b) => b - a);
      return { year: lastYear, month: lastYearMonths[0] };
    } else {
      // For active visions, use current date
      return { year: currentDate.getFullYear(), month: currentDate.getMonth() };
    }
  };
  
  // Set default when modal opens
  React.useEffect(() => {
    if (visible) {
      const defaultDate = getDefaultDate();
      setSelectedYear(defaultDate.year);
      setSelectedMonth(defaultDate.month);
    }
  }, [visible, isGraduated]);
  
  const activityMap = getActivityData();
  const activityYears = Array.from(activityMap.keys()).map(Number).sort((a, b) => b - a);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const availableMonths = getAvailableMonths(selectedYear);
  
  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, 1);
    onDateSelect(selectedDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.monthPickerModal}>
          <Text style={styles.monthPickerTitle}>Select Month</Text>
          
          <View style={styles.monthPickerContent}>
            <View style={styles.monthPickerSection}>
              <Text style={styles.monthPickerSectionTitle}>Year</Text>
              <View style={styles.monthPickerGrid}>
                {activityYears.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.monthPickerItem,
                      selectedYear === year && styles.monthPickerItemActive
                    ]}
                    onPress={() => setSelectedYear(year)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthPickerItemText,
                      selectedYear === year && styles.monthPickerItemTextActive
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.monthPickerSection}>
              <Text style={styles.monthPickerSectionTitle}>Month</Text>
              <View style={styles.monthPickerGrid}>
                {availableMonths.map((monthIndex) => (
                  <TouchableOpacity
                    key={`${selectedYear}-${monthIndex}`}
                    style={[
                      styles.monthPickerItem,
                      selectedMonth === monthIndex && styles.monthPickerItemActive
                    ]}
                    onPress={() => setSelectedMonth(monthIndex)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthPickerItemText,
                      selectedMonth === monthIndex && styles.monthPickerItemTextActive
                    ]}>
                      {months[monthIndex]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.monthPickerButtons}>
            <TouchableOpacity
              style={styles.monthPickerCancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.monthPickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.monthPickerConfirmButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.monthPickerConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function CalendarHeatmap({ 
  sessions, 
  habits, 
  selectedHabitId, 
  onSelectHabit, 
  visionColor, 
  onDayPress, 
  selectedDate 
}: CalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Fix: Use UTC to avoid locale-specific behavior
    // This ensures Sunday is always 0, Monday is 1, etc.
    const startingDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();

    // Debug logging to verify alignment
    console.log('Calendar Alignment Debug:', {
      year,
      month,
      firstDay: firstDay.toDateString(),
      startingDayOfWeek,
      utcStartingDayOfWeek: new Date(Date.UTC(year, month, 1)).getUTCDay(),
      weekDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      expectedFirstDay: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][startingDayOfWeek]
    });

    // Filter sessions for current month
    const monthSessions = sessions.filter(session => {
      if (selectedHabitId && session.habit_id !== selectedHabitId) {
        return false;
      }
      const sessionDate = new Date(session.completed_at);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });

    // Group sessions by day
    const sessionsByDay: { [key: number]: number } = {};
    monthSessions.forEach(session => {
      const day = new Date(session.completed_at).getDate();
      sessionsByDay[day] = (sessionsByDay[day] || 0) + session.duration_minutes;
    });

    return {
      year,
      month,
      daysInMonth,
      startingDayOfWeek,
      sessionsByDay,
    };
  };

  // Update the getIntensityColor function to show 5 levels of opacity:
  const getIntensityColor = (minutes: number) => {
    if (minutes === 0) return '#1C1C1C';
    
    // Convert hex to RGB for opacity calculations
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb = hexToRgb(visionColor);
    if (!rgb) return visionColor; // Fallback to original color
    
    // Create 5 levels of opacity based on minutes
    if (minutes < 15) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`; // 20%
    if (minutes < 30) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`; // 40%
    if (minutes < 60) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`; // 60%
    if (minutes < 120) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`; // 80%
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1.0)`; // 100%
  };

  const { year, month, daysInMonth, startingDayOfWeek, sessionsByDay } = getMonthData();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

  // Replace the calendar rendering logic with a proper 7-column grid:
  const renderCalendarGrid = () => {
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      // If we have 7 days in the week, start a new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining days to the last week
    if (currentWeek.length > 0) {
      // Fill remaining slots with null
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.monthSection}>
          <Text style={styles.monthTitle}>{monthName} {year}</Text>
          <TouchableOpacity 
            style={styles.calendarIconButton}
            onPress={() => setShowMonthPicker(true)} 
            activeOpacity={0.7}
          >
            <Calendar size={16} color="#A7A7A7" />
          </TouchableOpacity>
        </View>
        
        <FilterDropdown
          habits={habits}
          selectedHabitId={selectedHabitId || null} // Provide default value
          onSelectHabit={onSelectHabit}
        />
      </View>

      <View style={styles.weekDays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={index} style={styles.weekDayLabel}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendar}>
        {renderCalendarGrid().map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.calendarDay,
                  {
                    backgroundColor: day 
                      ? getIntensityColor(sessionsByDay[day] || 0)
                      : 'transparent'
                  },
                  day && selectedDate && new Date(Date.UTC(year, month, day)).toISOString().split('T')[0] === selectedDate ? {
                    borderWidth: 2,
                    borderColor: visionColor,
                  } : {}
                ]}
                onPress={() => {
                  if (day && onDayPress) {
                    const clickedDate = new Date(Date.UTC(year, month, day));
                    onDayPress(clickedDate.toISOString().split('T')[0]);
                  }
                }}
                disabled={!day}
                activeOpacity={0.7}
              >
                {day && (
                  <View style={styles.dayContent}>
                    <Text style={styles.dayNumber}>{day}</Text>
                    {sessionsByDay[day] > 0 && (
                      <Text style={styles.dayMinutes}>{sessionsByDay[day]}m</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <MonthYearPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        onDateSelect={setCurrentDate}
        currentDate={currentDate}
        sessions={sessions}
        isGraduated={false} // Assuming active vision for now
      />
    </View>
  );
}

// Calculate dynamic dimensions for calendar layout
const screenWidth = Dimensions.get('window').width;
const calendarHorizontalPadding = 20; // Corresponds to scrollContent padding in mastery.tsx
const gapSize = 4;
const numberOfDaysInWeek = 7;

const availableWidth = screenWidth - (2 * calendarHorizontalPadding);
const itemWidth = (availableWidth - (numberOfDaysInWeek - 1) * gapSize) / numberOfDaysInWeek;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0, // Remove any horizontal padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  calendarIconButton: {
    padding: 4,
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
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '98%', // Match the calendar width
    gap: gapSize,
  },
  weekDayLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    width: `${97 / 7}%`,
  },
  calendar: {
    width: '98%', // Reduce from 100% to 95% to account for gaps
  },
  weekRow: {
    flexDirection: 'row',
    width: '98%', // Match the calendar width
    marginBottom: gapSize,
    gap: gapSize,
  },
  calendarDay: {
    width: `${98 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,

  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  dayMinutes: {
    fontSize: 9,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  monthPickerModal: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  monthPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 24,
  },
  monthPickerContent: {
    marginBottom: 24,
  },
  monthPickerSection: {
    marginBottom: 20,
  },
  monthPickerSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  monthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthPickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
    minWidth: 60,
    alignItems: 'center',
  },
  monthPickerItemActive: {
    backgroundColor: '#329BA4',
  },
  monthPickerItemDisabled: {
    backgroundColor: '#0A0A0A',
    opacity: 0.5,
  },
  monthPickerItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A7A7A7',
    fontFamily: 'Inter',
  },
  monthPickerItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  monthPickerItemTextDisabled: {
    color: '#666666',
  },
  monthPickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  monthPickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1C1C1C',
    alignItems: 'center',
  },
  monthPickerCancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  monthPickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#329BA4',
    alignItems: 'center',
  },
  monthPickerConfirmText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});