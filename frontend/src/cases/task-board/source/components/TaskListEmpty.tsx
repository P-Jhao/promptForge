import React from 'react';
import { ClipboardList, Plus, SearchX, RotateCcw } from 'lucide-react';

interface TaskListEmptyProps {
  variant?: 'no-data' | 'no-results';
  onCreateTask?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export default function TaskListEmpty({
  variant = 'no-data',
  onCreateTask,
  onClearFilters,
  className = '',
}: TaskListEmptyProps) {
  const isNoResults = variant === 'no-results';
  const Icon = isNoResults ? SearchX : ClipboardList;

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {isNoResults ? '没有匹配的任务' : '暂无任务'}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {isNoResults
          ? '尝试调整搜索关键词或筛选条件，以找到你想要的任务。'
          : '还没有任何任务，创建你的第一个任务来开始吧。'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isNoResults
          ? onClearFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                清除筛选
              </button>
            )
          : onCreateTask && (
              <button
                onClick={onCreateTask}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                新建任务
              </button>
            )}
      </div>
    </div>
  );
}
