import React from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNovel } from '../hooks/useNovels';
import NoteFormCard from '../components/NoteFormCard';
import { createReadingNote } from '../services/readingNoteService';

export default function NoteForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pageNumber = parseInt(searchParams.get('page') || '1', 10);
  const { data: novel, loading } = useNovel(id || '');

  const handleSubmit = (data: { content: string; pageNumber: number }) => {
    if (!id) { throw new Error('Cannot create a note without a novel id'); }
    createReadingNote({ novelId: id, ...data });
    navigate('/novels/' + id);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={'/novels/' + id} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">添加笔记</h1>
          {novel && <p className="text-sm text-gray-500">{novel.title}</p>}
        </div>
      </div>
      <NoteFormCard pageNumber={pageNumber} onSubmit={handleSubmit} />
    </div>
  );
}
