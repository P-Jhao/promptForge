import type { Article, ThemeMode } from "../types/blog";
import { ArticleMeta } from "./ArticleMeta";
import { Artwork } from "./Artwork";
import { Icon } from "./Icon";

interface ArticleDetailProps {
  article: Article;
  theme: ThemeMode;
  onBack: () => void;
  onSelectTag: (tag: string) => void;
  onThemeToggle: () => void;
}

export function ArticleDetail({ article, theme, onBack, onSelectTag, onThemeToggle }: ArticleDetailProps) {
  return (
    <div className={`blog-app detail-page theme-${theme}`}>
      <header className="detail-header">
        <button className="back-link" type="button" onClick={onBack}>
          <Icon name="arrow-left" size={17} />返回首页
        </button>
        <button className="detail-brand" type="button" onClick={onBack} aria-label="返回清川的博客首页">
          <span className="brand-logo small" aria-hidden="true"><i /><i /><i /></span>
          <strong>清川的博客</strong>
        </button>
        <button className="icon-button" type="button" onClick={onThemeToggle} aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"}>
          <Icon name={theme === "dark" ? "sun" : "moon"} size={19} />
        </button>
      </header>

      <main className="detail-main">
        <div className="detail-intro">
          <span className="eyebrow"><Icon name="sparkle" size={15} />{article.category}</span>
          <h1>{article.title}</h1>
          <p className="detail-lead">{article.excerpt}</p>
          <ArticleMeta date={article.date} views={article.views} comments={article.comments} />
          <div className="detail-reading-time">预计阅读 · {article.readingTime}</div>
        </div>

        <Artwork tone={article.tone} variant="detail" />

        <div className="article-shell">
          <aside className="detail-aside" aria-label="文章摘要">
            <span>NOTE</span>
            <p>{article.kicker}</p>
          </aside>
          <article className="detail-body">
            {article.sections.map((section, sectionIndex) => (
              <section key={section.heading}>
                <h2><span>{String(sectionIndex + 1).padStart(2, "0")}</span>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets !== undefined && (
                  <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                )}
              </section>
            ))}
            <div className="detail-tags" aria-label="文章标签">
              {article.tags.map((tag) => <button key={tag} type="button" onClick={() => onSelectTag(tag)}>#{tag}</button>)}
            </div>
            <div className="detail-end">
              <span>END</span>
              <p>感谢读到这里。愿这些记录，也能给你的下一步带来一点启发。</p>
              <button className="read-button" type="button" onClick={onBack}>继续浏览文章 <Icon name="arrow-right" size={16} /></button>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
