import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface FocusSession {
  id: string;
  user_id: string;
  habit_id: string;
  vision_id: string;
  intention: string | null;
  duration_minutes: number;
  accomplishment: string;
  major_win: string | null;
  milestone_ids: string[];
  created_at: string;
  completed_at: string;
}

export interface FocusSessionWithHabit extends FocusSession {
  habit: {
    id: string;
    name: string;
  };
}

export function useFocusSessions(visionId?: string) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSessionWithHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('focus_sessions')
        .select(`
          *,
          habit:habits(id, name)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (visionId) {
        query = query.eq('vision_id', visionId);
      }

      const { data, error: sessionsError } = await query;

      if (sessionsError) throw sessionsError;

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching focus sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [user, visionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const refetch = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch,
  };
}