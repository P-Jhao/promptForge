import { Icon } from "./Icon";

interface ArticleMetaProps {
  date: string;
  views: string;
  comments: number;
  compact?: boolean;
}

export function ArticleMeta({ date, views, comments, compact = false }: ArticleMetaProps) {
  return (
    <div className={`article-meta ${compact ? "compact" : ""}`}>
      <span><Icon name="calendar" size={15} />{date}</span>
      <span><Icon name="eye" size={15} />{views} 阅读</span>
      <span><Icon name="message" size={15} />{comments} 评论</span>
    </div>
  );
}
