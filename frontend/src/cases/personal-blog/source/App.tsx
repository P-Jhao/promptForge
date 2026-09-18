import { useMemo, useState } from "react";

type Category = "全部" | "产品" | "技术" | "生活" | "思考";
type Article = { id: number; title: string; excerpt: string; category: string; topic: Exclude<Category, "全部">; tags: string[]; date: string; views: string; comments: number; tone: string; motif: string };

const articles: Article[] = [
  { id: 1, title: "如何用 Notion 构建高效的个人知识管理系统", excerpt: "从收集、整理到输出，分享我这两年使用 Notion 构建个人知识库的完整方法，以及一些实用的模板和技巧。", category: "效率工具", topic: "产品", tags: ["产品思考", "效率工具", "阅读"], date: "2024年4月18日", views: "8.7k", comments: 56, tone: "desk", motif: "⌁" },
  { id: 2, title: "一个人旅行的意义：在独处中遇见更大的世界", excerpt: "独自上路的旅程，往往能让我们更清晰地看见自己。这篇文章记录了我在日本独自旅行的所见所感。", category: "生活随笔", topic: "生活", tags: ["生活随笔", "阅读"], date: "2024年4月12日", views: "6.1k", comments: 42, tone: "coast", motif: "✦" },
  { id: 3, title: "从 0 到 1：我如何独立开发并上线第一个产品", excerpt: "分享我从一个想法到产品上线的完整过程，包括技术选型、产品设计、开发踩坑，以及上线后的运营思考。", category: "独立开发", topic: "技术", tags: ["技术心得", "独立开发", "AI"], date: "2024年4月5日", views: "10.3k", comments: 89, tone: "code", motif: "{ }" },
  { id: 4, title: "保持长期主义：把时间花在真正重要的事情上", excerpt: "我们总在追赶下一件事，却很少停下来确认自己的方向。记录一些关于专注、耐心与成长的思考。", category: "思考", topic: "思考", tags: ["成长", "职场", "阅读"], date: "2024年3月28日", views: "5.4k", comments: 31, tone: "mountain", motif: "↗" },
];
const categories: Category[] = ["全部", "产品", "技术", "生活", "思考"];

export default function App() {
  const [category, setCategory] = useState<Category>("全部");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const [activeNav, setActiveNav] = useState("首页");
  const visibleArticles = useMemo(() => articles.filter((article) => {
    const matchesCategory = category === "全部" || article.topic === category;
    const normalized = query.trim().toLowerCase();
    return matchesCategory && (!normalized || `${article.title} ${article.excerpt} ${article.category} ${article.tags.join(" ")}`.toLowerCase().includes(normalized));
  }), [category, query]);

  const openArticle = (article: Article) => setSelected(article);
  const selectNav = (item: string) => {
    setActiveNav(item);
    if (item === "首页" || item === "文章") setCategory("全部");
    if (item === "标签") setQuery("");
  };
  const selectTag = (tag: string) => {
    setActiveNav("文章");
    setCategory("全部");
    setQuery(tag);
  };
  if (selected !== null) return <ArticleDetail article={selected} onBack={() => setSelected(null)} />;

  return <div className={`blog-app ${dark ? "theme-dark" : ""}`}>
    <header className="blog-header"><a className="blog-brand" href="#top" aria-label="返回首页" onClick={() => selectNav("首页")}><span className="brand-logo"><i /><i /><i /></span><strong>清川的博客</strong><em /><span>记录思考，创造更好的自己</span></a><nav className="main-nav" aria-label="主导航">{["首页", "文章", "专栏", "标签", "关于"].map((item) => <button key={item} className={activeNav === item ? "active" : ""} type="button" onClick={() => selectNav(item)}>{item}</button>)}</nav><div className="header-actions"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setActiveNav("文章"); }} placeholder="搜索文章、标签或内容..." aria-label="搜索文章" /><kbd>⌘ K</kbd></label><button className="theme-button" type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? "切换浅色模式" : "切换深色模式"}>{dark ? "☼" : "☾"}</button><button className="subscribe-button" type="button" onClick={() => setSubscribed(true)}>{subscribed ? "已订阅" : "订阅"}</button></div></header>
    <main id="top" className="blog-main"><section className="hero-layout"><article className="featured-card"><div className="featured-copy"><span className="eyebrow">✦　精选文章</span><h1>在不确定的时代，<br />如何保持长期主义</h1><p>面对快速变化的世界，我们更需要回到内心，建立自己的节奏。这篇文章分享我在过去几年中的一些思考与实践，希望能给同样迷茫的你带来一点启发。</p><button className="read-button" type="button" onClick={() => openArticle(articles[3])}>阅读全文　→</button><div className="article-meta"><span>▣　2024年4月22日</span><span>⊙　12.4k 阅读</span><span>▢　128 评论</span></div></div><div className="hero-art" aria-hidden="true"><div className="sun" /><div className="ridge ridge-one" /><div className="ridge ridge-two" /><div className="traveler">●<span>│</span><b>╱╲</b></div><small>更好的自己，<br />一直在路上。</small></div></article><AuthorCard onSubscribe={() => setSubscribed(true)} /></section>
      <div className="content-layout"><section className="latest-section"><div className="section-heading"><h2>最新文章</h2><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} type="button" onClick={() => { setCategory(item); setActiveNav("文章"); }}>{item}</button>)}</div></div><div className="article-list">{visibleArticles.length > 0 ? visibleArticles.map((article) => <ArticleCard key={article.id} article={article} onOpen={openArticle} />) : <div className="empty-state">没有找到匹配的文章，试试其他关键词吧。</div>}</div></section><aside className="right-rail"><QuoteCard /><TagsCard onSelect={selectTag} /><SubscribeCard subscribed={subscribed} onSubscribe={() => setSubscribed(true)} /></aside></div>
    </main>
    {subscribed && <button className="toast" type="button" onClick={() => setSubscribed(false)}>✓ 已加入清川的邮件通讯</button>}
  </div>;
}

