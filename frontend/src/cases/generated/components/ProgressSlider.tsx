import React from 'react';

interface ProgressSliderProps {
  currentPage: number;
  totalPages: number;
  onChange?: (page: number) => void;
}

export default function ProgressSlider({ currentPage, totalPages, onChange }: ProgressSliderProps) {
  const percentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 w-16">{currentPage} 页</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-blue-500 rounded-l-lg pointer-events-none" style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-sm text-gray-500 w-16 text-right">{totalPages} 页</span>
      </div>
      <div className="text-center mt-2 text-sm text-gray-400">{percentage.toFixed(1)}% 已读</div>
    </div>
  );
}
