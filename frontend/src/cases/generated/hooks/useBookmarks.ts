import { useState, useEffect, useCallback } from 'react';
import { Bookmark } from '../types/Bookmark';
import { getAllBookmarks, getBookmarkById, getBookmarksByNovelId } from '../services/bookmarkService';

export function useBookmarks(novelId?: string) {
  const [data, setData] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const bookmarks = novelId ? getBookmarksByNovelId(novelId) : getAllBookmarks();
      setData(bookmarks);
    } catch (err) {
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { data, loading, error, refresh: fetchBookmarks };
}

export function useBookmark(id: string) {
  const [data, setData] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmark = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const bookmark = getBookmarkById(id);
      setData(bookmark || null);
    } catch (err) {
      setError('Failed to load bookmark');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchBookmark();
    }
  }, [id, fetchBookmark]);

  return { data, loading, error, refresh: fetchBookmark };
}
