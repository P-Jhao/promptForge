import { useEffect, useSyncExternalStore } from 'react';
import { type Task } from '../types/task';
import { getAllTasks } from '../services/taskService';
import { normalizePriority } from '../lib/utils';

interface TaskStoreState {
  allTasks: Task[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: string | null;
  priorityFilter: string | null;
}

let store: TaskStoreState = {
  allTasks: [],
  loaded: false,
  loading: true,
  error: null,
  searchTerm: '',
  statusFilter: null,
  priorityFilter: null
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

function setStore(partial: Partial<TaskStoreState>) {
  store = { ...store, ...partial };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return store;
}

let loadPromise: Promise<void> | null = null;

function ensureLoaded(force = false): Promise<void> {
  if (loadPromise) return loadPromise;
  if (!force && store.loaded) return Promise.resolve();
  setStore({ loading: true, error: null });
  loadPromise = (async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const tasks = (getAllTasks() ?? []).map(task => ({
        ...task,
        priority: normalizePriority(task?.priority)
      }));
      setStore({ allTasks: tasks, loaded: true, loading: false });
    } catch (err) {
      setStore({ error: 'Failed to load tasks', loading: false });
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

function matchesFilters(task: Task, state: TaskStoreState) {
  if (!task) return false;
  if (state.statusFilter && task.status !== state.statusFilter) return false;
  if (
    state.priorityFilter &&
    normalizePriority(task.priority) !== normalizePriority(state.priorityFilter)
  ) {
    return false;
  }
  const term = (state.searchTerm ?? '').trim().toLowerCase();
  if (term) {
    const haystack = `${task.title ?? ''} ${task.description ?? ''} ${task.assignee ?? ''}`.toLowerCase();
    if (!haystack.includes(term)) return false;
  }
  return true;
}

async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    setStore({ loading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 200));
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      priority: normalizePriority(taskData?.priority),
      id: `task_${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    setStore({ allTasks: [...(store.allTasks ?? []), newTask], loading: false });
    return newTask;
  } catch (err) {
    setStore({ error: 'Failed to create task', loading: false });
    throw err;
  }
}

async function updateTask(id: string, taskData: Partial<Task>) {
  try {
    setStore({ loading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 200));
    const patch: Partial<Task> = { ...(taskData ?? {}) };
    if (patch.priority) {
      patch.priority = normalizePriority(patch.priority);
    }
    setStore({
      allTasks: (store.allTasks ?? []).map(task =>
        task?.id === id
          ? { ...task, ...patch, updatedAt: new Date().toISOString() }
          : task
      ),
      loading: false
    });
  } catch (err) {
    setStore({ error: 'Failed to update task', loading: false });
    throw err;
  }
}

async function deleteTask(id: string) {
  try {
    setStore({ loading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 200));
    setStore({
      allTasks: (store.allTasks ?? []).filter(task => task?.id !== id),
      loading: false
    });
  } catch (err) {
    setStore({ error: 'Failed to delete task', loading: false });
    throw err;
  }
}

async function updateTaskStatus(id: string, status: string) {
  return updateTask(id, { status } as Partial<Task>);
}

export function useTasks() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureLoaded();
  }, []);

  const data = (state.allTasks ?? []).filter(task => matchesFilters(task, state));

  const setSearchTerm = (value: string) => {
    setStore({ searchTerm: value ?? '' });
  };

  const clearSearch = () => {
    setStore({ searchTerm: '' });
  };

  const setStatusFilter = (value: string | null) => {
    setStore({ statusFilter: value ?? null });
  };

  const setPriorityFilter = (value: string | null) => {
    setStore({ priorityFilter: value ?? null });
  };

  const refresh = () => ensureLoaded(true);

  return {
    data,
    loading: state.loading,
    error: state.error,
    searchTerm: state.searchTerm,
    setSearchTerm,
    statusFilter: state.statusFilter,
    setStatusFilter,
    priorityFilter: state.priorityFilter,
    setPriorityFilter,
    refresh,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    clearSearch
  };
}

export function useTask(id: string) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureLoaded();
  }, []);

  const data = id ? state.allTasks.find((task) => task.id === id) ?? null : null;
  const loading = Boolean(id) && (!state.loaded || state.loading);
  const refresh = () => ensureLoaded(true);

  return { data, loading, error: state.error, refresh };
}