function AuthorCard({ onSubscribe }: { onSubscribe: () => void }) { return <article className="side-card author-card"><div className="author-head"><div className="avatar">清</div><div><h3>清川</h3><p>产品人 · 写作者 · 终身学习者</p></div></div><p className="author-intro">记录关于产品、技术、生活与成长的思考。相信持续输出能让自己变得更好，也希望这些文字能对你有所启发。</p><div className="socials"><button type="button" aria-label="GitHub">●</button><button type="button" aria-label="知乎">知</button><button type="button" aria-label="微博">◉</button><button type="button" aria-label="视频号">▣</button><button type="button" aria-label="邮件">✉</button></div><div className="author-stats"><span><b>156</b>文章</span><span><b>12.4k</b>订阅者</span><span><b>3</b>专栏</span></div><button className="follow-button" type="button" onClick={onSubscribe}>♙　关注我</button></article>; }

function ArticleCard({ article, onOpen }: { article: Article; onOpen: (article: Article) => void }) { return <article aria-label={`阅读：${article.title}`} className="article-card" role="button" tabIndex={0} onClick={() => onOpen(article)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(article); } }}><div className={`article-art ${article.tone}`}><span>{article.motif}</span></div><div className="article-copy"><div className="article-title"><h3>{article.title}</h3><span className="tag">{article.category}</span></div><p>{article.excerpt}</p><div className="article-meta"><span>▣　{article.date}</span><span>⊙　{article.views} 阅读</span><span>▢　{article.comments} 评论</span></div></div></article>; }

function QuoteCard() { return <article className="side-card quote-card"><span className="quote-mark">“</span><blockquote>生活不在别处，<br />当下的每一刻，都是最好的开始。</blockquote><cite>—— 清川</cite></article>; }
function TagsCard({ onSelect }: { onSelect: (tag: string) => void }) { const tags = ["产品思考", "技术心得", "效率工具", "AI", "生活随笔", "阅读", "成长", "独立开发", "设计", "职场"]; return <article className="side-card tags-card"><div className="rail-title"><h3>◆　热门标签</h3><button type="button" onClick={() => onSelect("")}>查看全部　›</button></div><div className="tag-cloud">{tags.map((tag, index) => <button key={tag} className={index === 0 ? "selected" : ""} type="button" onClick={() => onSelect(tag)}>{tag} <small>{24 - index * 2}</small></button>)}</div></article>; }
function SubscribeCard({ subscribed, onSubscribe }: { subscribed: boolean; onSubscribe: () => void }) { return <article className="subscribe-card"><div className="plant-art">♧</div><div><h3>订阅我的博客</h3><p>不错过新的思考与分享</p></div><button type="button" onClick={onSubscribe} aria-label="订阅博客">{subscribed ? "✓" : "→"}</button></article>; }
function ArticleDetail({ article, onBack }: { article: Article; onBack: () => void }) { return <div className="blog-app detail-page"><header className="blog-header"><button className="back-link" type="button" onClick={onBack}>← 返回首页</button><strong className="detail-brand">清川的博客</strong></header><main className="detail-main"><span className="eyebrow">{article.category}　·　{article.date}</span><h1>{article.title}</h1><p className="detail-lead">{article.excerpt}</p><div className={`detail-art ${article.tone}`}><span>{article.motif}</span></div><article className="detail-body"><p>我们总是在寻找更确定的答案，却忘了真正重要的，是在变化中保留自己的判断。愿每一次记录，都能帮助我们看见更清晰的方向。</p><h2>把时间用在值得的地方</h2><p>从一个微小的行动开始，保持好奇、持续实践，并把经验分享给更多同路人。长期主义并不意味着等待，而是认真对待当下的每一步。</p><button className="read-button" type="button" onClick={onBack}>继续浏览文章　→</button></article></main></div>; }
