import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
  sessions: any[];
  totalMinutes: number;
  visionData: { [visionId: string]: { minutes: number; name: string; color: string } };
}

export function useProductivityData() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [visions, setVisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setVisions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all sessions for the user
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select(`
          *,
          vision:visions(id, name, color, status),
          habit:habits(id, name, status)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch all visions (active and graduated) for the user
      const { data: visionsData, error: visionsError } = await supabase
        .from('visions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'graduated']) // Include both active and graduated visions
        .order('status', { ascending: true }) // Active first, then graduated
        .order('graduated_at', { ascending: false }) // Most recently graduated first
        .order('created_at', { ascending: true });

      if (visionsError) throw visionsError;

      setSessions(sessionsData || []);
      setVisions(visionsData || []);
    } catch (err) {
      console.error('Error fetching productivity data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Calculate vision rankings based on active days
  const calculateVisionRankings = useCallback(() => {
    const visionStats = new Map<string, { name: string; color: string; activeDays: number }>();

    // Count active days for each vision
    sessions.forEach(session => {
      if (session.vision && session.vision.status !== 'deleted') {
        const visionId = session.vision.id;
        const date = new Date(session.completed_at).toDateString();
        
        if (!visionStats.has(visionId)) {
          visionStats.set(visionId, {
            name: session.vision.name,
            color: session.vision.color,
            activeDays: 0
          });
        }
        
        const stats = visionStats.get(visionId)!;
        if (!stats.activeDays || !stats.activeDays.toString().includes(date)) {
          stats.activeDays++;
        }
      }
    });

    // Convert to array and sort by active days
    const rankings: VisionRanking[] = Array.from(visionStats.entries())
      .map(([id, stats], index) => ({
        id,
        name: stats.name,
        color: stats.color,
        activeDays: stats.activeDays,
        rank: index + 1
      }))
      .sort((a, b) => b.activeDays - a.activeDays)
      .map((vision, index) => ({ ...vision, rank: index + 1 }));

    return rankings;
  }, [sessions]);

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

  const getSessionsForDate = (date: string): any[] => {
    const targetDate = new Date(date).toDateString();
    return sessions.filter(session => 
      new Date(session.completed_at).toDateString() === targetDate
    );
  };

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    sessions,
    visions,
    visionRankings: calculateVisionRankings(),
    loading,
    error,
    refetch,
    calculateStats,
    getWeeklyData,
    getSessionsForDate,
  };
}