import { Bookmark } from '../types/Bookmark';
import { MOCK_BOOKMARKS } from '../data/bookmarks';

export function getBookmarkById(id: string): Bookmark | undefined {
  return MOCK_BOOKMARKS.find(bookmark => bookmark.id === id);
}

export function getAllBookmarks(): Bookmark[] {
  return MOCK_BOOKMARKS;
}

export function getBookmarksByNovelId(novelId: string): Bookmark[] {
  return MOCK_BOOKMARKS.filter(bookmark => bookmark.novelId === novelId);
}


export function createBookmark(input: Pick<Bookmark, "novelId" | "pageNumber" | "description">): Bookmark {
  const bookmark: Bookmark = {
    id: `bookmark_session_${Date.now()}`,
    novelId: input.novelId,
    pageNumber: input.pageNumber,
    description: input.description,
    createdAt: new Date().toISOString(),
  };
  MOCK_BOOKMARKS.unshift(bookmark);
  return bookmark;
}
