import { randomUUID } from "node:crypto";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getStructuredModel } from "../agents/utils/model.js";
import { withRetry } from "../agents/utils/retry.js";
import {
  applyFileChanges,
  EditModelResultSchema,
  hashEditBase,
  type EditBaseSnapshot,
  type FileChange,
} from "./editContract.js";
import type { ChatMessage } from "../agents/adapters/routeTypes.js";

export interface EditCandidatePayload {
  candidateId: string;
  runId: string;
  operation: "edit";
  projectId: string;
  baseVersionId: string | null;
  baseHash: string;
  files: Record<string, string>;
  resources: EditBaseSnapshot["resources"];
  changes: FileChange[];
  summary: string;
}

const EDIT_SYSTEM_PROMPT = `你是 PromptForge 的小范围代码修改器。
你必须只返回 JSON，符合 {"summary": string, "changes": [{"operation":"add"|"modify"|"delete","path": string,"content"?: string}]}。
以提供的当前文件快照为唯一基线。只输出满足用户需求所需的最小文件变更：add 必须是不存在的新文件，modify 必须保留未涉及部分并提供完整新文件内容，delete 只能删除确实存在的文件。
路径必须是以 / 开始的项目相对路径；不要输出路径遍历、依赖安装命令、shell 命令、密钥或二进制内容。不要把未涉及的文件重写成变更。`;

export async function generateEditCandidate(
  base: EditBaseSnapshot,
  prompt: string,
  messages: readonly ChatMessage[],
  runId: string,
): Promise<EditCandidatePayload> {
  if (hashEditBase(base.files, base.resources) !== base.hash) {
    throw new Error("编辑基线 hash 与文件快照不一致，已阻止生成候选");
  }

  const model = getStructuredModel(EditModelResultSchema);
  const context = JSON.stringify({
    projectId: base.projectId,
    baseVersionId: base.versionId,
    baseHash: base.hash,
    resources: base.resources,
    files: base.files,
  });
  const history = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-6)
    .map((message) => ({ role: message.role, content: typeof message.content === "string" ? message.content : "" }));
  const result = await withRetry(model, [
    new SystemMessage(EDIT_SYSTEM_PROMPT),
    new HumanMessage(`用户修改需求：\n${prompt}\n\n最近对话：\n${JSON.stringify(history)}\n\n当前基线：\n${context}`),
  ], { maxRetries: 2 });
  const parsed = EditModelResultSchema.parse(result);
  const applied = applyFileChanges(base.files, parsed.changes);
  return {
    candidateId: `candidate-${randomUUID()}`,
    runId,
    operation: "edit",
    projectId: base.projectId,
    baseVersionId: base.versionId,
    baseHash: base.hash,
    files: applied.files,
    resources: base.resources.map((resource) => ({ ...resource })),
    changes: applied.changes,
    summary: parsed.summary,
  };
}
