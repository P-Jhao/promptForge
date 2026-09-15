import { createHash } from "node:crypto";
import { z } from "zod";

export const EDIT_LIMITS = {
  maxFiles: 150,
  maxChanges: 150,
  maxFileBytes: 128 * 1024,
  maxSourceBytes: 512 * 1024,
  maxPathCharacters: 512,
  maxResourceCharacters: 2_048,
} as const;

const AddChangeSchema = z.object({
  operation: z.literal("add"),
  path: z.string(),
  content: z.string().min(1),
});
const ModifyChangeSchema = z.object({
  operation: z.literal("modify"),
  path: z.string(),
  content: z.string().min(1),
});
const DeleteChangeSchema = z.object({
  operation: z.literal("delete"),
  path: z.string(),
});

export const FileChangeSchema = z.discriminatedUnion("operation", [
  AddChangeSchema,
  ModifyChangeSchema,
  DeleteChangeSchema,
]);

export const EditModelResultSchema = z.object({
  summary: z.string().min(1).max(4_000),
  changes: z.array(FileChangeSchema).min(1).max(EDIT_LIMITS.maxChanges),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
export type EditModelResult = z.infer<typeof EditModelResultSchema>;

export interface EditResourceReference {
  id: string;
  kind: string;
  hostPath: string;
  sandpackPath: string;
  exportPath: string;
  contentType: string;
  contentHash: string | null;
  hashStatus: "known" | "unknown";
}

export interface EditBaseSnapshot {
  projectId: string;
  versionId: string | null;
  /** Hash of the files/resources supplied to this edit model run. */
  hash: string;
  files: Record<string, string>;
  resources: EditResourceReference[];
  /** Present only when this edit repairs a staged candidate. Both source fields are required together. */
  sourceCandidateId?: string;
  /** The original accepted-workspace hash used by the eventual apply gate. */
  sourceBaseHash?: string;
}

export interface AppliedEdit {
  files: Record<string, string>;
  changes: FileChange[];
}

export function parseEditBase(
  value: unknown,
  expectedProjectId: string | undefined,
): EditBaseSnapshot {
  const record = requireRecord(value, "edit.base");
  const projectId = readId(record.projectId, "edit.base.projectId");
  if (expectedProjectId !== undefined && projectId !== expectedProjectId) {
    throw new Error("edit.base.projectId must match projectId");
  }
  const versionId = record.versionId === undefined || record.versionId === null
    ? null
    : readId(record.versionId, "edit.base.versionId");
  const hash = readHash(record.hash, "edit.base.hash");
  const files = readFileMap(record.files, "edit.base.files");
  const sourceCandidateId = record.sourceCandidateId === undefined
    ? undefined
    : readId(record.sourceCandidateId, "edit.base.sourceCandidateId");
  const sourceBaseHash = record.sourceBaseHash === undefined
    ? undefined
    : readHash(record.sourceBaseHash, "edit.base.sourceBaseHash");
  if ((sourceCandidateId === undefined) !== (sourceBaseHash === undefined)) {
    throw new Error("edit.base.sourceCandidateId and sourceBaseHash must be provided together");
  }
  return {
    projectId,
    versionId,
    hash,
    files,
    resources: readResources(record.resources, files),
    sourceCandidateId,
    sourceBaseHash,
  };
}

export function applyFileChanges(
  baseFiles: Record<string, string>,
  changes: readonly FileChange[],
): AppliedEdit {
  const files = readFileMap(baseFiles, "base files");
  if (changes.length === 0 || changes.length > EDIT_LIMITS.maxChanges) {
    throw new Error(`changes must contain between 1 and ${EDIT_LIMITS.maxChanges} items`);
  }

  const seen = new Set<string>();
  const applied: FileChange[] = [];
  for (const change of changes) {
    const path = readPath(change.path, "change.path");
    if (seen.has(path)) throw new Error(`重复变更路径：${path}`);
    seen.add(path);

    if (change.operation === "add") {
      if (files[path] !== undefined) throw new Error(`新增文件已存在：${path}`);
      const content = readContent(change.content, path);
      files[path] = content;
      applied.push({ operation: "add", path, content });
      continue;
    }

    if (change.operation === "modify") {
      if (files[path] === undefined) throw new Error(`修改文件不存在：${path}`);
      const content = readContent(change.content, path);
      files[path] = content;
      applied.push({ operation: "modify", path, content });
      continue;
    }

    if (files[path] === undefined) throw new Error(`删除文件不存在：${path}`);
    delete files[path];
    applied.push({ operation: "delete", path });
  }

  if (Object.keys(files).length === 0) throw new Error("candidate files must not be empty");
  assertFileBudget(files, "candidate files");
  return { files, changes: applied };
}

export function hashFileMap(files: Record<string, string>): string {
  const canonical = stableStringify(readFileMap(files, "files"));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function hashEditBase(
  files: Record<string, string>,
  resources: readonly EditResourceReference[],
): string {
  const normalizedFiles = readFileMap(files, "files");
  const normalizedResources = readResources(resources, normalizedFiles);
  const canonical = stableStringify({ files: normalizedFiles, resources: normalizedResources });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

function readFileMap(value: unknown, label: string): Record<string, string> {
  const record = requireRecord(value, label);
  const files: Record<string, string> = {};
  for (const [path, content] of Object.entries(record)) {
    const normalizedPath = readPath(path, `${label} path`);
    files[normalizedPath] = readContent(content, normalizedPath);
  }
  assertFileBudget(files, label);
  return files;
}

function readResources(value: unknown, files: Record<string, string>): EditResourceReference[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("edit.base.resources must be an array");
  const ids = new Set<string>();
  return value.map((item, index): EditResourceReference => {
    const record = requireRecord(item, `edit.base.resources[${index}]`);
    const id = readId(record.id, `resource ${index} id`);
    if (ids.has(id)) throw new Error(`重复资源 ID：${id}`);
    ids.add(id);
    const sandpackPath = readPath(record.sandpackPath, `resource ${id} sandpackPath`);
    const content = files[sandpackPath];
    const contentHash = readNullableHash(record.contentHash, `resource ${id} contentHash`);
    const hashStatus = readHashStatus(record.hashStatus, `resource ${id} hashStatus`);
    if (content === undefined) {
      if (contentHash !== null || hashStatus !== "unknown") {
        throw new Error(`resource ${id} content hash must be unknown when content is unavailable`);
      }
    } else {
      const actualHash = hashText(content);
      if (contentHash !== actualHash || hashStatus !== "known") {
        throw new Error(`resource ${id} content hash does not match base files`);
      }
    }
    return {
      id,
      kind: readBoundedString(record.kind, `resource ${id} kind`),
      hostPath: readBoundedString(record.hostPath, `resource ${id} hostPath`),
      sandpackPath,
      exportPath: readBoundedString(record.exportPath, `resource ${id} exportPath`),
      contentType: readBoundedString(record.contentType, `resource ${id} contentType`),
      contentHash: content === undefined ? null : hashText(content),
      hashStatus,
    };
  }).sort(compareResources);
}

function assertFileBudget(files: Record<string, string>, label: string): void {
  const entries = Object.entries(files);
  if (entries.length > EDIT_LIMITS.maxFiles) throw new Error(`${label} exceeds ${EDIT_LIMITS.maxFiles} files`);
  let totalBytes = 0;
  for (const [path, content] of entries) {
    const bytes = Buffer.byteLength(content, "utf8");
    if (bytes > EDIT_LIMITS.maxFileBytes) throw new Error(`${label} file is too large: ${path}`);
    totalBytes += bytes;
  }
  if (totalBytes > EDIT_LIMITS.maxSourceBytes) throw new Error(`${label} exceeds ${EDIT_LIMITS.maxSourceBytes} bytes`);
}

function readContent(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\u0000")) {
    throw new Error(`文件内容无效：${path}`);
  }
  return value;
}

function readPath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > EDIT_LIMITS.maxPathCharacters) {
    throw new Error(`${label} is invalid`);
  }
  if (!value.startsWith("/") || value.includes("\\") || value.includes("//")) throw new Error(`${label} is invalid`);
  const parts = value.slice(1).split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new Error(`${label} is invalid`);
  return value;
}

function readId(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 200 || value.includes("/")) throw new Error(`${label} is invalid`);
  return value;
}

function readHash(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label} is invalid`);
  return value;
}

function readNullableHash(value: unknown, label: string): string | null {
  if (value === null) return null;
  return readHash(value, label);
}

function readHashStatus(value: unknown, label: string): "known" | "unknown" {
  if (value !== "known" && value !== "unknown") throw new Error(`${label} is invalid`);
  return value;
}

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function compareResources(left: EditResourceReference, right: EditResourceReference): number {
  const leftKey = `${left.id}\u0000${left.sandpackPath}\u0000${left.exportPath}`;
  const rightKey = `${right.id}\u0000${right.sandpackPath}\u0000${right.exportPath}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function readBoundedString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > EDIT_LIMITS.maxResourceCharacters) throw new Error(`${label} is invalid`);
  return value;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
