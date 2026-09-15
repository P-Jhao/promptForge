import React from 'react';
import { Plus } from 'lucide-react';

interface AddNovelButtonProps {
  onClick?: () => void;
}

export default function AddNovelButton({ onClick }: AddNovelButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      <Plus className="h-4 w-4" />
      添加小说
    </button>
  );
}
