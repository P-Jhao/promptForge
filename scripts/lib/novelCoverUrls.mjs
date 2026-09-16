export const NOVEL_COVER_URLS = Object.freeze([
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=560&fit=crop",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=560&fit=crop",
]);

export const NOVEL_DEFAULT_COVER_URL = NOVEL_COVER_URLS[0];

export function isAllowedNovelCoverUrl(value) {
  return typeof value === "string" && NOVEL_COVER_URLS.includes(value);
}

export function validateNovelCoverUrls(value) {
  if (!Array.isArray(value) || value.length !== NOVEL_COVER_URLS.length) {
    throw new Error(`Novel case requires exactly ${NOVEL_COVER_URLS.length} cover URLs`);
  }
  const seen = new Set();
  for (const url of value) {
    if (!isAllowedNovelCoverUrl(url)) {
      throw new Error(`Novel cover URL is not in the fixed allowlist: ${String(url)}`);
    }
    if (seen.has(url)) {
      throw new Error(`Novel cover URL is duplicated: ${url}`);
    }
    seen.add(url);
  }
  return value;
}
