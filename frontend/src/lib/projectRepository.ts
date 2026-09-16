import {
  hashFiles,
  stableStringify,
} from "./projectSerialization";
import {
  mapStorageError,
  openProjectDatabase,
  PROJECT_STORES,
  ProjectStorageError,
} from "./projectStorage";
import {
  parseProjectRecord,
  parseResourceRecord,
  parseRunRecord,
  parseVersionRecord,
  parseWorkspaceRecord,
  projectSummary,
} from "./projectStorageCodec";
import {
  deleteProjectInDatabase,
  findDeletedProject,
  parseDeletedProjectRecord,
  renameProjectInDatabase,
  updateVersionMetadataInDatabase,
} from "./projectRepositoryMutations";
import { PROJECT_SCHEMA_VERSION, type ProjectDraft, type ProjectRecord, type ProjectResourceDraft, type ProjectSnapshot, type ProjectRepository, type ProjectSummary, type ResourceRecord, type RunRecord, type VersionMetadata, type VersionRecord, type WorkspaceRecord } from "@/types/project";

type RawRecords = Record<(typeof PROJECT_STORES)[keyof typeof PROJECT_STORES], unknown[]>;
type ProjectStoreKey = (typeof PROJECT_STORES)[keyof typeof PROJECT_STORES];

export class IndexedDbProjectRepository implements ProjectRepository {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async listProjects(): Promise<ProjectSummary[]> {
    const records = await this.readAll();
    try {
      const deletedIds = new Set(records.deletedProjects.map(parseDeletedProjectRecord).map((record) => record.projectId));
      return records.projects
        .filter((item) => {
          const id = rawId(item, "projectId");
          return id === null || !deletedIds.has(id);
        })
        .map(parseProjectRecord)
        .map(projectSummary)
        .sort((first, second) => second.updatedAt - first.updatedAt);
    } catch (error: unknown) {
      throw asCorrupt(error, "读取项目列表");
    }
  }

  async loadProject(projectId: string): Promise<ProjectSnapshot | null> {
    const records = await this.readAll();
    try {
      if (findDeletedProject(records.deletedProjects, projectId) !== undefined) {
        throw new ProjectStorageError("conflict", "项目已被删除，读取已拒绝；请刷新项目列表。" );
      }
    } catch (error: unknown) {
      throw asCorrupt(error, "读取项目列表");
    }
    let project: ProjectRecord | null = null;
    try {
      const raw = records.projects.find((item) => rawId(item, "projectId") === projectId);
      if (raw === undefined) return null;
      project = parseProjectRecord(raw);
    } catch (error: unknown) {
      throw asCorrupt(error, "读取项目");
    }
    const warnings: string[] = [];
    const workspace = this.parseWorkspace(records.workspaces, project);
    const versions = this.parseChildren(records.versions, projectId, parseVersionRecord, "版本", warnings);
    const runs = this.parseChildren(records.runs, projectId, parseRunRecord, "运行", warnings);
    const resources = this.parseChildren(records.resources, projectId, parseResourceRecord, "资源", warnings);
    if (workspace.projectId !== projectId || workspace.workspaceId !== project.currentWorkspaceId) {
      throw new ProjectStorageError("corrupt", "项目工作副本指针损坏，未覆盖当前内存内容。");
    }
    if (project.acceptedVersionId !== null && !versions.some((version) => version.versionId === project?.acceptedVersionId)) {
      warnings.push(`已接受版本 ${project.acceptedVersionId} 不可读取，保留其余项目内容。`);
    }
    return { project, workspace, versions, runs, resources, warnings };
  }

