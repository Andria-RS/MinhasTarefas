export interface Task {
  id?: number;
  project_id: number;
  title: string;
  description?: string;
  due_date: string;      // '2026-02-07'
  due_time?: string;     // '14:30:00'
  image_url?: string;
  completed: boolean;
  created_at?: string;
}
