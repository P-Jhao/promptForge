import type { CaseResourceManifest } from "@/cases/resourceManifest";
import type { SandpackFiles } from "@/types/store";
import type { CandidateChange, CandidateResourceReference, CandidateState } from "@/types/candidate";
import { hashFiles, serializeFiles, stableStringify } from "./projectSerialization";
import { createCandidateValidation, type RepairContext } from "./validationReport";

const MAX_FILES = 150;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_SOURCE_BYTES = 512 * 1024;

export type EditResourceReference = CandidateResourceReference;

export interface EditBaseSnapshot {
  projectId: string;
  versionId: string | null;
  hash: string;
  files: Record<string, string>;
  resources: EditResourceReference[];
  /** Present together only when this snapshot repairs a staged candidate. */
  sourceCandidateId?: string;
  /** Original workspace hash used by the eventual apply gate. */
  sourceBaseHash?: string;
}

export interface CandidateEventPayload {
  candidateId: string;
  runId: string;
  operation: "edit";
  projectId: string;
  baseVersionId: string | null;
  /** Hash of the files/resources supplied to this model run. */
  baseHash: string;
  /** Hash of the workspace that may be accepted by the apply gate. */
  acceptanceBaseHash: string;
  sourceCandidateId?: string;
  sourceBaseHash?: string;
  files: Record<string, string>;
  resources: EditResourceReference[];
  changes: CandidateChange[];
  summary: string;
}

export function toPlainFiles(files: SandpackFiles | null): Record<string, string> {
  if (files === null) return {};
  return Object.fromEntries(Object.entries(files).map(([path, file]) => [path, file.code]));
}

export async function hashPlainFiles(files: Record<string, string>): Promise<string> {
  return hashFiles(files);
}

