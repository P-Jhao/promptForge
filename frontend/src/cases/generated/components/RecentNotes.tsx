import React from 'react';
import { StickyNote, ChevronRight } from 'lucide-react';
import { ReadingNote } from '../types/ReadingNote';

interface RecentNotesProps {
  notes: ReadingNote[];
  onViewAll?: () => void;
}

export default function RecentNotes({ notes, onViewAll }: RecentNotesProps) {
  const displayNotes = notes?.slice(0, 5) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-amber-500" />
          最近笔记
        </h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            查看全部 <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      {displayNotes.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无笔记</p>
      ) : (
        <div className="space-y-3">
          {displayNotes.map((note) => (
            <div key={note.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="text-sm text-gray-900 line-clamp-2">{note.content}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <span>第 {note.pageNumber} 页</span>
                <span>·</span>
                <span>{new Date(note.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
