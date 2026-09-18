import type { CaseResourceManifest } from "./resourceManifest";
import type { SandpackFiles } from "@/types/store";
import type { NovelCaseScene } from "./novelCase";

export type WorkspaceCaseId =
  | "novel"
  | "customer-management-demo"
  | "analytics-dashboard-demo"
  | "personal-blog-demo";

export interface WorkspaceCaseBundle {
  id: WorkspaceCaseId;
  title: string;
  files: SandpackFiles;
  manifest?: CaseResourceManifest;
}

export interface WorkspaceCaseDescriptor {
  id: WorkspaceCaseId;
  title: string;
  navigationTitle: string;
  subtitle: string;
  description: string;
  features: readonly string[];
  sourceLabel: string;
  status: "READY" | "PENDING_BROWSER";
}

export const CASE_DESCRIPTORS: readonly WorkspaceCaseDescriptor[] = [
  {
    id: "novel",
    title: "小说阅读管理",
    navigationTitle: "小说阅读管理",
    subtitle: "Library / Reading",
    description: "一个带有书库、阅读记录和笔记整理能力的内容管理案例。",
    features: ["书库浏览", "阅读记录", "笔记整理"],
    sourceLabel: "backend/mock 组装成果",
    status: "READY",
  },
  {
    id: "customer-management-demo",
    title: "客户管理后台",
    navigationTitle: "客户管理后台",
    subtitle: "CRM / Dashboard",
    description: "这是一个客户管理系统示例，用于展示 PromptForge 可以生成什么类型的实际应用。",
    features: ["客户数据概览", "搜索与多条件筛选", "客户列表", "客户状态管理", "客户详情抽屉", "新增客户流程"],
    sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收",
    status: "PENDING_BROWSER",
  },
  {
    id: "analytics-dashboard-demo",
    title: "数据分析看板",
    navigationTitle: "数据分析看板",
    subtitle: "Analytics / Dashboard",
    description: "一个将指标、趋势和分类数据集中到同一视图的数据分析案例。",
    features: ["指标卡片", "趋势图表", "渠道分析"],
    sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收",
    status: "PENDING_BROWSER",
  },
  {
    id: "personal-blog-demo",
    title: "清川的博客",
    navigationTitle: "青山博客",
    subtitle: "Content / Blog",
    description: "一个支持文章浏览、分类和阅读主题切换的个人博客案例。",
    features: ["文章列表", "分类筛选", "阅读主题"],
    sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收",
    status: "PENDING_BROWSER",
  },
];

export function getSelectableWorkspaceCaseDescriptors(
  descriptors: readonly WorkspaceCaseDescriptor[] = CASE_DESCRIPTORS,
): readonly WorkspaceCaseDescriptor[] {
  return descriptors.filter((descriptor) => descriptor.id !== "novel");
}

export function isWorkspaceCaseId(value: string | null): value is WorkspaceCaseId {
  return value !== null && CASE_DESCRIPTORS.some((descriptor) => descriptor.id === value);
}

export async function loadWorkspaceCase(
  caseId: WorkspaceCaseId,
  scene: NovelCaseScene = "library",
): Promise<WorkspaceCaseBundle> {
  if (caseId === "novel") {
    const caseModule = await import("./novelCase");
    return { id: caseId, title: "小说阅读管理", files: caseModule.createNovelCaseFiles(scene), manifest: caseModule.NOVEL_CASE_MANIFEST };
  }
  if (caseId === "customer-management-demo") {
    const caseModule = await import("./customer-management");
    return { id: caseId, title: "客户管理后台", files: caseModule.createCustomerManagementCaseFiles(), manifest: caseModule.CUSTOMER_MANAGEMENT_CASE_MANIFEST };
  }
  if (caseId === "analytics-dashboard-demo") {
    const caseModule = await import("./analytics-dashboard");
    return { id: caseId, title: "数据分析看板", files: caseModule.createAnalyticsDashboardCaseFiles(), manifest: caseModule.ANALYTICS_DASHBOARD_CASE_MANIFEST };
  }
  const caseModule = await import("./personal-blog");
  return { id: caseId, title: "清川的博客", files: caseModule.createPersonalBlogCaseFiles(), manifest: caseModule.PERSONAL_BLOG_CASE_MANIFEST };
}
