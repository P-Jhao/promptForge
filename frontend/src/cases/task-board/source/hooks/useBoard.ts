import { useState, useEffect, useCallback } from 'react';
import { type Board } from '../types/board';
import { getAllBoards, getBoardById } from '../services/boardService';

export function useBoards() {
  const [data, setData] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 300));
      const boards = getAllBoards();
      setData(boards ?? []);
    } catch (err) {
      setError('Failed to load boards');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  return { data, loading, error, refresh: fetchBoards };
}

export function useBoard(id: string) {
  const [data, setData] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      const board = getBoardById(id);
      setData(board ?? null);
    } catch (err) {
      setError('Failed to load board');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateBoard = useCallback(async (updates: Partial<Board>) => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 200));
      setData(prev => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      setError('Failed to update board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return { data, loading, error, refresh: fetchBoard, updateBoard };
}
