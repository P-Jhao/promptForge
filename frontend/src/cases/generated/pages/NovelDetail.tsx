import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNovel } from '../hooks/useNovels';
import { useReadingNotes } from '../hooks/useReadingNotes';
import { useBookmarks } from '../hooks/useBookmarks';
import NovelInfoCard from '../components/NovelInfoCard';
import ReadingProgressCard from '../components/ReadingProgressCard';
import RecentNotes from '../components/RecentNotes';
import BookmarksList from '../components/BookmarksList';

export default function NovelDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: novel, loading: novelLoading } = useNovel(id || '');
  const { data: notes, loading: notesLoading } = useReadingNotes(id);
  const { data: bookmarks, loading: bookmarksLoading } = useBookmarks(id);

  if (novelLoading || notesLoading || bookmarksLoading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  if (!novel) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">未找到该小说</p>
        <Link to="/novels" className="text-blue-600 hover:underline">返回书架</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/novels" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{novel.title}</h1>
        <Link to={'/reading/' + novel.id} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          继续阅读
        </Link>
      </div>
      <NovelInfoCard novel={novel} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadingProgressCard novel={novel} />
        <RecentNotes notes={notes || []} />
      </div>
<div className="flex justify-end"><Link to={'/novels/' + novel.id + '/notes/new?page=' + novel.currentPage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">添加阅读笔记</Link></div>
      <BookmarksList bookmarks={bookmarks || []} />
    </div>
  );
}
