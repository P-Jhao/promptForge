import {
  mapStorageError,
  PROJECT_STORES,
  ProjectStorageError,
} from "./projectStorage";
import { parseProjectRecord, parseVersionRecord, projectSummary } from "./projectStorageCodec";
import type {
  DeletedProjectRecord,
  ProjectRecord,
  ProjectSummary,
  UpdateVersionMetadataResult,
  VersionMetadata,
  VersionRecord,
} from "@/types/project";

type ProjectStoreKey = (typeof PROJECT_STORES)[keyof typeof PROJECT_STORES];

export function parseDeletedProjectRecord(value: unknown): DeletedProjectRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("删除标记格式无效");
  const record = value as Record<string, unknown>;
  const projectId = rawId(value, "projectId");
  if (projectId === null) throw new Error("删除标记缺少项目 ID");
  if (projectId.trim().length === 0 || projectId.length > 200 || projectId.includes("/")) throw new Error("删除标记项目 ID 无效");
  if (typeof record.deletedAt !== "number" || !Number.isSafeInteger(record.deletedAt) || record.deletedAt <= 0) throw new Error("删除标记时间无效");
  if (typeof record.deletedRevision !== "number" || !Number.isSafeInteger(record.deletedRevision) || record.deletedRevision < 0) throw new Error("删除标记修订号无效");
  return { projectId, deletedAt: record.deletedAt, deletedRevision: record.deletedRevision };
}

export function findDeletedProject(records: unknown[], projectId: string): DeletedProjectRecord | undefined {
  const raw = records.find((item) => rawId(item, "projectId") === projectId);
  return raw === undefined ? undefined : parseDeletedProjectRecord(raw);
}

export async function renameProjectInDatabase(database: IDBDatabase, projectId: string, name: string, expectedRevision: number): Promise<ProjectSummary> {
  const nextName = requireProjectName(name);
  validateExpectedRevision(expectedRevision);
  return new Promise<ProjectSummary>((resolve, reject) => {
    let settled = false;
    let next: ProjectRecord | null = null;
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction([PROJECT_STORES.projects, PROJECT_STORES.deletedProjects], "readwrite");
      const projects = transaction.objectStore(PROJECT_STORES.projects);
      const deletedProjects = transaction.objectStore(PROJECT_STORES.deletedProjects);
      transaction.oncomplete = () => {
        if (settled) return;
        if (next === null) { settled = true; reject(new ProjectStorageError("write", "重命名项目未完成，项目内容未改变。")); return; }
        settled = true;
        resolve(projectSummary(next));
      };
      transaction.onerror = () => failMutation(transaction.error, "重命名项目", transaction, settled, reject, () => { settled = true; });
      transaction.onabort = () => failMutation(transaction.error, "重命名项目", transaction, settled, reject, () => { settled = true; });
      const projectRequest = projects.get(projectId);
      const deletedRequest = deletedProjects.get(projectId);
      let loaded = 0;
      const inspect = (): void => {
        loaded += 1;
        if (loaded !== 2 || settled) return;
        try {
          if (deletedRequest.result !== undefined) throw new ProjectStorageError("conflict", "项目已被删除，重命名已拒绝。" );
          if (projectRequest.result === undefined) throw new ProjectStorageError("conflict", "项目不存在或已被删除，重命名已拒绝。" );
          const existing = parseProjectRecord(projectRequest.result);
          if (existing.revision !== expectedRevision) throw new ProjectStorageError("conflict", `项目修订号已变化（当前 ${existing.revision}，页面基于 ${String(expectedRevision)}），重命名已阻止。`);
          next = { ...existing, name: nextName, updatedAt: Date.now(), revision: existing.revision + 1 };
          projects.put(next);
        } catch (error: unknown) {
          failMutation(error, "重命名项目", transaction, settled, reject, () => { settled = true; });
        }
      };
      projectRequest.onsuccess = inspect;
      deletedRequest.onsuccess = inspect;
      projectRequest.onerror = () => failMutation(projectRequest.error, "重命名项目", transaction, settled, reject, () => { settled = true; });
      deletedRequest.onerror = () => failMutation(deletedRequest.error, "重命名项目", transaction, settled, reject, () => { settled = true; });
    } catch (error: unknown) {
      reject(toStorageError(error, "重命名项目"));
    }
  });
}