export async function hashEditBase(
  files: Record<string, string>,
  resources: EditResourceReference[],
): Promise<string> {
  if (typeof crypto === "undefined" || crypto.subtle === undefined) {
    throw new Error("当前环境不支持项目基线完整性校验");
  }
  const normalizedResources = await hashResourceReferences(files, resources);
  const canonical = stableStringify({
    files: serializeFiles(files),
    resources: normalizedResources,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashResourceReferences(
  files: Record<string, string>,
  resources: EditResourceReference[],
): Promise<EditResourceReference[]> {
  const ordered = [...resources].sort(compareResources);
  return Promise.all(ordered.map(async (resource) => {
    const content = files[resource.sandpackPath];
    if (content === undefined) {
      return { ...resource, contentHash: null, hashStatus: "unknown" as const };
    }
    return {
      ...resource,
      contentHash: await hashText(content),
      hashStatus: "known" as const,
    };
  }));
}

export async function validateCandidateEventAgainstBase(
  payload: CandidateEventPayload,
  base: EditBaseSnapshot,
): Promise<void> {
  if (payload.operation !== "edit" || payload.projectId !== base.projectId || payload.baseHash !== base.hash || payload.baseVersionId !== base.versionId) {
    throw new Error("候选事件与请求冻结基线不一致");
  }
  const expectedAcceptanceBaseHash = base.sourceBaseHash ?? base.hash;
  if (payload.acceptanceBaseHash !== expectedAcceptanceBaseHash) {
    throw new Error("候选外部接受基线与请求不一致");
  }
  const payloadHasCandidate = payload.sourceCandidateId !== undefined;
  const payloadHasHash = payload.sourceBaseHash !== undefined;
  const baseHasCandidate = base.sourceCandidateId !== undefined;
  const baseHasHash = base.sourceBaseHash !== undefined;
  if (payloadHasCandidate !== payloadHasHash || baseHasCandidate !== baseHasHash) {
    throw new Error("候选修复来源元数据不完整");
  }
  const payloadHasSource = payloadHasCandidate || payloadHasHash;
  const baseHasSource = baseHasCandidate || baseHasHash;
  if (payloadHasSource !== baseHasSource ||
      (baseHasSource && (payload.sourceCandidateId !== base.sourceCandidateId || payload.sourceBaseHash !== base.sourceBaseHash))) {
    throw new Error("候选修复来源元数据与请求不一致");
  }
  validatePlainFiles(payload.files);
  if (await hashEditBase(base.files, base.resources) !== base.hash) {
    throw new Error("请求冻结基线的资源或文件 hash 无效");
  }
  const normalizedBaseResources = await hashResourceReferences(base.files, base.resources);
  assertResourceList(base.resources, normalizedBaseResources, "冻结资源");
  const normalizedPayloadResources = await hashResourceReferences(base.files, payload.resources);
  assertResourceList(payload.resources, normalizedPayloadResources, "候选资源");
  assertResourceList(payload.resources, normalizedBaseResources, "候选资源与冻结资源");
  const expectedChanges = summarizeFileChanges(base.files, payload.files);
  assertChangeList(payload.changes, expectedChanges);
}

export function validatePlainFiles(files: Record<string, string>): void {
  const entries = Object.entries(files);
  if (entries.length === 0 || entries.length > MAX_FILES) throw new Error("候选文件数量无效");
  let totalBytes = 0;
  for (const [path, code] of entries) {
    if (!isSafePath(path) || typeof code !== "string" || code.length === 0 || code.includes("\u0000")) {
      throw new Error(`候选文件无效：${path}`);
    }
    const bytes = new TextEncoder().encode(code).byteLength;
    if (bytes > MAX_FILE_BYTES) throw new Error(`候选文件过大：${path}`);
    totalBytes += bytes;
  }
  if (totalBytes > MAX_SOURCE_BYTES) throw new Error("候选源码总量超限");
}

export async function createBaseSnapshot(
  projectId: string,
  versionId: string | null,
  files: SandpackFiles | null,
  manifest: CaseResourceManifest | undefined,
): Promise<EditBaseSnapshot> {
  const plainFiles = toPlainFiles(files);
  const manifestResources = manifest?.resources.map((resource) => ({
    id: resource.id,
    kind: resource.kind,
    hostPath: resource.hostPath,
    sandpackPath: resource.sandpackPath,
    exportPath: resource.exportPath,
    contentType: resource.contentType,
    contentHash: null,
    hashStatus: "unknown" as const,
  })) ?? [];
  const resources = await hashResourceReferences(plainFiles, manifestResources);
  return {
    projectId,
    versionId,
    hash: await hashEditBase(plainFiles, resources),
    files: { ...plainFiles },
    resources,
  };
}

export function summarizeFileChanges(
  before: Record<string, string>,
  after: Record<string, string>,
): CandidateChange[] {
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return paths.flatMap((path): CandidateChange[] => {
    if (before[path] === undefined && after[path] !== undefined) {
      return [{ operation: "add", path, content: after[path] }];
    }
    if (before[path] !== undefined && after[path] === undefined) {
      return [{ operation: "delete", path }];
    }
    if (before[path] !== after[path]) {
      return [{ operation: "modify", path, content: after[path] }];
    }
    return [];
  });
}

export async function candidateEventToState(
  payload: CandidateEventPayload,
  prompt: string,
  assistantMessageId: string,
  base: EditBaseSnapshot,
  repair?: RepairContext,
): Promise<CandidateState> {
  await validateCandidateEventAgainstBase(payload, base);
  return {
    candidateId: payload.candidateId,
    runId: payload.runId,
    projectId: payload.projectId,
    baseVersionId: payload.baseVersionId,
    baseHash: payload.acceptanceBaseHash,
    modelBaseHash: payload.baseHash,
    sourceCandidateId: payload.sourceCandidateId,
    sourceBaseHash: payload.sourceBaseHash,
    operation: "edit",
    prompt,
    assistantMessageId,
    files: { ...payload.files },
    resources: payload.resources.map((resource) => ({ ...resource })),
    changes: payload.changes.map((change) => ({ ...change })),
    summary: payload.summary,
    validation: createCandidateValidation(payload.candidateId, payload.runId, "pass", "pass", "not-verified", repair),
    status: "staged",
    createdAt: Date.now(),
  };
}

export function shortHash(hash: string): string {
  return hash.length <= 16 ? hash : `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export function canonicalFiles(files: Record<string, string>): string {
  return stableStringify(files);
}

function isSafePath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("\\") || path.includes("//")) return false;
  return path.slice(1).split("/").every((part) => part.length > 0 && part !== "." && part !== "..");
}

function assertResourceList(
  actual: EditResourceReference[],
  expected: EditResourceReference[],
  label: string,
): void {
  if (!isSortedResources(actual) || actual.length !== expected.length) {
    throw new Error(`${label}排序或数量无效`);
  }
  for (let index = 0; index < expected.length; index += 1) {
    const resource = actual[index];
    const expectedResource = expected[index];
    if (resource === undefined || !sameResource(resource, expectedResource)) {
      throw new Error(`${label}内容与冻结快照不一致`);
    }
  }
}

function assertChangeList(actual: CandidateChange[], expected: CandidateChange[]): void {
  if (!actual.every(isCandidateChange)) throw new Error("候选变更列表格式无效");
  const seenPaths = new Set<string>();
  for (const change of actual) {
    if (seenPaths.has(change.path)) throw new Error(`候选变更路径重复：${change.path}`);
    seenPaths.add(change.path);
  }
  const actualSorted = [...actual].sort(compareChanges);
  const expectedSorted = [...expected].sort(compareChanges);
  if (actualSorted.length !== expectedSorted.length) throw new Error("候选变更列表与文件差异不一致");
  for (let index = 0; index < expectedSorted.length; index += 1) {
    const change = actualSorted[index];
    const expectedChange = expectedSorted[index];
    if (change === undefined || expectedChange === undefined || change.operation !== expectedChange.operation || change.path !== expectedChange.path || change.content !== expectedChange.content) {
      throw new Error("候选变更列表与文件差异不一致");
    }
  }
}

function isCandidateChange(value: unknown): value is CandidateChange {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.path !== "string") return false;
  if (record.operation === "delete") return record.content === undefined;
  return (record.operation === "add" || record.operation === "modify") && typeof record.content === "string";
}

function compareChanges(left: CandidateChange, right: CandidateChange): number {
  const leftKey = `${left.path}\u0000${left.operation}`;
  const rightKey = `${right.path}\u0000${right.operation}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function isSortedResources(resources: EditResourceReference[]): boolean {
  return resources.every((resource, index) => index === 0 || compareResources(resources[index - 1] as EditResourceReference, resource) <= 0);
}

function sameResource(left: EditResourceReference, right: EditResourceReference): boolean {
  return left.id === right.id && left.kind === right.kind && left.hostPath === right.hostPath &&
    left.sandpackPath === right.sandpackPath && left.exportPath === right.exportPath &&
    left.contentType === right.contentType && left.contentHash === right.contentHash &&
    left.hashStatus === right.hashStatus;
}

async function hashText(value: string): Promise<string> {
  if (typeof crypto === "undefined" || crypto.subtle === undefined) {
    throw new Error("当前环境不支持资源完整性校验");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function compareResources(left: EditResourceReference, right: EditResourceReference): number {
  const leftKey = `${left.id}\u0000${left.sandpackPath}\u0000${left.exportPath}`;
  const rightKey = `${right.id}\u0000${right.sandpackPath}\u0000${right.exportPath}`;
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}
