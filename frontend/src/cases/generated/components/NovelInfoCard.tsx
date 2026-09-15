import React from 'react';
import { Book, User, FileText, Calendar } from 'lucide-react';
import { Novel } from '../types/Novel';

interface NovelInfoCardProps {
  novel: Novel;
}

export default function NovelInfoCard({ novel }: NovelInfoCardProps) {
  if (!novel) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex gap-6 p-6">
        <img
          src={novel.coverImage}
          alt={novel.title}
          className="w-32 h-44 object-cover rounded-lg shadow-md"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{novel.title}</h2>
          <div className="flex items-center gap-4 text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{novel.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>{novel.totalPages} 页</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(novel.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed line-clamp-3">{novel.description}</p>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">阅读进度</div>
          <div className="text-sm font-medium text-blue-600">{novel.currentPage} / {novel.totalPages} 页</div>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${novel.progressPercentage}%` }} />
        </div>
      </div>
    </div>
  );
}
