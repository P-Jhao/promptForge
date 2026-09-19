import { useMemo, useState } from "react";
import type { Article, Category } from "../types/blog";
import { matchesArticle } from "../utils/search";

export function useBlogFilters(allArticles: readonly Article[]) {
  const [category, setCategory] = useState<Category>("全部");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visibleArticles = useMemo(
    () => allArticles.filter((article) => matchesArticle(article, category, query, activeTag)),
    [activeTag, allArticles, category, query],
  );

  const hasFilters = category !== "全部" || query.trim().length > 0 || activeTag !== null;

  const clearFilters = () => {
    setCategory("全部");
    setQuery("");
    setActiveTag(null);
  };

  return {
    activeTag,
    category,
    clearFilters,
    hasFilters,
    query,
    setActiveTag,
    setCategory,
    setQuery,
    visibleArticles,
  };
}
