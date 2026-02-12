import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { Task } from './task';

@Injectable({
  providedIn: 'root'
})

/**
 * Serviço responsável pela gestão de tarefas.
 * Realiza operações CRUD (Create, Read, Update, Delete) na tabela 'tasks' do Supabase.
 * Permite consultar todas as tarefas, filtrar por projeto, e gerir tarefas em atraso.
 */
export class TasksService {
  /** Cliente Supabase para comunicação com a base de dados remota. */
  private supabaseClient: SupabaseClient;

  /**
   * Construtor do serviço de tarefas.
   * Inicializa o cliente Supabase através da função getSupabase().
   */
  constructor() {
    this.supabaseClient = getSupabase();
  }

  /**
   * Obtém todas as tarefas da base de dados.
   * As tarefas são ordenadas por data de vencimento (mais antigas primeiro).
   * @returns Promise com array de tarefas ou array vazio em caso de erro.
   */
  async getAllTasks(): Promise<Task[]> {
    const { data, error } = await this.supabaseClient
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data as Task[];
  }

  /**
   * Obtém todas as tarefas de um projeto específico.
   * @param projectId - ID do projeto cujas tarefas se pretende obter.
   * @returns Promise com array de tarefas do projeto ordenadas por data de vencimento.
   */
  async getTasksByProject(projectId: number): Promise<Task[]> {
    const { data, error } = await this.supabaseClient
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data as Task[];
  }

  /**
   * Obtém uma tarefa específica pelo seu ID.
   * @param id - ID da tarefa a pesquisar.
   * @returns Promise com a tarefa encontrada ou null se não existir ou ocorrer erro.
   */
  async getTaskById(id: number): Promise<Task | null> {
    const { data, error } = await this.supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      return null;
    }
    return data as Task;
  }

  /**
   * Insere uma nova tarefa na base de dados.
   * @param task - Objeto Task com os dados da nova tarefa a criar.
   * @returns Promise com a tarefa criada (incluindo ID gerado) ou null em caso de erro.
   */
  async insertTask(task: Task): Promise<Task | null> {
    const { data, error } = await this.supabaseClient
      .from('tasks')
      .insert({
        project_id: task.project_id,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        due_time: task.due_time,
        image_url: task.image_url,
        completed: task.completed
      })
      .select() 
      .single();

    if (error) {
      console.error(error);
      return null;
    }
    return data as Task;
  }

  /**
   * Atualiza os dados de uma tarefa existente.
   * @param task - Objeto Task com os dados atualizados (deve conter o ID da tarefa).
   * @throws Lança erro se a atualização falhar.
   */
  async updateTask(task: Task): Promise<void> {
    const { error } = await this.supabaseClient
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        due_time: task.due_time,
        image_url: task.image_url,
        completed: task.completed,
        project_id: task.project_id
      })
      .eq('id', task.id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao atualizar tarefa');
    }
  }

  /**
   * Elimina uma tarefa da base de dados.
   * @param id - ID da tarefa a eliminar.
   * @throws Lança erro se a eliminação falhar.
   */
  async deleteTask(id: number): Promise<void> {
    const { error } = await this.supabaseClient
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      throw new Error('Erro ao apagar tarefa');
    }
  }

  /**
   * Obtém todas as tarefas em atraso (não completadas com data anterior a hoje).
   * @param today - Data atual no formato string (YYYY-MM-DD) para comparação.
   * @returns Promise com array de tarefas em atraso ordenadas por data de vencimento.
   */
  async getOverdueTasks(today: string): Promise<Task[]> {
    const { data, error } = await this.supabaseClient
      .from('tasks')
      .select('*')
      .lt('due_date', today)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (error) {
      console.error(error);
      return [];
    }
    return data as Task[];
  }
}