export async function deleteProjectInDatabase(database: IDBDatabase, projectId: string, expectedRevision: number): Promise<void> {
  validateExpectedRevision(expectedRevision);
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(Object.values(PROJECT_STORES), "readwrite");
      const stores = getStores(transaction);
      transaction.oncomplete = () => { if (!settled) { settled = true; resolve(); } };
      transaction.onerror = () => failMutation(transaction.error, "删除项目", transaction, settled, reject, () => { settled = true; });
      transaction.onabort = () => failMutation(transaction.error, "删除项目", transaction, settled, reject, () => { settled = true; });
      const requests = {
        project: stores.projects.get(projectId),
        deletedProject: stores.deletedProjects.get(projectId),
        workspaces: stores.workspaces.getAll(),
        versions: stores.versions.getAll(),
        runs: stores.runs.getAll(),
        resources: stores.resources.getAll(),
      };
      let loaded = 0;
      const inspect = (): void => {
        loaded += 1;
        if (loaded !== Object.keys(requests).length || settled) return;
        try {
          if (requests.deletedProject.result !== undefined) throw new ProjectStorageError("conflict", "项目已被删除，删除请求已拒绝。" );
          if (requests.project.result === undefined) throw new ProjectStorageError("conflict", "项目不存在或已被删除，删除已拒绝。" );
          const project = parseProjectRecord(requests.project.result);
          if (project.revision !== expectedRevision) throw new ProjectStorageError("conflict", `项目修订号已变化（当前 ${project.revision}，页面基于 ${String(expectedRevision)}），删除已阻止。`);
          stores.projects.delete(projectId);
          deleteChildren(stores.workspaces, requests.workspaces.result, projectId, "workspaceId");
          deleteChildren(stores.versions, requests.versions.result, projectId, "versionId");
          deleteChildren(stores.runs, requests.runs.result, projectId, "runId");
          deleteChildren(stores.resources, requests.resources.result, projectId, "resourceKey");
          stores.deletedProjects.put({ projectId, deletedAt: Date.now(), deletedRevision: project.revision });
        } catch (error: unknown) {
          failMutation(error, "删除项目", transaction, settled, reject, () => { settled = true; });
        }
      };
      for (const request of Object.values(requests)) {
        request.onsuccess = inspect;
        request.onerror = () => failMutation(request.error, "删除项目", transaction, settled, reject, () => { settled = true; });
      }
    } catch (error: unknown) {
      reject(toStorageError(error, "删除项目"));
    }
  });
}

export async function updateVersionMetadataInDatabase(
  database: IDBDatabase,
  projectId: string,
  versionId: string,
  metadata: VersionMetadata,
  expectedRevision: number,
): Promise<UpdateVersionMetadataResult> {
  requireMutationId(projectId, "项目 ID");
  requireMutationId(versionId, "版本 ID");
  validateExpectedRevision(expectedRevision);
  const normalized = normalizeVersionMetadata(metadata);
  return new Promise<UpdateVersionMetadataResult>((resolve, reject) => {
    let settled = false;
    let result: UpdateVersionMetadataResult | null = null;
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(
        [PROJECT_STORES.projects, PROJECT_STORES.versions, PROJECT_STORES.deletedProjects],
        "readwrite",
      );
      const projects = transaction.objectStore(PROJECT_STORES.projects);
      const versions = transaction.objectStore(PROJECT_STORES.versions);
      const deletedProjects = transaction.objectStore(PROJECT_STORES.deletedProjects);
      const requests = {
        project: projects.get(projectId),
        version: versions.get(versionId),
        deletedProject: deletedProjects.get(projectId),
      };
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        if (result === null) reject(new ProjectStorageError("write", "版本元数据更新未完成，版本内容未改变。"));
        else resolve(result);
      };
      transaction.onerror = () => failMutation(transaction.error, "更新版本元数据", transaction, settled, reject, () => { settled = true; });
      transaction.onabort = () => failMutation(transaction.error, "更新版本元数据", transaction, settled, reject, () => { settled = true; });
      let loaded = 0;
      const inspect = (): void => {
        loaded += 1;
        if (loaded !== Object.keys(requests).length || settled) return;
        try {
          if (requests.deletedProject.result !== undefined) throw new ProjectStorageError("conflict", "项目已被删除，版本元数据更新已拒绝。" );
          if (requests.project.result === undefined) throw new ProjectStorageError("conflict", "项目不存在或已被删除，版本元数据更新已拒绝。" );
          if (requests.version.result === undefined) throw new ProjectStorageError("conflict", `版本 ${versionId} 不存在，元数据更新已拒绝。`);
          const project = parseProjectRecord(requests.project.result);
          const version = parseVersionRecordForMutation(requests.version.result);
          if (project.revision !== expectedRevision) throw new ProjectStorageError("conflict", `项目修订号已变化（当前 ${project.revision}，页面基于 ${String(expectedRevision)}），版本元数据更新已阻止。`);
          if (version.projectId !== projectId) throw new ProjectStorageError("conflict", `版本 ${versionId} 不属于当前项目，元数据更新已拒绝。`);
          const nextVersion = withVersionMetadata(version, normalized);
          const nextRevision = project.revision + 1;
          versions.put(nextVersion);
          projects.put({ ...project, updatedAt: Date.now(), revision: nextRevision });
          result = { version: nextVersion, revision: nextRevision };
        } catch (error: unknown) {
          failMutation(error, "更新版本元数据", transaction, settled, reject, () => { settled = true; });
        }
      };
      for (const request of Object.values(requests)) {
        request.onsuccess = inspect;
        request.onerror = () => failMutation(request.error, "更新版本元数据", transaction, settled, reject, () => { settled = true; });
      }
    } catch (error: unknown) {
      reject(toStorageError(error, "更新版本元数据"));
    }
  });
}

