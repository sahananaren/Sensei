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
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string | null) => void;
}

function FilterDropdown({ habits, selectedHabitId, onSelectHabit }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

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

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate: Date;
}

function MonthYearPickerModal({ visible, onClose, onDateSelect, currentDate }: MonthYearPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onDateSelect(newDate);
    onClose();
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.monthPickerModal}>
          <Text style={styles.monthPickerTitle}>Select Month & Year</Text>
          
          <View style={styles.monthPickerContent}>
            <View style={styles.monthPickerSection}>
              <Text style={styles.monthPickerSectionTitle}>Year</Text>
              <View style={styles.monthPickerGrid}>
                {years.map((year) => (
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
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthPickerItem,
                      selectedMonth === index && styles.monthPickerItemActive
                    ]}
                    onPress={() => setSelectedMonth(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.monthPickerItemText,
                      selectedMonth === index && styles.monthPickerItemTextActive
                    ]}>
                      {month.substring(0, 3)}
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
    const startingDayOfWeek = firstDay.getDay();

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
    
    // Create different intensities based on minutes
    if (minutes < 30) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
    if (minutes < 60) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
    if (minutes < 120) return visionColor;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1.2)`; // Slightly more intense
  };

  const { year, month, daysInMonth, startingDayOfWeek, sessionsByDay } = getMonthData();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

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
          selectedHabitId={selectedHabitId}
          onSelectHabit={onSelectHabit}
        />
      </View>

      <View style={styles.weekDays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={index} style={styles.weekDayLabel}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendar}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.calendarDay,
              {
                backgroundColor: day 
                  ? getIntensityColor(sessionsByDay[day] || 0)
                  : 'transparent'
              },
              day && selectedDate && new Date(Date.UTC(year, month, day)).toISOString().split('T')[0] === selectedDate && {
                borderWidth: 2,
                borderColor: visionColor,
              }
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

      <MonthYearPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        onDateSelect={setCurrentDate}
        currentDate={currentDate}
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
    overflow: 'hidden',
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
    gap: gapSize,
  },
  weekDayLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#A7A7A7',
    fontFamily: 'Inter',
    width: itemWidth,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gapSize,
  },
  calendarDay: {
    width: itemWidth,
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