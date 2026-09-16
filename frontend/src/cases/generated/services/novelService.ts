import { Novel } from '../types/Novel';
import { MOCK_NOVELS } from '../data/novels';

export function getNovelById(id: string): Novel | undefined {
  return MOCK_NOVELS.find(novel => novel.id === id);
}

export function getAllNovels(): Novel[] {
  return MOCK_NOVELS;
}

export function getNovelsByStatus(status: string): Novel[] {
  return MOCK_NOVELS.filter(novel => novel.status === status);
}


export function createNovel(input: Pick<Novel, "title" | "author" | "description">): Novel {
  const now = new Date().toISOString();
  const novel: Novel = {
    id: `novel_session_${Date.now()}`,
    title: input.title,
    author: input.author,
    coverImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=560&fit=crop",
    description: input.description,
    filePath: "",
    totalPages: 100,
    currentPage: 0,
    lastReadAt: now,
    createdAt: now,
    updatedAt: now,
    status: "unread",
    progressPercentage: 0,
  };
  MOCK_NOVELS.push(novel);
  return novel;
}