function getStores(transaction: IDBTransaction): Record<ProjectStoreKey, IDBObjectStore> {
  return Object.fromEntries(Object.values(PROJECT_STORES).map((name) => [name, transaction.objectStore(name)])) as Record<ProjectStoreKey, IDBObjectStore>;
}

function deleteChildren(store: IDBObjectStore, records: unknown[], projectId: string, keyField: string): void {
  for (const record of records) {
    if (rawId(record, "projectId") !== projectId) continue;
    const key = rawId(record, keyField);
    if (key === null) throw new ProjectStorageError("corrupt", `项目关联记录缺少 ${keyField}，删除已回滚。`);
    store.delete(key);
  }
}

function requireProjectName(value: string): string {
  if (typeof value !== "string") throw new ProjectStorageError("write", "项目名称必须是文本。" );
  const name = value.trim();
  if (name.length === 0 || name.length > 200) throw new ProjectStorageError("write", "项目名称必须为 1 到 200 个字符。" );
  return name;
}

function requireMutationId(value: string, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 200 || value.includes("/")) {
    throw new ProjectStorageError("conflict", `${label}无效，操作已拒绝。`);
  }
}

function normalizeVersionMetadata(metadata: VersionMetadata): VersionMetadata {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    throw new ProjectStorageError("write", "版本元数据格式无效。" );
  }
  return {
    label: normalizeMetadataText(metadata.label, "版本标签", 200),
    notes: normalizeMetadataText(metadata.notes, "版本备注", 4000),
  };
}

function normalizeMetadataText(value: string | undefined, label: string, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ProjectStorageError("write", `${label}必须是文本。`);
  const text = value.trim();
  if (text.length > maxLength) throw new ProjectStorageError("write", `${label}不能超过 ${String(maxLength)} 个字符。`);
  return text.length === 0 ? undefined : text;
}

function parseVersionRecordForMutation(value: unknown): VersionRecord {
  return parseVersionRecord(value);
}

function withVersionMetadata(version: VersionRecord, metadata: VersionMetadata): VersionRecord {
  const next: VersionRecord = { ...version };
  if (metadata.label === undefined) delete next.label;
  else next.label = metadata.label;
  if (metadata.notes === undefined) delete next.notes;
  else next.notes = metadata.notes;
  return next;
}

function validateExpectedRevision(revision: number): void {
  if (!Number.isSafeInteger(revision) || revision < 0) throw new ProjectStorageError("conflict", "项目修订号无效，操作已拒绝。" );
}

function failMutation(
  error: unknown,
  operation: string,
  transaction: IDBTransaction,
  settled: boolean,
  reject: (reason?: unknown) => void,
  markSettled: () => void,
): void {
  if (settled) return;
  markSettled();
  try { transaction.abort(); } catch { /* transaction may already be complete */ }
  reject(toStorageError(error, operation));
}

function rawId(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const id = (value as Record<string, unknown>)[field];
  return typeof id === "string" ? id : null;
}

function toStorageError(error: unknown, operation: string): ProjectStorageError {
  if (error instanceof ProjectStorageError) return error;
  return mapStorageError(error, operation);
}
