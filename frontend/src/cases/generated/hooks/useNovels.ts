import { useState, useEffect, useCallback } from 'react';
import { Novel } from '../types/Novel';
import { getAllNovels, getNovelById, getNovelsByStatus } from '../services/novelService';

export function useNovels() {
  const [data, setData] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNovels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const novels = getAllNovels();
      setData(novels);
    } catch (err) {
      setError('Failed to load novels');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByStatus = useCallback(async (status: string) => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const novels = getNovelsByStatus(status);
      setData(novels);
    } catch (err) {
      setError('Failed to filter novels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  return { data, loading, error, refresh: fetchNovels, filterByStatus };
}

export function useNovel(id: string) {
  const [data, setData] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNovel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const novel = getNovelById(id);
      setData(novel || null);
    } catch (err) {
      setError('Failed to load novel');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchNovel();
    }
  }, [id, fetchNovel]);

  return { data, loading, error, refresh: fetchNovel };
}
