import { useState, useEffect, useCallback } from 'react';
import { ReadingSession } from '../types/ReadingSession';
import { getAllReadingSessions, getReadingSessionById, getReadingSessionsByNovelId } from '../services/readingSessionService';

export function useReadingSessions(novelId?: string) {
  const [data, setData] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const sessions = novelId ? getReadingSessionsByNovelId(novelId) : getAllReadingSessions();
      setData(sessions);
    } catch (err) {
      setError('Failed to load reading sessions');
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { data, loading, error, refresh: fetchSessions };
}

export function useReadingSession(id: string) {
  const [data, setData] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const session = getReadingSessionById(id);
      setData(session || null);
    } catch (err) {
      setError('Failed to load reading session');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id, fetchSession]);

  return { data, loading, error, refresh: fetchSession };
}
