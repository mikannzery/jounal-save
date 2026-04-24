export interface Database {
  public: {
    Tables: {
      clip_tags: {
        Row: {
          clip_id: string;
          id: string;
          tag_id: string;
        };
        Insert: {
          clip_id: string;
          id?: string;
          tag_id: string;
        };
        Update: {
          clip_id?: string;
          id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      clips: {
        Row: {
          ai_summary: string | null;
          ai_summary_updated_at: string | null;
          body: string | null;
          created_at: string;
          id: string;
          image_path: string | null;
          is_archived: boolean;
          is_favorite: boolean;
          memo: string | null;
          title: string;
          updated_at: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          is_archived?: boolean;
          is_favorite?: boolean;
          memo?: string | null;
          title: string;
          updated_at?: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          body?: string | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          is_archived?: boolean;
          is_favorite?: boolean;
          memo?: string | null;
          title?: string;
          updated_at?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
