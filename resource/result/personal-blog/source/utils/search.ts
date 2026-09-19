import type { Article, Category } from "../types/blog";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export function matchesArticle(article: Article, category: Category, query: string, activeTag: string | null): boolean {
  const matchesCategory = category === "全部" || article.topic === category;
  const matchesTag = activeTag === null || article.tags.includes(activeTag);
  const normalizedQuery = normalize(query);
  if (!matchesCategory || !matchesTag) return false;
  if (normalizedQuery.length === 0) return true;

  const haystack = normalize([
    article.title,
    article.excerpt,
    article.category,
    article.topic,
    ...article.tags,
  ].join(" "));

  return haystack.includes(normalizedQuery);
}
