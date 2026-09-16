import { type Task } from '../types/task';
import { MOCK_TASKS } from '../data/task';

export function getTaskById(id: string): Task | undefined {
  return MOCK_TASKS.find(task => task.id === id);
}

export function getAllTasks(): Task[] {
  return MOCK_TASKS;
}

export function getTasksByStatus(status: string): Task[] {
  return MOCK_TASKS.filter(task => task.status === status);
}
