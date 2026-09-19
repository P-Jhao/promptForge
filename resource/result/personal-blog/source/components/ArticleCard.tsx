import type { Article } from "../types/blog";
import { ArticleMeta } from "./ArticleMeta";
import { Artwork } from "./Artwork";

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
}

export function ArticleCard({ article, onOpen }: ArticleCardProps) {
  return (
    <button className="article-card" type="button" onClick={() => onOpen(article)} aria-label={`阅读文章：${article.title}`}>
      <Artwork tone={article.tone} />
      <span className="article-copy">
        <span className="article-title-row">
          <strong>{article.title}</strong>
          <span className={`category-pill topic-${article.topic}`}>{article.category}</span>
        </span>
        <span className="article-excerpt">{article.excerpt}</span>
        <ArticleMeta date={article.date} views={article.views} comments={article.comments} compact />
      </span>
    </button>
  );
}
