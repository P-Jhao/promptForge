import React from 'react';
import { Filter } from 'lucide-react';

interface FilterPanelProps {
  currentStatus: string;
  onStatusChange?: (status: string) => void;
}

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'reading', label: '阅读中' },
  { value: 'completed', label: '已完成' },
  { value: 'paused', label: '已暂停' },
  { value: 'unread', label: '未读' },
];

export default function FilterPanel({ currentStatus, onStatusChange }: FilterPanelProps) {
  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-lg bg-gray-50 p-3 sm:gap-4 sm:p-4">
      <div className="flex shrink-0 items-center gap-2 text-gray-600">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">筛选</span>
      </div>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange?.(option.value)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm rounded-lg transition-colors ${
              currentStatus === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
