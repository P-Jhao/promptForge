import { type Board } from '../types/board';
import { MOCK_BOARDS } from '../data/board';

export function getBoardById(id: string): Board | undefined {
  return MOCK_BOARDS.find((board) => board.id === id);
}

export function getAllBoards(): Board[] {
  return MOCK_BOARDS;
}
