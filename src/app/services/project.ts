/**
 * Interface que define a estrutura de um projeto.
 * Cada projeto pertence a uma categoria e pode conter múltiplas tarefas.
 */
export interface Project {
  /** Identificador único do projeto (gerado automaticamente pela base de dados). */
  id?: number;
  
  /** Nome do projeto. */
  name: string;
  
  /** Descrição opcional do projeto. */
  description?: string;
  
  /** ID da categoria à qual o projeto pertence. */
  category_id: number;
  
  /** Estado atual do projeto: 'por-fazer' ou 'feito'. */
  status?: 'por-fazer' | 'feito';
  
  /** Número total de tarefas associadas ao projeto. */
  total_tasks?: number;
}
