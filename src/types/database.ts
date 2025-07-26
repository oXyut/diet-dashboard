export type Database = {
  public: {
    Tables: {
      health_data: {
        Row: {
          id: string;
          date: string;
          weight: number | null;
          body_fat_percentage: number | null;
          muscle_mass: number | null;
          steps: number | null;
          active_calories: number | null;
          resting_calories: number | null;
          total_calories: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          weight?: number | null;
          body_fat_percentage?: number | null;
          muscle_mass?: number | null;
          steps?: number | null;
          active_calories?: number | null;
          resting_calories?: number | null;
          total_calories?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          weight?: number | null;
          body_fat_percentage?: number | null;
          muscle_mass?: number | null;
          steps?: number | null;
          active_calories?: number | null;
          resting_calories?: number | null;
          total_calories?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};