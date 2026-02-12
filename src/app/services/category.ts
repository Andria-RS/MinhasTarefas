/**
 * Interface que define a estrutura de uma categoria.
 * Cada categoria agrupa múltiplos projetos e tem um ícone associado para identificação visual.
 */
export interface Category {
  /** Identificador único da categoria (gerado automaticamente pela base de dados). */
  id?: number;

  /** Nome da categoria. */
  name: string;

  /** Nome do ícone Ionicons associado à categoria (ex: 'home-outline'). */
  icon?: string;

  /** Número total de projetos associados à categoria (campo calculado). */
  total_projects?: number;
}
