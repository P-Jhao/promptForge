import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useTasks } from '../hooks/useTask';

interface TaskFilterSearchProps {
  onFilterChange?: (filters: { keyword: string; status: string | null; priority: string | null }) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'todo', label: '待办' },
  { value: 'doing', label: '进行中' },
  { value: 'done', label: '已完成' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部优先级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export default function TaskFilterSearch({ onFilterChange, className = '' }: TaskFilterSearchProps) {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    clearSearch,
  } = useTasks();
  const [localKeyword, setLocalKeyword] = useState<string>(searchTerm ?? '');

  useEffect(() => {
    setLocalKeyword(searchTerm ?? '');
  }, [searchTerm]);

  useEffect(() => {
    onFilterChange?.({
      keyword: searchTerm ?? '',
      status: statusFilter ?? null,
      priority: priorityFilter ?? null,
    });
  }, [searchTerm, statusFilter, priorityFilter, onFilterChange]);

  const handleClear = () => {
    setLocalKeyword('');
    clearSearch();
    setStatusFilter(null);
    setPriorityFilter(null);
  };

  const hasFilter = Boolean((localKeyword ?? '').trim() || statusFilter || priorityFilter);

  return (
    <div className={`flex flex-col gap-3 md:flex-row md:items-center ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={localKeyword}
          onChange={(e) => {
            setLocalKeyword(e.target.value);
            setSearchTerm(e.target.value);
          }}
          placeholder="搜索任务标题、描述或负责人..."
          className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
        />
        {(localKeyword ?? '').length > 0 && (
          <button
            onClick={() => {
              setLocalKeyword('');
              clearSearch();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="清除搜索"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-gray-400 hidden md:block" />
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          aria-label="按状态筛选"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={priorityFilter ?? ''}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          aria-label="按优先级筛选"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasFilter && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
}
