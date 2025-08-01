import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Vision {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'graduated' | 'deleted';
  created_at: string;
  graduated_at: string | null;
}

export interface Habit {
  id: string;
  user_id: string;
  vision_id: string;
  name: string;
  status: 'active' | 'graduated' | 'deleted';
  created_at: string;
  graduated_at: string | null;
}

export interface VisionWithHabits extends Vision {
  habits: Habit[];
}

export function useVisions() {
  const { user } = useAuth();
  const [visions, setVisions] = useState<VisionWithHabits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisions = useCallback(async () => {
    if (!user) {
      setVisions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch only active visions for the current user
      const { data: visionsData, error: visionsError } = await supabase
        .from('visions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') // Only show active visions
        .order('created_at', { ascending: true });

      if (visionsError) throw visionsError;

      if (!visionsData || visionsData.length === 0) {
        setVisions([]);
        setLoading(false);
        return;
      }

      // Fetch only active habits for all visions
      const visionIds = visionsData.map(v => v.id);
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .in('vision_id', visionIds)
        .eq('status', 'active') // Only show active habits
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Group habits by vision
      const visionsWithHabits: VisionWithHabits[] = visionsData.map(vision => ({
        ...vision,
        habits: habitsData?.filter(habit => habit.vision_id === vision.id) || []
      }));

      setVisions(visionsWithHabits);
    } catch (err) {
      console.error('Error fetching visions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch visions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVisions();
  }, [fetchVisions]);

  const refetch = useCallback(() => {
    fetchVisions();
  }, [fetchVisions]);

  return {
    visions,
    loading,
    error,
    refetch,
  };
}

// New hook for mastery that includes graduated visions
export function useVisionsForMastery() {
  const { user } = useAuth();
  const [visions, setVisions] = useState<VisionWithHabits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisions = useCallback(async () => {
    if (!user) {
      setVisions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch active and graduated visions (not deleted)
      const { data: visionsData, error: visionsError } = await supabase
        .from('visions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'graduated']) // Include both active and graduated
        .order('status', { ascending: true }) // Active first, then graduated
        .order('graduated_at', { ascending: false }) // Most recently graduated first
        .order('created_at', { ascending: true }); // Then by creation date

      if (visionsError) throw visionsError;

      if (!visionsData || visionsData.length === 0) {
        setVisions([]);
        setLoading(false);
        return;
      }

      // Fetch active and graduated habits for all visions
      const visionIds = visionsData.map(v => v.id);
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .in('vision_id', visionIds)
        .in('status', ['active', 'graduated']) // Include both active and graduated habits
        .order('status', { ascending: true }) // Active first, then graduated
        .order('graduated_at', { ascending: false }) // Most recently graduated first
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Group habits by vision
      const visionsWithHabits: VisionWithHabits[] = visionsData.map(vision => ({
        ...vision,
        habits: habitsData?.filter(habit => habit.vision_id === vision.id) || []
      }));

      setVisions(visionsWithHabits);
    } catch (err) {
      console.error('Error fetching visions for mastery:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch visions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVisions();
  }, [fetchVisions]);

  const refetch = useCallback(() => {
    fetchVisions();
  }, [fetchVisions]);

  return {
    visions,
    loading,
    error,
    refetch,
  };
}