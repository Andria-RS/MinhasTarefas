export interface Project {
  id?: number;
  name: string;
  description?: string;
  category_id: number;
  created_at?: string;
  status?: 'por-fazer' | 'feito';
}
