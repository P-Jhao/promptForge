import type { SandpackFiles } from "@/types/store";
import {
  validateResourceManifest,
  type CaseResourceManifest,
} from "@/cases/resourceManifest";
import { TASK_BOARD_CASE_FILES } from "./generatedFiles";

export const TASK_BOARD_CASE_MANIFEST: CaseResourceManifest = {
  version: 1,
  caseId: "task-board-real-eval",
  resources: [],
  externalResources: [],
};

/**
 * The independent case is generated from the checked-in real source tree.
 * Keeping the map static lets the client load it without filesystem access or chat.
 */
export function createTaskBoardCaseFiles(): SandpackFiles {
  const files: SandpackFiles = {};
  for (const [path, source] of Object.entries(TASK_BOARD_CASE_FILES)) {
    if (typeof source !== "string" || source.trim().length === 0) {
      throw new Error(`任务看板案例包含空文件：${path}`);
    }
    files[path] = { code: source };
  }

  if (files["/index.tsx"] === undefined || files["/App.tsx"] === undefined) {
    throw new Error("任务看板案例缺少 /index.tsx 或 /App.tsx");
  }
  validateResourceManifest(files, TASK_BOARD_CASE_MANIFEST);
  return files;
}
