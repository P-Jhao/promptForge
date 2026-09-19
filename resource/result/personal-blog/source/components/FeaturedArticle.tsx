import type { Article } from "../types/blog";
import { ArticleMeta } from "./ArticleMeta";
import { Artwork } from "./Artwork";
import { Icon } from "./Icon";

interface FeaturedArticleProps {
  article: Article;
  onOpen: (article: Article) => void;
}

export function FeaturedArticle({ article, onOpen }: FeaturedArticleProps) {
  return (
    <article className="featured-card">
      <div className="featured-copy">
        <span className="eyebrow"><Icon name="sparkle" size={15} />精选文章</span>
        <h1>{article.title.replace("，", "，\n").split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</h1>
        <p>{article.excerpt}</p>
        <button className="read-button" type="button" onClick={() => onOpen(article)}>
          阅读全文 <Icon name="arrow-right" size={16} />
        </button>
        <ArticleMeta date={article.date} views={article.views} comments={article.comments} />
      </div>
      <Artwork tone={article.tone} variant="hero" />
    </article>
  );
}
