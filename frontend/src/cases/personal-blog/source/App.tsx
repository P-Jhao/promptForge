import { useMemo, useState } from "react";
import type { ReactNode, SVGProps } from "react";

type Theme = "light" | "dark";
type IconName = "arrow" | "arrowLeft" | "clock" | "moon" | "search" | "spark" | "sun";

interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  body: string[];
  tags: string[];
  cover: "blue" | "violet" | "sunset" | "mint";
  featured?: boolean;
}

const CATEGORIES = ["全部文章", "设计", "工程", "生活"];
const ARTICLES: Article[] = [
  {
    id: "a-001",
    title: "把复杂的工作台留在一个清晰的界面里",
    category: "设计",
    date: "2024-06-18",
    readTime: "6 分钟",
    excerpt: "当用户同时需要对话、代码和预览时，界面应该怎样安排层级？",
    body: [
      "我一直在寻找一种更安静的工作台。它应该保留复杂的状态，却不把每一条状态都推到用户面前。",
      "顶部只负责项目身份，左侧留下需求与反馈，右侧让结果占据足够的空间。这样的分区让每一次动作都有清楚的归属。",
      "好的界面不是把所有按钮藏起来，而是让下一步在当前上下文中自然出现。我们需要做的，是给信息留出呼吸的距离。",
    ],
    tags: ["界面设计", "产品思考"],
    cover: "blue",
    featured: true,
  },
  {
    id: "a-002",
    title: "为小型产品建立一份可读的数据字典",
    category: "工程",
    date: "2024-06-09",
    readTime: "8 分钟",
    excerpt: "数据结构不只属于数据库，它也决定了团队如何讨论一件事情。",
    body: [
      "当一个产品刚刚开始时，数据字典常常被认为是额外工作。事实上，清楚的字段名称会让需求、设计和实现少走许多弯路。",
      "我会先从用户能看到的对象开始，再记录状态变化和边界条件。每一项都配一个小例子，讨论时就不会只依赖抽象名词。",
      "这份字典不需要一次完成，但需要在产品变化时继续保持可读。它最终会成为团队共享的地图。",
    ],
    tags: ["工程实践", "协作"],
    cover: "violet",
  },
  {
    id: "a-003",
    title: "周末散步时记下的三种蓝色",
    category: "生活",
    date: "2024-05-27",
    readTime: "4 分钟",
    excerpt: "海边、旧墙和傍晚的玻璃窗，分别把光留在不同的位置。",
    body: [
      "第一种蓝色在海面上，它会随着风把边界推远。第二种蓝色藏在旧墙的阴影里，粗糙而安静。",
      "第三种蓝色来自傍晚的玻璃窗，室内的灯亮起后，街道忽然变得像一张反向的照片。",
      "记录这些颜色并不能改变一天，却会让我更清楚地记得这一天。",
    ],
    tags: ["观察", "随笔"],
    cover: "sunset",
  },
  {
    id: "a-004",
    title: "组件之间的距离也需要被设计",
    category: "设计",
    date: "2024-05-12",
    readTime: "5 分钟",
    excerpt: "留白不是装饰，它让相邻的动作和信息拥有不同的重量。",
    body: [
      "在组件库里，间距常常以几个数字出现。但真正使用它们时，间距表达的是关系：哪些东西属于同一组，哪些内容需要停顿。",
      "我会先看一块界面里最重要的阅读路径，再决定间距的节奏，而不是从某一个按钮开始套用 token。",
      "当布局变得拥挤时，先删除一层视觉噪音，往往比继续缩小字体更有效。",
    ],
    tags: ["设计系统", "排版"],
    cover: "mint",
  },
];

const getFeaturedArticle = (): Article => {
  const article = ARTICLES.find((item) => item.featured);
  if (article === undefined) throw new Error("博客案例缺少精选文章");
  return article;
};
const FEATURED_ARTICLE = getFeaturedArticle();

