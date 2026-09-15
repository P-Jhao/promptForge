import React from 'react';
import { Tag } from 'lucide-react';
import { Category } from '../types/Category';

interface CategoryOverviewProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
}

export default function CategoryOverview({ categories, onCategoryClick }: CategoryOverviewProps) {
  const displayCategories = categories || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-purple-500" />
        分类浏览
      </h3>
      {displayCategories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无分类</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick?.(category)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
