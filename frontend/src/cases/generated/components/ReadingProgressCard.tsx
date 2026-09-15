import React from 'react';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import { Novel } from '../types/Novel';

interface ReadingProgressCardProps {
  novel: Novel;
}

export default function ReadingProgressCard({ novel }: ReadingProgressCardProps) {
  if (!novel) return null;

  const pagesRemaining = novel.totalPages - novel.currentPage;
  const estimatedMinutes = pagesRemaining * 2;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        阅读进度
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">当前进度</span>
            <span className="font-medium text-gray-900">{novel.progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${novel.progressPercentage}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BookOpen className="h-4 w-4" />
              已读页数
            </div>
            <div className="text-xl font-bold text-gray-900">{novel.currentPage}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Clock className="h-4 w-4" />
              预计剩余
            </div>
            <div className="text-xl font-bold text-gray-900">{Math.round(estimatedMinutes / 60)}h {estimatedMinutes % 60}m</div>
          </div>
        </div>
      </div>
    </div>
  );
}
