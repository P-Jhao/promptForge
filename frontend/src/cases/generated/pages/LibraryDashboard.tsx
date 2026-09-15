import React from 'react';
import { useNovels } from '../hooks/useNovels';
import { useCategories } from '../hooks/useCategories';
import { useReadingSessions } from '../hooks/useReadingSessions';
import RecentNovels from '../components/RecentNovels';
import ReadingStats from '../components/ReadingStats';
import CategoryOverview from '../components/CategoryOverview';

export default function LibraryDashboard() {
  const { data: novels, loading: novelsLoading } = useNovels();
  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: sessions, loading: sessionsLoading } = useReadingSessions();

  if (novelsLoading || categoriesLoading || sessionsLoading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">阅读概览</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，继续你的阅读之旅</p>
      </div>
      <RecentNovels novels={novels || []} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadingStats sessions={sessions || []} />
        <CategoryOverview categories={categories || []} />
      </div>
    </div>
  );
}
