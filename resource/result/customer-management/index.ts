import type { SandpackFiles } from "@/types/store";
import type { CaseResourceManifest } from "../resourceManifest";
import { validateResourceManifest } from "../resourceManifest";
import { CUSTOMER_MANAGEMENT_CASE_FILES } from "./generatedFiles";

export const CUSTOMER_MANAGEMENT_CASE_MANIFEST: CaseResourceManifest = { version: 1, caseId: "customer-management-demo", resources: [], externalResources: [] };

export function createCustomerManagementCaseFiles(): SandpackFiles {
  const files: SandpackFiles = {};
  for (const [path, code] of Object.entries(CUSTOMER_MANAGEMENT_CASE_FILES)) {
    if (typeof code !== "string" || code.length === 0) throw new Error(`客户管理案例包含空文件：${path}`);
    files[path] = { code };
  }
  if (files["/App.tsx"] === undefined || files["/index.tsx"] === undefined || files["/styles.css"] === undefined) throw new Error("客户管理案例缺少入口或样式文件");
  validateResourceManifest(files, CUSTOMER_MANAGEMENT_CASE_MANIFEST);
  return files;
}
