import type { GenerationState, ProjectVersion, SandpackFiles } from "./store";
import type { ValidationReport } from "./validation";

export const PROJECT_SCHEMA_VERSION = 1 as const;

export type ProjectStorageStatus = "idle" | "loading" | "saving" | "saved" | "error";
export type ProjectRunStatus = GenerationState["status"];
export type ProjectRunMode = "mock" | "real";

export interface SerializableAttachment {
  type: "image";
  url: string;
  id?: string;
  name?: string;
}

export interface SerializableMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: SerializableAttachment[];
}

export type SerializableFileMap = Record<string, string>;

export interface ProjectDraft {
  projectId: string;
  name: string;
  createdAt: number;
  workspaceId: string;
  currentVersion: number;
  acceptedVersionId: string | null;
  messages: SerializableMessage[];
  files: SerializableFileMap;
  versions: ProjectVersionDraft[];
  run: ProjectRunDraft | null;
  resources: ProjectResourceDraft[];
}

export interface ProjectVersionDraft {
  versionId: string;
  projectId: string;
  versionNumber: number;
  threadId: string;
  assistantMessageId: string;
  operation: "create" | "edit" | "restore";
  prompt: string;
  timestamp: number;
  files: SerializableFileMap | null;
  fileCount: number;
  changes?: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
  label?: string;
  notes?: string;
  parentVersionId?: string;
  restoredFromVersionId?: string;
}

export interface VersionMetadata {
  label?: string;
  notes?: string;
}

export type VersionMetadataSaveMode = "saved" | "memory";

export interface ProjectRunDraft {
  runId: string;
  projectId: string;
  kind: "generation";
  validationReport?: ValidationReport;
  status: ProjectRunStatus;
  mode?: ProjectRunMode;
  modeForced?: boolean;
  startedAt: number;
  endedAt?: number;
  currentPhase?: string;
  currentStep?: string;
  failedNode?: string;
  error?: string;
}

export interface ProjectResourceDraft {
  resourceKey: string;
  projectId: string;
  id: string;
  kind: string;
  hostPath: string;
  sandpackPath: string;
  exportPath: string;
  contentType: string;
  source: string;
  status: "available" | "missing" | "unknown";
}

export interface ProjectRecord {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  projectId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  currentWorkspaceId: string;
  acceptedVersionId: string | null;
  currentVersion: number;
  messages: SerializableMessage[];
  latestRunId: string | null;
}

export interface WorkspaceRecord {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  workspaceId: string;
  projectId: string;
  createdAt: number;
  updatedAt: number;
  savedAt: number;
  filesHash: string;
  files: SerializableFileMap;
}

export interface VersionRecord extends ProjectVersionDraft {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  filesHash: string | null;
}

export interface RunRecord extends ProjectRunDraft {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
}

export interface ResourceRecord extends ProjectResourceDraft {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
}

/** A tombstone prevents a stale tab from recreating a deleted project. */
export interface DeletedProjectRecord {
  projectId: string;
  deletedAt: number;
  deletedRevision: number;
}

export interface ProjectSnapshot {
  project: ProjectRecord;
  workspace: WorkspaceRecord;
  versions: VersionRecord[];
  runs: RunRecord[];
  resources: ResourceRecord[];
  warnings: string[];
}

export interface ProjectSummary {
  projectId: string;
  name: string;
  updatedAt: number;
  revision: number;
  currentVersion: number;
  dirtyAtSave: boolean;
}

export interface SaveProjectResult {
  snapshot: ProjectSnapshot;
  revision: number;
}

export interface UpdateVersionMetadataResult {
  version: VersionRecord;
  revision: number;
}

export interface ProjectRepository {
  listProjects(): Promise<ProjectSummary[]>;
  loadProject(projectId: string): Promise<ProjectSnapshot | null>;
  saveProject(draft: ProjectDraft, expectedRevision: number | null): Promise<SaveProjectResult>;
  renameProject(projectId: string, name: string, expectedRevision: number): Promise<ProjectSummary>;
  deleteProject(projectId: string, expectedRevision: number): Promise<void>;
  updateVersionMetadata(projectId: string, versionId: string, metadata: VersionMetadata, expectedRevision: number): Promise<UpdateVersionMetadataResult>;
}

export interface ProjectHydration {
  projectId: string;
  projectName: string;
  currentVersion: number;
  versions: ProjectVersion[];
  messages: SerializableMessage[];
}

export function isSandpackFiles(value: unknown): value is SandpackFiles {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([path, file]) => (
    isPath(path) && isRecord(file) && typeof file.code === "string"
  ));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("\\") || path.includes("//")) return false;
  const parts = path.slice(1).split("/");
  return parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}
