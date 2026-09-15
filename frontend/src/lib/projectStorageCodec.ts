import type {
  ProjectRecord,
  ProjectSummary,
  SerializableAttachment,
  SerializableFileMap,
  SerializableMessage,
  VersionRecord,
  WorkspaceRecord,
  RunRecord,
  ResourceRecord,
} from "@/types/project";
import { isSchemaVersion } from "./projectStorage";
import { parseValidationReport } from "./validationStorage";

export function parseProjectRecord(value: unknown): ProjectRecord {
  const record = requireRecord(value, "项目记录");
  return {
    schemaVersion: requireSchema(record.schemaVersion, "项目记录"),
    projectId: requireId(record.projectId, "项目 ID"),
    name: requireString(record.name, "项目名称"),
    createdAt: requireTimestamp(record.createdAt, "项目创建时间"),
    updatedAt: requireTimestamp(record.updatedAt, "项目更新时间"),
    revision: requireInteger(record.revision, "项目修订号"),
    currentWorkspaceId: requireId(record.currentWorkspaceId, "工作副本 ID"),
    acceptedVersionId: optionalNullableId(record.acceptedVersionId),
    currentVersion: requireInteger(record.currentVersion, "当前版本号"),
    messages: parseMessages(record.messages),
    latestRunId: optionalNullableId(record.latestRunId),
  };
}

export function parseWorkspaceRecord(value: unknown): WorkspaceRecord {
  const record = requireRecord(value, "工作副本记录");
  const filesHash = requireString(record.filesHash, "工作副本 hash");
  if (!/^[0-9a-f]{64}$/.test(filesHash)) throw corrupt("工作副本 hash 格式无效");
  return {
    schemaVersion: requireSchema(record.schemaVersion, "工作副本记录"),
    workspaceId: requireId(record.workspaceId, "工作副本 ID"),
    projectId: requireId(record.projectId, "工作副本项目 ID"),
    createdAt: requireTimestamp(record.createdAt, "工作副本创建时间"),
    updatedAt: requireTimestamp(record.updatedAt, "工作副本更新时间"),
    savedAt: requireTimestamp(record.savedAt, "工作副本保存时间"),
    filesHash,
    files: parseFiles(record.files),
  };
}

export function parseVersionRecord(value: unknown): VersionRecord {
  const record = requireRecord(value, "版本记录");
  const changes = record.changes === undefined ? undefined : parseChanges(record.changes);
  const files = record.files === null ? null : parseFiles(record.files);
  const filesHash = record.filesHash === null ? null : requireString(record.filesHash, "版本 hash");
  if (filesHash !== null && !/^[0-9a-f]{64}$/.test(filesHash)) throw corrupt("版本 hash 格式无效");
  return {
    schemaVersion: requireSchema(record.schemaVersion, "版本记录"),
    versionId: requireId(record.versionId, "版本 ID"),
    projectId: requireId(record.projectId, "版本项目 ID"),
    versionNumber: requirePositiveInteger(record.versionNumber, "版本号"),
    threadId: requireString(record.threadId, "版本 threadId"),
    assistantMessageId: requireString(record.assistantMessageId, "版本消息 ID"),
    operation: requireOperation(record.operation),
    prompt: requireString(record.prompt, "版本 prompt"),
    timestamp: requireTimestamp(record.timestamp, "版本时间"),
    files,
    filesHash,
    fileCount: requireInteger(record.fileCount, "版本文件数"),
    changes,
    parentVersionId: optionalId(record.parentVersionId),
    restoredFromVersionId: optionalId(record.restoredFromVersionId),
  };
}

export function parseRunRecord(value: unknown): RunRecord {
  const record = requireRecord(value, "运行记录");
  const status = record.status;
  if (status !== "idle" && status !== "running" && status !== "success" && status !== "error" && status !== "cancelled") {
    throw corrupt("运行状态无效");
  }
  const mode = record.mode;
  if (mode !== undefined && mode !== "mock" && mode !== "real") throw corrupt("运行模式无效");
  return {
    schemaVersion: requireSchema(record.schemaVersion, "运行记录"),
    runId: requireId(record.runId, "运行 ID"),
    projectId: requireId(record.projectId, "运行项目 ID"),
    kind: record.kind === "generation" ? "generation" : (() => { throw corrupt("运行类型无效"); })(),
    validationReport: record.validationReport === undefined ? undefined : parseValidationReport(record.validationReport),
    status,
    mode,
    modeForced: optionalBoolean(record.modeForced),
    startedAt: requireTimestamp(record.startedAt, "运行开始时间"),
    endedAt: optionalTimestamp(record.endedAt),
    currentPhase: optionalString(record.currentPhase),
    currentStep: optionalString(record.currentStep),
    failedNode: optionalString(record.failedNode),
    error: optionalString(record.error),
  };
}

