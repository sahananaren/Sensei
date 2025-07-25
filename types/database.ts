export interface Database {
  public: {
    Tables: {
      visions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          color: string;
          status: 'active' | 'graduated' | 'deleted';
          created_at: string;
          graduated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          color?: string;
          status?: 'active' | 'graduated' | 'deleted';
          created_at?: string;
          graduated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          color?: string;
          status?: 'active' | 'graduated' | 'deleted';
          created_at?: string;
          graduated_at?: string | null;
        };
      };
      milestones: {
        Row: {
          id: string;
          vision_id: string;
          name: string;
          status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          vision_id: string;
          name: string;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          vision_id?: string;
          name?: string;
          status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          completed_at?: string | null;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          vision_id: string;
          name: string;
          status: 'active' | 'graduated' | 'deleted';
          created_at: string;
          graduated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          vision_id: string;
          name: string;
          status?: 'active' | 'graduated' | 'deleted';
          created_at?: string;
          graduated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          vision_id?: string;
          name?: string;
          status?: 'active' | 'graduated' | 'deleted';
          created_at?: string;
          graduated_at?: string | null;
        };
      };
      focus_sessions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          vision_id: string;
          intention?: string | null;
          duration_minutes?: number;
          accomplishment: string;
          major_win?: string | null;
          milestone_ids?: string[];
          created_at?: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          vision_id?: string;
          intention?: string | null;
          duration_minutes?: number;
          accomplishment?: string;
          major_win?: string | null;
          milestone_ids?: string[];
          created_at?: string;
          completed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}