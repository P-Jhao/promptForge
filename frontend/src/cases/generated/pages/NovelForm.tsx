import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NovelFormCard from '../components/NovelFormCard';
import { createNovel } from '../services/novelService';

export default function NovelForm() {
  const navigate = useNavigate();

  const handleSubmit = (data: { title: string; author: string; description: string }) => {
    createNovel(data);
    navigate('/novels');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/novels" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">添加新小说</h1>
      </div>
      <NovelFormCard onSubmit={handleSubmit} />
    </div>
  );
}
