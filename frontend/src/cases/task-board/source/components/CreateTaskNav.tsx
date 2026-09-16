import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function CreateTaskNav() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="返回任务列表"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 text-blue-600">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            任务看板
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/tasks')}
          className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          取消
        </button>
        <button
          onClick={() => navigate('/tasks/new')}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="whitespace-nowrap">新建任务</span>
        </button>
      </div>
    </div>
  );
}
