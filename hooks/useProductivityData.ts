import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ProductivitySession {
  id: string;
  habit_id: string;
  vision_id: string;
  duration_minutes: number;
  accomplishment: string;
  completed_at: string;
  habit: {
    id: string;
    name: string;
    vision_id: string;
  };
  vision: {
    id: string;
    name: string;
    color: string;
  };
}

export interface VisionRanking {
  id: string;
  name: string;
  color: string;
  activeDays: number;
  rank: number;
}

export interface WeeklyData {
  date: string;
  dayName: string;
  sessions: ProductivitySession[];
  totalMinutes: number;
  visionData: { [visionId: string]: { minutes: number; name: string; color: string } };
}

export function useProductivityData() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ProductivitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductivityData = async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select(`
          *,
          habit:habits(id, name, vision_id),
          vision:visions(id, name, color)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching productivity data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch productivity data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductivityData();
  }, [user]);

  const calculateStats = () => {
    if (!sessions.length) {
      return {
        totalHours: 0,
        daysSinceJoining: 1,
        activeDays: 0,
        totalDays: 0,
        dailyAverage: 0,
      };
    }

    // Calculate total hours
    const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Calculate days since first session or user creation
    const firstSessionDate = new Date(Math.min(...sessions.map(s => new Date(s.completed_at).getTime())));
    const userCreatedDate = user ? new Date(user.created_at) : firstSessionDate;
    const earliestDate = firstSessionDate < userCreatedDate ? firstSessionDate : userCreatedDate;
    
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceJoining = Math.max(1, daysDiff + 1);

    // Calculate active days
    const uniqueDays = new Set(
      sessions.map(session => 
        new Date(session.completed_at).toDateString()
      )
    );
    const activeDays = uniqueDays.size;

    const totalDays = daysSinceJoining;

    // Calculate daily average
    const dailyAverage = Math.round(totalMinutes / totalDays);

    return {
      totalHours,
      daysSinceJoining,
      activeDays,
      totalDays,
      dailyAverage,
    };
  };

  const getVisionRankings = (): VisionRanking[] => {
    if (!sessions.length) return [];

    // Group sessions by vision and calculate active days
    const visionStats = new Map<string, { vision: any; activeDays: Set<string> }>();

    sessions.forEach(session => {
      const visionId = session.vision.id;
      const dayString = new Date(session.completed_at).toDateString();

      if (!visionStats.has(visionId)) {
        visionStats.set(visionId, {
          vision: session.vision,
          activeDays: new Set(),
        });
      }

      visionStats.get(visionId)!.activeDays.add(dayString);
    });

    // Convert to rankings
    const rankings = Array.from(visionStats.entries())
      .map(([visionId, stats]) => ({
        id: visionId,
        name: stats.vision.name,
        color: stats.vision.color,
        activeDays: stats.activeDays.size,
        rank: 0, // Will be set below
      }))
      .sort((a, b) => b.activeDays - a.activeDays);

    // Assign ranks
    rankings.forEach((vision, index) => {
      vision.rank = index + 1;
    });

    return rankings;
  };

  const getWeeklyData = (weekOffset: number = 0): WeeklyData[] => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + (weekOffset * 7));
    currentWeekStart.setHours(0, 0, 0, 0);

    const weekData: WeeklyData[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      
      const dateString = date.toDateString();
      const daySessions = sessions.filter(session => 
        new Date(session.completed_at).toDateString() === dateString
      );

      const totalMinutes = daySessions.reduce((sum, session) => sum + session.duration_minutes, 0);

      // Group sessions by vision for this day
      const visionData: { [visionId: string]: { minutes: number; name: string; color: string } } = {};
      daySessions.forEach(session => {
        const visionId = session.vision.id;
        if (!visionData[visionId]) {
          visionData[visionId] = {
            minutes: 0,
            name: session.vision.name,
            color: session.vision.color,
          };
        }
        visionData[visionId].minutes += session.duration_minutes;
      });

      weekData.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        sessions: daySessions,
        totalMinutes,
        visionData,
      });
    }

    return weekData;
  };

  const getSessionsForDate = (date: string): ProductivitySession[] => {
    const targetDate = new Date(date).toDateString();
    return sessions.filter(session => 
      new Date(session.completed_at).toDateString() === targetDate
    );
  };

  const refetch = () => {
    fetchProductivityData();
  };

  return {
    sessions,
    loading,
    error,
    refetch,
    calculateStats,
    getVisionRankings,
    getWeeklyData,
    getSessionsForDate,
  };
}