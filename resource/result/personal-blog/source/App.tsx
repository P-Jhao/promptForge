import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "./components/ArticleCard";
import { ArticleDetail } from "./components/ArticleDetail";
import { AuthorCard } from "./components/AuthorCard";
import { ColumnsSection } from "./components/ColumnsSection";
import { EmptyState } from "./components/EmptyState";
import { FeaturedArticle } from "./components/FeaturedArticle";
import { Header } from "./components/Header";
import { Icon } from "./components/Icon";
import { QuoteCard, SubscribeCard, TagsCard } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { articles, featuredArticleId } from "./data/articles";
import { categories, popularTags } from "./data/site";
import { useBlogFilters } from "./hooks/useBlogFilters";
import { useTheme } from "./hooks/useTheme";
import type { Article, ArticleTopic, NavItem } from "./types/blog";

const featuredArticle: Article = (() => {
  const match = articles.find((article) => article.id === featuredArticleId);
  if (match === undefined) throw new Error("博客案例缺少精选文章");
  return match;
})();

function scrollToSection(id: string) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    activeTag,
    category,
    clearFilters,
    hasFilters,
    query,
    setActiveTag,
    setCategory,
    setQuery,
    visibleArticles: matchedArticles,
  } = useBlogFilters(articles);

  const [activeNav, setActiveNav] = useState<NavItem>("首页");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const visibleArticles = useMemo(
    () => hasFilters ? matchedArticles : matchedArticles.filter((article) => article.id !== featuredArticleId),
    [hasFilters, matchedArticles],
  );

  useEffect(() => {
    if (toastMessage === null) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("article-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const resultLabel = useMemo(() => {
    if (!hasFilters) return `${visibleArticles.length} 篇最新文章`;
    const parts: string[] = [];
    if (category !== "全部") parts.push(category);
    if (activeTag !== null) parts.push(`#${activeTag}`);
    if (query.trim().length > 0) parts.push(`“${query.trim()}”`);
    return `${parts.join(" · ")} · ${visibleArticles.length} 篇结果`;
  }, [activeTag, category, hasFilters, query, visibleArticles.length]);

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backHome = () => {
    setSelectedArticle(null);
    setActiveNav("首页");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    if (item === "首页") {
      clearFilters();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const targets: Record<Exclude<NavItem, "首页">, string> = {
      文章: "latest",
      专栏: "columns",
      标签: "tags",
      关于: "about",
    };
    scrollToSection(targets[item]);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveNav("文章");
  };

  const handleCategoryChange = (nextCategory: typeof category) => {
    setCategory(nextCategory);
    setActiveNav("文章");
  };

  const handleTagSelect = (tag: string) => {
    setQuery("");
    setCategory("全部");
    setActiveTag(tag);
    setActiveNav("文章");
    scrollToSection("latest");
  };

  const handleDetailTagSelect = (tag: string) => {
    setSelectedArticle(null);
    setQuery("");
    setCategory("全部");
    setActiveTag(tag);
    setActiveNav("文章");
    scrollToSection("latest");
  };

  const handleClearFilters = () => {
    clearFilters();
    setActiveNav("文章");
    setToastMessage("搜索和筛选已清除");
  };

  const handleSubscribe = () => {
    setSubscribed((current) => {
      setToastMessage(current ? "已取消博客订阅" : "订阅成功，欢迎加入清川的邮件通讯");
      return !current;
    });
  };

  const handleFollow = () => {
    setFollowed((current) => {
      setToastMessage(current ? "已取消关注" : "已关注清川");
      return !current;
    });
  };

  const handleSocialAction = (label: string) => {
    setToastMessage(`${label} 为演示入口，未连接外部账号`);
  };

  const handleColumnSelect = (topic: ArticleTopic) => {
    setCategory(topic);
    setActiveTag(null);
    setQuery("");
    setActiveNav("文章");
    scrollToSection("latest");
  };

  if (selectedArticle !== null) {
    return (
      <ArticleDetail
        article={selectedArticle}
        theme={theme}
        onBack={backHome}
        onSelectTag={handleDetailTagSelect}
        onThemeToggle={toggleTheme}
      />
    );
  }

  return (
    <div className={`blog-app theme-${theme}`}>
      <Header
        activeNav={activeNav}
        query={query}
        subscribed={subscribed}
        theme={theme}
        onClearQuery={() => setQuery("")}
        onNavigate={handleNavigate}
        onQueryChange={handleQueryChange}
        onSubscribe={handleSubscribe}
        onThemeToggle={toggleTheme}
      />

      <main className="blog-main" id="home">
        <section className="hero-layout" aria-label="博客精选内容">
          <FeaturedArticle article={featuredArticle} onOpen={openArticle} />
          <AuthorCard followed={followed} onFollowToggle={handleFollow} onSocialAction={handleSocialAction} />
        </section>

        <div className="content-layout">
          <section className="latest-section" id="latest" aria-labelledby="latest-heading">
            <div className="section-heading">
              <div>
                <span className="section-kicker">LATEST</span>
                <h2 id="latest-heading">最新文章</h2>
              </div>
              <div className="category-tabs" aria-label="文章分类">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={category === item ? "active" : ""}
                    aria-pressed={category === item}
                    onClick={() => handleCategoryChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-summary">
              <span>{resultLabel}</span>
              {activeTag !== null && (
                <button type="button" className="active-filter" onClick={() => setActiveTag(null)}>
                  #{activeTag} <b>×</b>
                </button>
              )}
              {hasFilters && (
                <button type="button" className="clear-filter" onClick={handleClearFilters}>清除搜索和筛选</button>
              )}
            </div>

            <div className="article-list">
              {visibleArticles.length > 0 ? (
                visibleArticles.map((article) => <ArticleCard key={article.id} article={article} onOpen={openArticle} />)
              ) : (
                <EmptyState onClear={handleClearFilters} />
              )}
            </div>
          </section>

          <aside className="right-rail" aria-label="博客侧栏">
            <QuoteCard />
            <TagsCard
              tags={popularTags}
              activeTag={activeTag}
              onClearTag={() => {
                setActiveTag(null);
                setActiveNav("文章");
                scrollToSection("latest");
              }}
              onSelectTag={handleTagSelect}
            />
            <SubscribeCard subscribed={subscribed} onSubscribe={handleSubscribe} />
          </aside>
        </div>

        <ColumnsSection onSelectTopic={handleColumnSelect} />

        <footer className="blog-footer">
          <div>
            <span className="brand-logo small" aria-hidden="true"><i /><i /><i /></span>
            <strong>清川的博客</strong>
          </div>
          <p>记录思考，创造更好的自己 · 本站内容与人物均为虚构演示。</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>回到顶部 <Icon name="arrow-right" size={14} /></button>
        </footer>
      </main>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
