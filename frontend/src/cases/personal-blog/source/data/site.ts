import type { Category, NavItem, PopularTag } from "../types/blog";

export const categories: readonly Category[] = ["全部", "产品", "技术", "生活", "思考"];
export const navItems: readonly NavItem[] = ["首页", "文章", "专栏", "标签", "关于"];

export const popularTags: readonly PopularTag[] = [
  { label: "产品思考", count: 24 },
  { label: "技术心得", count: 18 },
  { label: "效率工具", count: 16 },
  { label: "AI", count: 15 },
  { label: "生活随笔", count: 12 },
  { label: "阅读", count: 11 },
  { label: "成长", count: 10 },
  { label: "独立开发", count: 8 },
  { label: "设计", count: 8 },
  { label: "职场", count: 6 },
];

export const author = {
  name: "清川",
  role: "产品人 · 写作者 · 终身学习者",
  intro: "记录关于产品、技术、生活与成长的思考。相信持续输出能让自己变得更好，也希望这些文字能对你有所启发。",
  articles: 156,
  subscribers: "12.4k",
  columns: 3,
} as const;

export const columns = [
  { title: "产品手记", description: "从需求、体验到长期价值，记录产品工作的判断框架。", topic: "产品" as const },
  { title: "独立开发日志", description: "把想法做成产品：技术选择、迭代和发布后的复盘。", topic: "技术" as const },
  { title: "慢生活练习", description: "旅行、阅读与日常观察，给高速生活留一块缓冲区。", topic: "生活" as const },
] as const;
