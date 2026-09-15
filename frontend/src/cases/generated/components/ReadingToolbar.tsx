import React, { useState } from 'react';
import { Type, Sun, Moon, BookOpen, Bookmark, Settings } from 'lucide-react';

interface ReadingToolbarProps {
  onFontSizeChange?: (size: number) => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'sepia') => void;
  onAddBookmark?: () => void;
}

export default function ReadingToolbar({ onFontSizeChange, onThemeChange, onAddBookmark }: ReadingToolbarProps) {
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    onFontSizeChange?.(newSize);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'sepia') => {
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg" title="目录">
          <BookOpen className="h-5 w-5 text-gray-600" />
        </button>
        <button onClick={onAddBookmark} className="p-2 hover:bg-gray-100 rounded-lg" title="添加书签">
          <Bookmark className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => handleFontSizeChange(-2)} className="px-2 py-1 hover:bg-white rounded text-gray-600">
          <Type className="h-4 w-4" />
        </button>
        <span className="px-2 text-sm text-gray-600">{fontSize}</span>
        <button onClick={() => handleFontSizeChange(2)} className="px-2 py-1 hover:bg-white rounded text-gray-600">
          <Type className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => handleThemeChange('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-white shadow-sm' : ''}`}>
          <Sun className="h-4 w-4 text-gray-600" />
        </button>
        <button onClick={() => handleThemeChange('sepia')} className={`p-1.5 rounded ${theme === 'sepia' ? 'bg-white shadow-sm' : ''}`}>
          <span className="w-4 h-4 block rounded-full bg-amber-100 border border-amber-200" />
        </button>
        <button onClick={() => handleThemeChange('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-white shadow-sm' : ''}`}>
          <Moon className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <button className="p-2 hover:bg-gray-100 rounded-lg">
        <Settings className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
}
