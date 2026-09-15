import React from 'react';
import { Bookmark as BookmarkIcon, ChevronRight, FileText } from 'lucide-react';
import { Bookmark } from '../types/Bookmark';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onBookmarkClick?: (bookmark: Bookmark) => void;
}

export default function BookmarksList({ bookmarks, onBookmarkClick }: BookmarksListProps) {
  const displayBookmarks = bookmarks || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookmarkIcon className="h-5 w-5 text-red-500" />
        书签
      </h3>
      {displayBookmarks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无书签</p>
      ) : (
        <div className="space-y-2">
          {displayBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              onClick={() => onBookmarkClick?.(bookmark)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-red-50 rounded-lg text-red-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{bookmark.description}</div>
                <div className="text-xs text-gray-500">第 {bookmark.pageNumber} 页</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
