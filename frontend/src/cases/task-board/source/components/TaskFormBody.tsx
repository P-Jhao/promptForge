import React from 'react';
import { Save, X, Calendar, User, AlertCircle } from 'lucide-react';
import { type TaskPriority, type TaskStatus } from '../types/task';

export interface TaskFormValues {
  title: string;
  description: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface TaskFormBodyProps {
  values: TaskFormValues;
  errors?: Record<string, string>;
  submitting?: boolean;
  onChange?: (field: keyof TaskFormValues, value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
];

export default function TaskFormBody({ values, errors = {}, submitting = false, onChange, onSubmit, onCancel }: TaskFormBodyProps) {
  const v = values ?? ({} as TaskFormValues);
  const err = errors ?? {};

  const field = (name: keyof TaskFormValues, value: string) => onChange?.(name, value ?? '');

  const inputCls = (name: string) =>
    `w-full px-3 py-2 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-1 transition-all ${
      err[name] ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
    }`;

  const ErrorMsg = ({ name }: { name: string }) =>
    err[name] ? (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
        <AlertCircle className="h-3 w-3" />
        {err[name]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
        <input
          type="text"
          value={v.title ?? ''}
          onChange={(e) => field('title', e.target.value)}
          placeholder="输入任务标题"
          className={inputCls('title')}
        />
        <ErrorMsg name="title" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          rows={3}
          value={v.description ?? ''}
          onChange={(e) => field('description', e.target.value)}
          placeholder="输入任务描述"
          className={inputCls('description')}
        />
        <ErrorMsg name="description" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
            <User className="h-3.5 w-3.5" /> 负责人
          </label>
          <input
            type="text"
            value={v.assignee ?? ''}
            onChange={(e) => field('assignee', e.target.value)}
            placeholder="负责人姓名"
            className={inputCls('assignee')}
          />
          <ErrorMsg name="assignee" />
        </div>
        <div>
          <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
            <Calendar className="h-3.5 w-3.5" /> 截止日期
          </label>
          <input
            type="date"
            value={v.dueDate ?? ''}
            onChange={(e) => field('dueDate', e.target.value)}
            className={inputCls('dueDate')}
          />
          <ErrorMsg name="dueDate" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
          <select
            value={v.priority ?? 'medium'}
            onChange={(e) => field('priority', e.target.value)}
            className={inputCls('priority')}
          >
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={v.status ?? 'todo'}
            onChange={(e) => field('status', e.target.value)}
            className={inputCls('status')}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" /> 取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" /> {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
