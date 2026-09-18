import type { CaseResourceManifest } from "./resourceManifest";
import type { SandpackFiles } from "@/types/store";
import type { NovelCaseScene } from "./novelCase";

export type WorkspaceCaseId =
  | "novel"
  | "task-board-real-eval"
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
  sourceLabel: string;
  status: "READY" | "PENDING_BROWSER";
}

export const CASE_DESCRIPTORS: readonly WorkspaceCaseDescriptor[] = [
  { id: "novel", title: "小说阅读管理", sourceLabel: "backend/mock 组装成果", status: "READY" },
  { id: "task-board-real-eval", title: "任务看板", sourceLabel: "真实 EVAL 产物与人工修正", status: "READY" },
  { id: "customer-management-demo", title: "客户管理后台", sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收", status: "PENDING_BROWSER" },
  { id: "analytics-dashboard-demo", title: "数据分析看板", sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收", status: "PENDING_BROWSER" },
  { id: "personal-blog-demo", title: "清川的博客", sourceLabel: "真实生成后由 Luna 修正并固化，浏览器待验收", status: "PENDING_BROWSER" },
];

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
  if (caseId === "task-board-real-eval") {
    const caseModule = await import("./task-board/taskBoardCase");
    return { id: caseId, title: "任务看板", files: caseModule.createTaskBoardCaseFiles(), manifest: caseModule.TASK_BOARD_CASE_MANIFEST };
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