  async saveProject(draft: ProjectDraft, expectedRevision: number | null) {
    const prepared = await prepareRecords(draft);
    const database = await this.getDatabase();
    return new Promise<{ snapshot: ProjectSnapshot; revision: number }>((resolve, reject) => {
      const transaction = database.transaction(Object.values(PROJECT_STORES), "readwrite");
      const stores = Object.fromEntries(Object.values(PROJECT_STORES).map((name) => [name, transaction.objectStore(name)])) as Record<ProjectStoreKey, IDBObjectStore>;
      const requests = {
        project: stores.projects.get(draft.projectId),
        deletedProject: stores.deletedProjects.get(draft.projectId),
        workspace: stores.workspaces.getAll(),
        versions: stores.versions.getAll(),
      };
      let settled = false;
      const fail = (error: unknown): void => {
        if (settled) return;
        settled = true;
        try { transaction.abort(); } catch { /* transaction may already be complete */ }
        reject(toStorageError(error, "保存项目"));
      };
      const done: Record<string, unknown> = {};
      let loaded = 0;
      const accept = (key: string, value: unknown): void => {
        done[key] = value;
        loaded += 1;
        if (loaded !== 4 || settled) return;
        try {
          const existing = done.project === undefined ? null : parseProjectRecord(done.project);
          if (done.deletedProject !== undefined) throw new ProjectStorageError("conflict", "项目已被删除，保存已拒绝；请刷新项目列表或另存为。" );
          const workspaceRecords = (done.workspace as unknown[]).filter((item) => rawId(item, "projectId") === draft.projectId);
          const currentWorkspaceRaw = existing === null
            ? undefined
            : workspaceRecords.find((item) => rawId(item, "workspaceId") === existing.currentWorkspaceId);
          if (existing !== null && currentWorkspaceRaw === undefined) {
            throw new ProjectStorageError("corrupt", "当前项目工作副本缺失，保存已阻止以保护内存内容。");
          }
          const currentWorkspace = currentWorkspaceRaw === undefined ? null : parseWorkspaceRecord(currentWorkspaceRaw);
          if (existing === null && expectedRevision !== null) throw new ProjectStorageError("conflict", "项目已被其他标签页创建，保存已阻止。请重新打开或另存为。");
          if (existing !== null && existing.revision !== expectedRevision) throw new ProjectStorageError("conflict", `项目修订号已变化（当前 ${existing.revision}，页面基于 ${String(expectedRevision)}），保存已阻止。`);
          const project = { ...prepared.project, createdAt: existing?.createdAt ?? prepared.project.createdAt, revision: (existing?.revision ?? 0) + 1, updatedAt: Date.now(), latestRunId: prepared.project.latestRunId ?? existing?.latestRunId ?? null };
          const workspace = { ...prepared.workspace, createdAt: currentWorkspace?.createdAt ?? prepared.workspace.createdAt, updatedAt: project.updatedAt, savedAt: project.updatedAt };
          const existingVersions = (done.versions as unknown[]).filter((item) => rawId(item, "projectId") === draft.projectId).map(parseVersionRecord);
          for (const next of prepared.versions) {
            const previous = existingVersions.find((version) => version.versionId === next.versionId);
            if (previous !== undefined && immutableVersionFingerprint(previous) !== immutableVersionFingerprint(next)) throw new ProjectStorageError("conflict", `不可变版本 ${next.versionId} 已被修改，保存已阻止。`);
          }
          stores.projects.put(project);
          stores.workspaces.put(workspace);
          for (const version of prepared.versions) {
            if (!existingVersions.some((previous) => previous.versionId === version.versionId)) stores.versions.put(version);
          }
          if (prepared.run !== null) stores.runs.put(prepared.run);
          for (const resource of prepared.resources) stores.resources.put(resource);
          transaction.oncomplete = () => resolve({ snapshot: { project, workspace, versions: mergeVersions(existingVersions, prepared.versions), runs: prepared.run === null ? [] : [prepared.run], resources: prepared.resources, warnings: [] }, revision: project.revision });
        } catch (error: unknown) {
          fail(error);
        }
      };
      requests.project.onsuccess = () => accept("project", requests.project.result);
      requests.deletedProject.onsuccess = () => accept("deletedProject", requests.deletedProject.result);
      requests.workspace.onsuccess = () => accept("workspace", requests.workspace.result);
      requests.versions.onsuccess = () => accept("versions", requests.versions.result);
      for (const request of Object.values(requests)) request.onerror = () => fail(request.error);
      transaction.onerror = () => fail(transaction.error);
      transaction.onabort = () => { if (!settled) fail(transaction.error); };
    });
  }

  async renameProject(projectId: string, name: string, expectedRevision: number): Promise<ProjectSummary> {
    return renameProjectInDatabase(await this.getDatabase(), projectId, name, expectedRevision);
  }

  async deleteProject(projectId: string, expectedRevision: number): Promise<void> {
    return deleteProjectInDatabase(await this.getDatabase(), projectId, expectedRevision);
  }

