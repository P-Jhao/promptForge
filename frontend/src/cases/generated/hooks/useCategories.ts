import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types/Category';
import { getAllCategories, getCategoryById } from '../services/categoryService';

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const categories = getAllCategories();
      setData(categories);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { data, loading, error, refresh: fetchCategories };
}

export function useCategory(id: string) {
  const [data, setData] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 150));
      const category = getCategoryById(id);
      setData(category || null);
    } catch (err) {
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id, fetchCategory]);

  return { data, loading, error, refresh: fetchCategory };
}