export function parseResourceRecord(value: unknown): ResourceRecord {
  const record = requireRecord(value, "资源记录");
  const status = record.status;
  if (status !== "available" && status !== "missing" && status !== "unknown") throw corrupt("资源状态无效");
  return {
    schemaVersion: requireSchema(record.schemaVersion, "资源记录"),
    resourceKey: requireId(record.resourceKey, "资源键"),
    projectId: requireId(record.projectId, "资源项目 ID"),
    id: requireId(record.id, "资源 ID"),
    kind: requireString(record.kind, "资源类型"),
    hostPath: requireString(record.hostPath, "资源宿主路径"),
    sandpackPath: requireString(record.sandpackPath, "资源 Sandpack 路径"),
    exportPath: requireString(record.exportPath, "资源导出路径"),
    contentType: requireString(record.contentType, "资源内容类型"),
    source: requireString(record.source, "资源来源"),
    status,
  } satisfies ResourceRecord;
}

export function projectSummary(record: ProjectRecord): ProjectSummary {
  return {
    projectId: record.projectId,
    name: record.name,
    updatedAt: record.updatedAt,
    revision: record.revision,
    currentVersion: record.currentVersion,
    dirtyAtSave: false,
  };
}

function parseMessages(value: unknown): SerializableMessage[] {
  if (!Array.isArray(value)) throw corrupt("项目消息不是数组");
  return value.map((item) => {
    const record = requireRecord(item, "消息");
    const role = record.role;
    if (role !== "user" && role !== "assistant") throw corrupt("消息角色无效");
    const attachments = record.attachments === undefined ? undefined : parseAttachments(record.attachments);
    return { id: requireString(record.id, "消息 ID"), role, content: requireString(record.content, "消息内容"), attachments };
  });
}

function parseAttachments(value: unknown): SerializableAttachment[] {
  if (!Array.isArray(value)) throw corrupt("消息附件不是数组");
  return value.map((item) => {
    const record = requireRecord(item, "消息附件");
    if (record.type !== "image") throw corrupt("消息附件类型无效");
    return { type: "image", url: requireString(record.url, "消息附件 URL"), id: optionalString(record.id), name: optionalString(record.name) };
  });
}

function parseFiles(value: unknown): SerializableFileMap {
  const record = requireRecord(value, "文件映射");
  const files: SerializableFileMap = {};
  for (const [path, code] of Object.entries(record)) {
    if (!isFilePath(path) || typeof code !== "string") throw corrupt(`文件映射无效：${path}`);
    files[path] = code;
  }
  return files;
}

function parseChanges(value: unknown): { added: string[]; modified: string[]; deleted: string[] } {
  const record = requireRecord(value, "版本变更");
  return {
    added: parseStringArray(record.added, "新增文件列表"),
    modified: parseStringArray(record.modified, "修改文件列表"),
    deleted: parseStringArray(record.deleted, "删除文件列表"),
  };
}

function parseStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw corrupt(`${label}无效`);
  return [...value];
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw corrupt(`${label}格式无效`);
  return value as Record<string, unknown>;
}

function requireSchema(value: unknown, label: string): 1 {
  if (!isSchemaVersion(value)) throw corrupt(`${label} schema 版本不兼容`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") throw corrupt(`${label}必须是文本`);
  return value;
}

function requireId(value: unknown, label: string): string {
  const id = requireString(value, label);
  if (id.trim().length === 0 || id.length > 200 || id.includes("/")) throw corrupt(`${label}无效`);
  return id;
}

function requireTimestamp(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw corrupt(`${label}无效`);
  return value;
}

function optionalTimestamp(value: unknown): number | undefined {
  return value === undefined ? undefined : requireTimestamp(value, "结束时间");
}

function requireInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw corrupt(`${label}无效`);
  return value;
}

function requirePositiveInteger(value: unknown, label: string): number {
  const result = requireInteger(value, label);
  if (result < 1) throw corrupt(`${label}无效`);
  return result;
}

function requireOperation(value: unknown): "create" | "edit" | "restore" {
  if (value !== "create" && value !== "edit" && value !== "restore") throw corrupt("版本操作无效");
  return value;
}

function optionalNullableId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return requireId(value, "关联 ID");
}

function optionalId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return requireId(value, "关联 ID");
}

function optionalString(value: unknown): string | undefined {
  return value === undefined ? undefined : requireString(value, "可选字段");
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw corrupt("布尔字段无效");
  return value;
}

function isFilePath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("\\") || path.includes("//")) return false;
  const parts = path.slice(1).split("/");
  return parts.length > 0 && parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}

function corrupt(message: string): never {
  throw new Error(message);
}
