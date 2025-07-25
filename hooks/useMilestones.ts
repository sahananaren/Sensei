import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Milestone {
  id: string;
  vision_id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  created_at: string;
  completed_at: string | null;
  has_sessions?: boolean;
}

export function useMilestones(visionId: string) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = async () => {
    if (!user || !visionId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('vision_id', visionId)
        .order('created_at', { ascending: true });

      if (milestonesError) throw milestonesError;

      // Fetch focus sessions to determine which milestones have been used
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('milestone_ids')
        .eq('user_id', user.id)
        .eq('vision_id', visionId);

      if (sessionsError) throw sessionsError;

      // Get all milestone IDs that have been referenced in sessions
      const referencedMilestoneIds = new Set<string>();
      sessionsData?.forEach(session => {
        if (session.milestone_ids && Array.isArray(session.milestone_ids)) {
          session.milestone_ids.forEach(id => referencedMilestoneIds.add(id));
        }
      });

      // Add has_sessions flag to each milestone
      const milestonesWithSessions = (data || []).map(milestone => ({
        ...milestone,
        has_sessions: referencedMilestoneIds.has(milestone.id),
      }));

      setMilestones(milestonesWithSessions);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [user, visionId]);

  const addMilestone = async (name: string) => {
    if (!user || !visionId) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .insert({
          vision_id: visionId,
          name: name.trim(),
        });

      if (error) throw error;
      await fetchMilestones();
    } catch (err) {
      console.error('Error adding milestone:', err);
      throw err;
    }
  };

  const updateMilestone = async (id: string, updates: Partial<Milestone>) => {
    try {
      // Remove has_sessions from updates as it's not a database field
      const { has_sessions, ...dbUpdates } = updates;
      
      const { error } = await supabase
        .from('milestones')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchMilestones();
    } catch (err) {
      console.error('Error updating milestone:', err);
      throw err;
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMilestones();
    } catch (err) {
      console.error('Error deleting milestone:', err);
      throw err;
    }
  };

  const refetch = () => {
    fetchMilestones();
  };

  // Add real-time subscription for milestone updates
  useEffect(() => {
    if (!user || !visionId) return;

    const subscription = supabase
      .channel(`milestones-${visionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'milestones',
          filter: `vision_id=eq.${visionId}`
        }, 
        () => {
          fetchMilestones();
        }
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }, [user, visionId]);

  return {
    milestones,
    loading,
    error,
    refetch,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  };
}