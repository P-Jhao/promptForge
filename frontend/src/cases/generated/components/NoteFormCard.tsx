import React, { useState } from 'react';
import { PenLine } from 'lucide-react';

interface NoteFormCardProps {
  pageNumber?: number;
  onSubmit?: (data: { content: string; pageNumber: number }) => void;
}

export default function NoteFormCard({ pageNumber = 1, onSubmit }: NoteFormCardProps) {
  const [content, setContent] = useState('');
  const [page, setPage] = useState(pageNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit?.({ content, pageNumber: page });
      setContent('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <PenLine className="h-5 w-5 text-amber-500" />
        添加笔记
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">页码</label>
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            min={1}
            className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">笔记内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="写下你的阅读心得..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
        >
          保存笔记
        </button>
      </form>
    </div>
  );
}
