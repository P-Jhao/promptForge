import type { SandpackFiles } from "@/types/store";
import type { CaseResourceManifest } from "../resourceManifest";
import { validateResourceManifest } from "../resourceManifest";
import { ANALYTICS_DASHBOARD_CASE_FILES } from "./generatedFiles";

export const ANALYTICS_DASHBOARD_CASE_MANIFEST: CaseResourceManifest = { version: 1, caseId: "analytics-dashboard-demo", resources: [], externalResources: [] };

export function createAnalyticsDashboardCaseFiles(): SandpackFiles {
  const files: SandpackFiles = {};
  for (const [path, code] of Object.entries(ANALYTICS_DASHBOARD_CASE_FILES)) {
    if (typeof code !== "string" || code.length === 0) throw new Error(`分析案例包含空文件：${path}`);
    files[path] = { code };
  }
  if (files["/App.tsx"] === undefined || files["/index.tsx"] === undefined || files["/styles.css"] === undefined) throw new Error("分析案例缺少入口或样式文件");
  validateResourceManifest(files, ANALYTICS_DASHBOARD_CASE_MANIFEST);
  return files;
}
