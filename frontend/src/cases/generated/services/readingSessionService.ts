import { ReadingSession } from '../types/ReadingSession';
import { MOCK_READING_SESSIONS } from '../data/readingSessions';

export function getReadingSessionById(id: string): ReadingSession | undefined {
  return MOCK_READING_SESSIONS.find(session => session.id === id);
}

export function getAllReadingSessions(): ReadingSession[] {
  return MOCK_READING_SESSIONS;
}

export function getReadingSessionsByNovelId(novelId: string): ReadingSession[] {
  return MOCK_READING_SESSIONS.filter(session => session.novelId === novelId);
}
