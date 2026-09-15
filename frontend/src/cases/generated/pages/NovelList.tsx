import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNovels } from '../hooks/useNovels';
import NovelTable from '../components/NovelTable';
import FilterPanel from '../components/FilterPanel';
import { Novel } from '../types/Novel';

export default function NovelList() {
  const { data: novels, loading } = useNovels();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const filteredNovels = useMemo(() => {
    if (!novels) return [];
    return novels.filter((novel) => (statusFilter === 'all' || novel.status === statusFilter) && (novel.title.includes(query) || novel.author.includes(query)));
  }, [novels, statusFilter, query]);

  const handleRowClick = (novel: Novel) => {
    navigate('/novels/' + novel.id);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的书架</h1>
          <p className="text-sm text-gray-500 mt-1">共 {novels?.length || 0} 本小说</p>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名或作者" className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
        </div>
      </div>
      <FilterPanel currentStatus={statusFilter} onStatusChange={setStatusFilter} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <NovelTable novels={filteredNovels} onRowClick={handleRowClick} />
      </div>
    </div>
  );
}
