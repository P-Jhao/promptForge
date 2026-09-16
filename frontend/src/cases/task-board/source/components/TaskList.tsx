import React from 'react';
import { Calendar, ListTodo, Pencil, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTasks } from '../hooks/useTask';
import { type Task, type TaskPriority, type TaskStatus } from '../types/task';

interface StatusColumn {
  key: TaskStatus;
  label: string;
  color: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const STATUS_COLUMNS: readonly StatusColumn[] = [
  { key: 'todo', label: '待办', color: 'bg-gray-400' },
  { key: 'doing', label: '进行中', color: 'bg-blue-500' },
  { key: 'done', label: '已完成', color: 'bg-green-500' },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  return (
    <li className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-gray-900">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className={cn('rounded-full px-2 py-0.5 font-medium', PRIORITY_STYLES[task.priority])}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {task.dueDate}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={task.status}
            onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
            className="rounded-lg border-0 px-2 py-1 text-xs outline-none"
            aria-label={`切换${task.title}状态`}
          >
            {STATUS_COLUMNS.map((status) => (
              <option key={status.key} value={status.key}>{status.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onEdit(task.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            aria-label={`编辑${task.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            aria-label={`删除${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function TaskList() {
  const { data: tasks, loading, error, deleteTask, updateTaskStatus } = useTasks();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  if (error) {
    return <div className="py-8 text-center text-red-500">加载失败：{error}</div>;
  }

  const list = tasks;
  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <ListTodo className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>暂无任务</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = list.filter((task) => task.status === column.key);
        return (
          <section key={column.key} className="rounded-xl border border-gray-200 bg-gray-50 p-3" aria-label={column.label}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
                <h2 className="font-medium text-gray-800">{column.label}</h2>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-600">{columnTasks.length}</span>
            </div>
            {columnTasks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">暂无任务</p>
            ) : (
              <ul className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(id) => navigate(`/tasks/${id}`)}
                    onDelete={(id) => { void deleteTask(id); }}
                    onStatusChange={(id, status) => { void updateTaskStatus(id, status); }}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
