import { ReadingNote } from '../types/ReadingNote';
import { MOCK_READING_NOTES } from '../data/readingNotes';

export function getReadingNoteById(id: string): ReadingNote | undefined {
  return MOCK_READING_NOTES.find(note => note.id === id);
}

export function getAllReadingNotes(): ReadingNote[] {
  return MOCK_READING_NOTES;
}

export function getReadingNotesByNovelId(novelId: string): ReadingNote[] {
  return MOCK_READING_NOTES.filter(note => note.novelId === novelId);
}


export function createReadingNote(input: Pick<ReadingNote, "novelId" | "pageNumber" | "content">): ReadingNote {
  const now = new Date().toISOString();
  const note: ReadingNote = {
    id: `note_session_${Date.now()}`,
    novelId: input.novelId,
    pageNumber: input.pageNumber,
    content: input.content,
    createdAt: now,
    updatedAt: now,
  };
  MOCK_READING_NOTES.unshift(note);
  return note;
}