function Icon({ name, size = 16, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    arrowLeft: <path d="M20 12H5m6-6-6 6 6 6" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></>,
    moon: <path d="M20 15.3A8.1 8.1 0 0 1 8.7 4a8 8 0 1 0 11.3 11.3Z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>,
    spark: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6 12 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z" />,
    sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  };
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width={size} {...props}>{paths[name]}</svg>;
}

function formatDate(date: string) {
  return date.replace("-", "年").replace("-", "月") + "日";
}

function CoverArt({ article, compact = false }: { article: Article; compact?: boolean }) {
  return <div aria-hidden="true" className={`cover-art cover-${article.cover}${compact ? " compact" : ""}`}>
    <span className="cover-orb orb-one" />
    <span className="cover-orb orb-two" />
    <span className="cover-grid" />
    <span className="cover-caption">{article.category} / 24</span>
    <strong>{article.cover === "blue" ? "A quiet\ninterface" : article.cover === "violet" ? "Make it\nreadable" : article.cover === "sunset" ? "Notes from\na slow day" : "Space is\na feature"}</strong>
  </div>;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [category, setCategory] = useState("全部文章");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeArticle = ARTICLES.find((article) => article.id === activeId) ?? null;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ARTICLES.filter((article) => (category === "全部文章" || article.category === category) && (normalized.length === 0 || `${article.title} ${article.excerpt} ${article.tags.join(" ")}`.toLowerCase().includes(normalized)));
  }, [category, query]);
  const nextArticle = activeArticle === null ? null : ARTICLES[(ARTICLES.findIndex((article) => article.id === activeArticle.id) + 1) % ARTICLES.length];
  const selectCategory = (value: string) => { setCategory(value); setActiveId(null); };
  const resetFilters = () => { setQuery(""); setCategory("全部文章"); };

  return <div className={`blog-app ${theme}`}>
    <header className="blog-header">
      <a className="blog-brand" href="#top" onClick={() => setActiveId(null)}><span className="brand-mark"><Icon name="spark" size={17} /></span><span>墨光手记</span><small>PERSONAL NOTES</small></a>
      <nav aria-label="博客导航"><button className={activeId === null && category === "全部文章" ? "active" : ""} onClick={() => selectCategory("全部文章")} type="button">文章</button><button className={category === "设计" && activeId === null ? "active" : ""} onClick={() => selectCategory("设计")} type="button">设计</button><button className={category === "工程" && activeId === null ? "active" : ""} onClick={() => selectCategory("工程")} type="button">工程</button><button className={category === "生活" && activeId === null ? "active" : ""} onClick={() => selectCategory("生活")} type="button">生活</button></nav>
      <button aria-label="切换阅读主题" aria-pressed={theme === "dark"} className="theme-toggle" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} type="button"><Icon name={theme === "light" ? "moon" : "sun"} size={15} /><span>{theme === "light" ? "深色" : "浅色"}</span></button>
    </header>
    <main className="blog-main" id="top">
      {activeArticle === null ? <>
        <section className="blog-hero">
          <div className="hero-copy"><p className="eyebrow"><span /> NOTES FROM A PRODUCT DESIGNER</p><h1>把日常的想法，<br /><em>写成可阅读的形状。</em></h1><p className="hero-description">关于界面、工程与日常观察的个人博客。把做产品时遇到的难题，和路上偶然发现的光，慢慢整理成文字。</p><div className="hero-actions"><button className="primary-button" onClick={() => setActiveId(FEATURED_ARTICLE.id)} type="button">阅读精选 <Icon name="arrow" size={16} /></button><button className="text-button" onClick={() => selectCategory("全部文章")} type="button">浏览全部文章 <Icon name="arrow" size={15} /></button></div><div className="hero-proof"><span><Icon name="spark" size={14} /> 每周更新</span><span><Icon name="clock" size={14} /> 约 18 篇笔记</span></div></div>
          <div className="hero-feature"><div className="feature-window"><div className="window-bar"><span /><span /><span /><small>墨光手记 / 精选</small></div><CoverArt article={FEATURED_ARTICLE} /></div><div className="feature-note"><span className="note-dot" /><span>Featured note</span><strong>{FEATURED_ARTICLE.readTime}</strong></div></div>
        </section>
        <section className="signal-row" aria-label="博客主题"><span>DESIGNING WITH CLARITY</span><i /><span>WRITING WITH INTENTION</span><i /><span>LEARNING IN PUBLIC</span></section>
        <section className="article-section"><div className="section-heading"><div><p className="eyebrow">THE NOTEBOOK</p><h2>最近写下的事</h2></div><p>从产品细节到生活观察，<br />每一篇都留一点思考的余温。</p></div><div className="blog-controls"><div className="category-tabs" role="tablist" aria-label="文章分类">{CATEGORIES.map((item) => <button aria-selected={category === item} className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)} role="tab" type="button">{item}</button>)}</div><label className="blog-search"><Icon name="search" size={16} /><input aria-label="搜索文章" onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章" value={query} />{query && <button aria-label="清除搜索" onClick={() => setQuery("")} type="button">×</button>}</label></div><div className="result-line"><span>{filtered.length} 篇文章</span>{query && <span>正在搜索 “{query}”</span>}</div><div className="article-grid" aria-live="polite">{filtered.map((article, index) => <article className={`article-card${index === 0 ? " first" : ""}`} key={article.id}><CoverArt article={article} compact /><div className="article-card-content"><div className="article-meta"><span>{article.category}</span><time>{formatDate(article.date)}</time></div><h3>{article.title}</h3><p>{article.excerpt}</p><div className="card-bottom"><span>{article.readTime} 阅读</span><button aria-label={`阅读：${article.title}`} className="read-link" onClick={() => setActiveId(article.id)} type="button"><Icon name="arrow" size={17} /></button></div></div></article>)}{filtered.length === 0 && <div className="blog-empty"><strong>没有找到相关文章</strong><span>换一个关键词，或者查看全部文章。</span><button onClick={resetFilters} type="button">清除筛选</button></div>}</div></section>
      </> : <ArticleDetail article={activeArticle} nextArticle={nextArticle} onBack={() => setActiveId(null)} onNext={() => setActiveId(nextArticle?.id ?? null)} />}
    </main>
    <footer className="blog-footer"><div className="footer-brand"><span className="brand-mark"><Icon name="spark" size={15} /></span><span>墨光手记</span></div><span>虚构内容 · 当前阅读主题：{theme === "light" ? "明亮" : "深色"}</span><span>© 2024 · Made with curiosity</span></footer>
  </div>;
}

function ArticleDetail({ article, nextArticle, onBack, onNext }: { article: Article; nextArticle: Article | null; onBack: () => void; onNext: () => void }) {
  return <article className="article-detail"><button className="back-link" onClick={onBack} type="button"><Icon name="arrowLeft" size={16} /> 返回文章列表</button><div className="detail-layout"><div className="detail-copy"><div className="article-detail-meta"><span>{article.category}</span><time>{formatDate(article.date)} · {article.readTime}</time></div><h1>{article.title}</h1><p className="article-lede">{article.excerpt}</p><div className="detail-author"><span className="author-avatar">M</span><span><strong>墨光</strong><small>产品设计与生活记录</small></span></div><div className="article-body">{article.body.map((paragraph, index) => index === 1 ? <p className="body-quote" key={paragraph}>“{paragraph}”</p> : <p key={paragraph}>{paragraph}</p>)}</div><div className="article-end"><span>感谢阅读这篇笔记</span>{nextArticle && <button onClick={onNext} type="button">下一篇 <Icon name="arrow" size={15} /></button>}</div></div><aside className="detail-aside"><CoverArt article={article} /><span className="aside-label">读完这篇，花一点时间</span><strong>记下你自己的<br />下一步。</strong></aside></div></article>;
}
