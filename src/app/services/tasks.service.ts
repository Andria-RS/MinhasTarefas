import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.client';
import { Task } from './task';

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = getSupabase();
  }

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
