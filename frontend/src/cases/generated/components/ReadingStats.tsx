import React from 'react';
import { Clock, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { ReadingSession } from '../types/ReadingSession';

interface ReadingStatsProps {
  sessions: ReadingSession[];
}

export default function ReadingStats({ sessions }: ReadingStatsProps) {
  const data = sessions || [];
  const totalDuration = data.reduce((sum, s) => sum + s.duration, 0);
  const totalPages = data.reduce((sum, s) => sum + (s.endPage - s.startPage), 0);
  const sessionCount = data.length;
  const avgDuration = sessionCount > 0 ? Math.round(totalDuration / sessionCount / 60) : 0;

  const stats = [
    { icon: Clock, label: '总阅读时长', value: `${Math.round(totalDuration / 3600)}h ${Math.round((totalDuration % 3600) / 60)}m`, color: 'text-blue-500 bg-blue-50' },
    { icon: BookOpen, label: '已读页数', value: `${totalPages} 页`, color: 'text-green-500 bg-green-50' },
    { icon: Calendar, label: '阅读次数', value: `${sessionCount} 次`, color: 'text-purple-500 bg-purple-50' },
    { icon: TrendingUp, label: '平均时长', value: `${avgDuration} 分钟`, color: 'text-amber-500 bg-amber-50' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">阅读统计</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-lg bg-gray-50">
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
