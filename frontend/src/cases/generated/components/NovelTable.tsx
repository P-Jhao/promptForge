import React from 'react';
import { Book, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Novel } from '../types/Novel';

interface NovelTableProps {
  novels: Novel[];
  onRowClick?: (novel: Novel) => void;
}

const statusMap: Record<string, { label: string; color: string }> = {
  reading: { label: '阅读中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  paused: { label: '已暂停', color: 'bg-yellow-100 text-yellow-700' },
  unread: { label: '未读', color: 'bg-gray-100 text-gray-700' },
};

export default function NovelTable({ novels, onRowClick }: NovelTableProps) {
  if (!novels?.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无小说数据</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">书名</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">作者</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">进度</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">最后阅读</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {novels.map((novel) => {
            const status = statusMap[novel.status] || statusMap.unread;
            return (
              <tr
                key={novel.id}
                onClick={() => onRowClick?.(novel)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRowClick?.(novel); } }}
                tabIndex={0}
                role="button"
                aria-label={'打开 ' + novel.title}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img src={novel.coverImage || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=560&fit=crop'} alt={novel.title} className="w-10 h-14 object-cover rounded" />
                    <Link to={'/novels/' + novel.id} onClick={(event) => event.stopPropagation()} className="font-medium text-blue-700 hover:underline">{novel.title}</Link>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{novel.author}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${novel.progressPercentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-500">{novel.progressPercentage.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                </td>
                <td className="py-3 px-4 text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(novel.lastReadAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                <td className="py-3 px-4 text-right"><span className="text-xs text-gray-400">打开详情</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
