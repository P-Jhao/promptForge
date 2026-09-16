import { PROJECT_SCHEMA_VERSION, type ProjectStorageStatus } from "@/types/project";

export const PROJECT_DB_NAME = "promptforge-projects";
export const PROJECT_DB_VERSION = 2;

export const PROJECT_STORES = {
  projects: "projects",
  workspaces: "workspaces",
  versions: "versions",
  runs: "runs",
  resources: "resources",
  deletedProjects: "deletedProjects",
} as const;

export type ProjectStoreName = (typeof PROJECT_STORES)[keyof typeof PROJECT_STORES];

export type ProjectStorageErrorKind =
  | "unsupported"
  | "schema"
  | "corrupt"
  | "quota"
  | "conflict"
  | "read"
  | "write";

export class ProjectStorageError extends Error {
  readonly kind: ProjectStorageErrorKind;

  constructor(kind: ProjectStorageErrorKind, message: string) {
    super(message);
    this.name = "ProjectStorageError";
    this.kind = kind;
  }
}

export function openProjectDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new ProjectStorageError("unsupported", "当前浏览器不支持 IndexedDB，项目无法保存。"));
  }
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);
    } catch (error: unknown) {
      reject(mapStorageError(error, "打开项目数据库"));
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      createStore(database, PROJECT_STORES.projects, "projectId");
      createStore(database, PROJECT_STORES.workspaces, "workspaceId", "projectId");
      createStore(database, PROJECT_STORES.versions, "versionId", "projectId");
      createStore(database, PROJECT_STORES.runs, "runId", "projectId");
      createStore(database, PROJECT_STORES.resources, "resourceKey", "projectId");
      createStore(database, PROJECT_STORES.deletedProjects, "projectId");
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(mapStorageError(request.error, "打开项目数据库"));
    request.onblocked = () => reject(new ProjectStorageError("schema", "项目数据库正在被旧页面占用，请关闭其他标签页后重试。"));
  });
}

export function requestResult<T>(request: IDBRequest<T>, operation: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(mapStorageError(request.error, operation));
  });
}

export function transactionResult(transaction: IDBTransaction, operation: string): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(mapStorageError(transaction.error, operation));
    transaction.onabort = () => reject(mapStorageError(transaction.error, operation));
  });
}

export function mapStorageError(error: unknown, operation: string): ProjectStorageError {
  if (error instanceof ProjectStorageError) return error;
  const name = isRecord(error) && typeof error.name === "string" ? error.name : "";
  const message = isRecord(error) && typeof error.message === "string" ? error.message : "未知存储错误";
  if (name === "QuotaExceededError") return new ProjectStorageError("quota", `${operation}失败：本地存储空间不足，请先导出或清理旧项目。`);
  if (name === "VersionError" || name === "InvalidStateError") return new ProjectStorageError("schema", `${operation}失败：本地项目数据版本不兼容。`);
  if (name === "NotFoundError" || name === "DataError") return new ProjectStorageError("corrupt", `${operation}失败：本地项目数据损坏（${message}）。`);
  return new ProjectStorageError("write", `${operation}失败：${message}`);
}

function createStore(
  database: IDBDatabase,
  name: ProjectStoreName,
  keyPath: string,
  projectIndex?: string,
): void {
  const store = database.objectStoreNames.contains(name)
    ? undefined
    : database.createObjectStore(name, { keyPath });
  if (projectIndex !== undefined && store !== undefined && !store.indexNames.contains(projectIndex)) {
    store.createIndex(projectIndex, projectIndex, { unique: false });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSchemaVersion(value: unknown): value is typeof PROJECT_SCHEMA_VERSION {
  return value === PROJECT_SCHEMA_VERSION;
}

export function storageStatusLabel(status: ProjectStorageStatus): string {
  return status === "saving" ? "保存中…" : status === "saved" ? "已保存" : status === "loading" ? "读取中…" : status === "error" ? "保存失败" : "未保存";
}