  async updateVersionMetadata(projectId: string, versionId: string, metadata: VersionMetadata, expectedRevision: number) {
    return updateVersionMetadataInDatabase(await this.getDatabase(), projectId, versionId, metadata, expectedRevision);
  }

  private async readAll(): Promise<RawRecords> {
    const database = await this.getDatabase();
    const transaction = database.transaction(Object.values(PROJECT_STORES), "readonly");
    const requests = Object.fromEntries(Object.values(PROJECT_STORES).map((name) => [name, transaction.objectStore(name).getAll()])) as Record<ProjectStoreKey, IDBRequest<unknown[]>>;
    try {
      const entries = await Promise.all(Object.entries(requests).map(async ([name, request]) => [name, await new Promise<unknown[]>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); })] as const));
      return Object.fromEntries(entries) as RawRecords;
    } catch (error: unknown) {
      throw toStorageError(error, "读取项目数据");
    }
  }

  private async getDatabase(): Promise<IDBDatabase> {
    this.databasePromise ??= openProjectDatabase();
    return this.databasePromise;
  }

  private parseWorkspace(raw: unknown[], project: ProjectRecord): WorkspaceRecord {
    const item = raw.find((value) => rawId(value, "workspaceId") === project.currentWorkspaceId);
    if (item === undefined) throw new ProjectStorageError("corrupt", "项目缺少当前工作副本，未覆盖当前内存内容。");
    try { return parseWorkspaceRecord(item); } catch (error: unknown) { throw asCorrupt(error, "读取工作副本"); }
  }

  private parseChildren<T>(raw: unknown[], projectId: string, parser: (value: unknown) => T, label: string, warnings: string[]): T[] {
    const result: T[] = [];
    for (const item of raw.filter((value) => rawId(value, "projectId") === projectId)) {
      try { result.push(parser(item)); } catch { warnings.push(`${label}记录损坏，已保留项目工作副本；该记录未载入。`); }
    }
    return result;
  }
  }

async function prepareRecords(draft: ProjectDraft) {
  const now = Date.now();
  const workspace: WorkspaceRecord = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    workspaceId: draft.workspaceId,
    projectId: draft.projectId,
    createdAt: draft.createdAt,
    updatedAt: now,
    savedAt: now,
    filesHash: await hashFiles(draft.files),
    files: draft.files,
  };
  const versions: VersionRecord[] = [];
  for (const version of draft.versions) versions.push({ ...version, schemaVersion: PROJECT_SCHEMA_VERSION, filesHash: version.files === null ? null : await hashFiles(version.files) });
  const run: RunRecord | null = draft.run === null ? null : { ...draft.run, schemaVersion: PROJECT_SCHEMA_VERSION };
  const resources: ResourceRecord[] = draft.resources.map((resource: ProjectResourceDraft) => ({ ...resource, schemaVersion: PROJECT_SCHEMA_VERSION }));
  const project: ProjectRecord = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    projectId: draft.projectId,
    name: draft.name,
    createdAt: draft.createdAt,
    updatedAt: now,
    revision: 0,
    currentWorkspaceId: draft.workspaceId,
    acceptedVersionId: draft.acceptedVersionId,
    currentVersion: draft.currentVersion,
    messages: draft.messages,
    latestRunId: run?.runId ?? null,
  };
  return { project, workspace, versions, run, resources };
}

function mergeVersions(existing: VersionRecord[], next: VersionRecord[]): VersionRecord[] {
  const byId = new Map(existing.map((version) => [version.versionId, version]));
  for (const version of next) byId.set(version.versionId, version);
  return [...byId.values()].sort((first, second) => first.versionNumber - second.versionNumber);
}

function immutableVersionFingerprint(version: VersionRecord): string {
  const snapshot = { ...version };
  delete snapshot.label;
  delete snapshot.notes;
  return stableStringify(snapshot);
}

function rawId(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const id = (value as Record<string, unknown>)[field];
  return typeof id === "string" ? id : null;
}

function asCorrupt(error: unknown, operation: string): ProjectStorageError {
  if (error instanceof ProjectStorageError) return error;
  const detail = error instanceof Error && error.message.length > 0 ? error.message : "本地项目数据损坏";
  return new ProjectStorageError("corrupt", `${operation}失败：${detail}；未覆盖当前内存内容。`);
}

function toStorageError(error: unknown, operation: string): ProjectStorageError {
  if (error instanceof ProjectStorageError) return error;
  return mapStorageError(error, operation);
}
