/**
 * Interface que define a estrutura de uma tarefa.
 * Cada tarefa pertence a um projeto e contém informações como título, descrição,
 * data e hora de vencimento, imagem associada e estado de conclusão.
 */
export interface Task {
  /** Identificador único da tarefa (gerado automaticamente pela base de dados). */
  id?: number;

  /** ID do projeto ao qual a tarefa pertence. */
  project_id: number;

  /** Título da tarefa. */
  title: string;

  /** Descrição detalhada da tarefa (opcional). */
  description?: string;

  /** Data de vencimento da tarefa no formato string (ex: '2026-02-07'). */
  due_date: string; 

  /** Hora de vencimento da tarefa no formato string (ex: '14:30:00'). */
  due_time?: string;

  /** URL da imagem associada à tarefa (opcional). */
  image_url?: string;

   /** Indica se a tarefa está concluída ou não. */
  completed: boolean;

   /** Data e hora de criação da tarefa (gerada automaticamente). */
  created_at?: string;
}
