export type Category = "全部" | "产品" | "技术" | "生活" | "思考";
export type ArticleTopic = Exclude<Category, "全部">;
export type ArtworkTone = "mountain" | "desk" | "coast" | "code" | "forest" | "night";

export interface ArticleSection {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  topic: ArticleTopic;
  tags: readonly string[];
  date: string;
  views: string;
  comments: number;
  readingTime: string;
  tone: ArtworkTone;
  kicker: string;
  sections: readonly ArticleSection[];
}

export interface PopularTag {
  label: string;
  count: number;
}

export type NavItem = "首页" | "文章" | "专栏" | "标签" | "关于";
export type ThemeMode = "light" | "dark";
