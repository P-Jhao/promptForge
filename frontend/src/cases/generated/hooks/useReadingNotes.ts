import { useState, useEffect, useCallback } from 'react';
import { ReadingNote } from '../types/ReadingNote';
import { getAllReadingNotes, getReadingNoteById, getReadingNotesByNovelId } from '../services/readingNoteService';

export function useReadingNotes(novelId?: string) {
  const [data, setData] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const notes = novelId ? getReadingNotesByNovelId(novelId) : getAllReadingNotes();
      setData(notes);
    } catch (err) {
      setError('Failed to load reading notes');
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { data, loading, error, refresh: fetchNotes };
}

export function useReadingNote(id: string) {
  const [data, setData] = useState<ReadingNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const note = getReadingNoteById(id);
      setData(note || null);
    } catch (err) {
      setError('Failed to load reading note');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id, fetchNote]);

  return { data, loading, error, refresh: fetchNote };
}
