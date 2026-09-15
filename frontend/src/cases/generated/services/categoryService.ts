import { Category } from '../types/Category';
import { MOCK_CATEGORIES } from '../data/categories';

export function getCategoryById(id: string): Category | undefined {
  return MOCK_CATEGORIES.find(category => category.id === id);
}

export function getAllCategories(): Category[] {
  return MOCK_CATEGORIES;
}
