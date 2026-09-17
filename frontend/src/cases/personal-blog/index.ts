import type { SandpackFiles } from "@/types/store";
import type { CaseResourceManifest } from "../resourceManifest";
import { validateResourceManifest } from "../resourceManifest";
import { PERSONAL_BLOG_CASE_FILES } from "./generatedFiles";

export const PERSONAL_BLOG_CASE_MANIFEST: CaseResourceManifest = { version: 1, caseId: "personal-blog-demo", resources: [], externalResources: [] };

export function createPersonalBlogCaseFiles(): SandpackFiles {
  const files: SandpackFiles = {};
  for (const [path, code] of Object.entries(PERSONAL_BLOG_CASE_FILES)) {
    if (typeof code !== "string" || code.length === 0) throw new Error(`博客案例包含空文件：${path}`);
    files[path] = { code };
  }
  if (files["/App.tsx"] === undefined || files["/index.tsx"] === undefined || files["/styles.css"] === undefined) throw new Error("博客案例缺少入口或样式文件");
  validateResourceManifest(files, PERSONAL_BLOG_CASE_MANIFEST);
  return files;
}
