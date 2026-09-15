import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Novel } from '../types/Novel';

interface RecentNovelsProps {
  novels: Novel[];
  onNovelClick?: (novel: Novel) => void;
}

export default function RecentNovels({ novels, onNovelClick }: RecentNovelsProps) {
  const recentNovels = (novels || [])
    .filter(n => n.status === 'reading')
    .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
    .slice(0, 4);

  if (recentNovels.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">继续阅读</h3>
        <p className="text-gray-500 text-center py-8">暂无正在阅读的小说</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">继续阅读</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentNovels.map((novel) => (
          <div
            key={novel.id}
            onClick={() => onNovelClick?.(novel)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
              <img src={novel.coverImage} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-200">
                <div className="h-full bg-blue-500" style={{ width: `${novel.progressPercentage}%` }} />
              </div>
            </div>
            <h4 className="font-medium text-gray-900 text-sm truncate">{novel.title}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{new Date(novel.lastReadAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
