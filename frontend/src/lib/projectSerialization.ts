import type { CaseResourceManifest } from "@/cases/resourceManifest";
import type { ChatMessage } from "@/types/message";
import type { GenerationState, ProjectVersion, SandpackFiles } from "@/types/store";
import type {
  ProjectDraft,
  ProjectResourceDraft,
  ProjectRunDraft,
  ProjectSnapshot,
  ProjectVersionDraft,
  SerializableAttachment,
  SerializableFileMap,
  SerializableMessage,
} from "@/types/project";
import type { ValidationReport } from "@/types/validation";

export interface ProjectDraftInput {
  projectId: string;
  projectName: string;
  createdAt: number;
  workspaceId: string;
  currentVersion: number;
  versions: ProjectVersion[];
  messages: ChatMessage[];
  files: SandpackFiles | null;
  generation: GenerationState;
  resourceManifest?: CaseResourceManifest;
}

export function createProjectId(): string {
  return `project-${createUuid()}`;
}

export function createWorkspaceId(projectId: string): string {
  if (projectId.trim().length === 0) throw new Error("创建工作副本需要项目 ID");
  return `workspace-${projectId}-${createUuid()}`;
}

export function createProjectDraft(input: ProjectDraftInput): ProjectDraft {
  const projectName = input.projectName.trim();
  if (projectName.length === 0) throw new Error("项目名称不能为空");
  if (!Number.isSafeInteger(input.currentVersion) || input.currentVersion < 0) {
    throw new Error("项目版本号无效");
  }
  const files = serializeFiles(input.files ?? {});
  const versions = input.versions.map((version) => serializeVersion(version, input.projectId));
  const acceptedVersionId = versions.length === 0 ? null : versions[versions.length - 1].versionId;
  return {
    projectId: requireId(input.projectId, "项目 ID"),
    name: projectName,
    createdAt: requireTimestamp(input.createdAt, "项目创建时间"),
    workspaceId: requireId(input.workspaceId, "工作副本 ID"),
    currentVersion: input.currentVersion,
    acceptedVersionId,
    messages: input.messages.map(serializeMessage),
    files,
    versions,
    run: serializeRun(input.generation, input.projectId),
    resources: serializeResources(input.resourceManifest, input.projectId, files),
  };
}

export function serializeFiles(files: SandpackFiles | SerializableFileMap): SerializableFileMap {
  const result: SerializableFileMap = {};
  for (const [path, value] of Object.entries(files)) {
    const code = typeof value === "string" ? value : value.code;
    result[normalizePath(path)] = requireString(code, `文件内容：${path}`);
  }
  return result;
}

export function deserializeFiles(files: SerializableFileMap): SandpackFiles {
  return Object.fromEntries(Object.entries(serializeFiles(files)).map(([path, code]) => [path, { code }]));
}

export function projectDraftFingerprint(draft: ProjectDraft): string {
  return stableStringify({
    projectId: draft.projectId,
    name: draft.name,
    workspaceId: draft.workspaceId,
    currentVersion: draft.currentVersion,
    acceptedVersionId: draft.acceptedVersionId,
    messages: draft.messages,
    files: draft.files,
    versions: draft.versions,
    resources: draft.resources,
  });
}

/** Rebuild the same durable fields used for dirty comparison after a load. */
export function snapshotToDraft(snapshot: ProjectSnapshot): ProjectDraft {
  return {
    projectId: snapshot.project.projectId,
    name: snapshot.project.name,
    createdAt: snapshot.workspace.createdAt,
    workspaceId: snapshot.workspace.workspaceId,
    currentVersion: snapshot.project.currentVersion,
    acceptedVersionId: snapshot.project.acceptedVersionId,
    messages: snapshot.project.messages.map((message) => ({
      ...message,
      attachments: message.attachments?.map((attachment) => ({ ...attachment })),
    })),
    files: { ...snapshot.workspace.files },
    versions: snapshot.versions.map((storedVersion) => {
      const version = Object.fromEntries(Object.entries(storedVersion).filter(([key]) => key !== "schemaVersion" && key !== "filesHash")) as ProjectVersionDraft;
      return {
      ...version,
      files: version.files === null ? null : { ...version.files },
      changes: version.changes === undefined ? undefined : {
        added: [...version.changes.added],
        modified: [...version.changes.modified],
        deleted: [...version.changes.deleted],
      },
      };
    }),
    run: null,
    resources: snapshot.resources.map((storedResource) => Object.fromEntries(
      Object.entries(storedResource).filter(([key]) => key !== "schemaVersion"),
    ) as ProjectResourceDraft),
  };
}

export async function hashFiles(files: SerializableFileMap): Promise<string> {
  if (typeof crypto === "undefined" || crypto.subtle === undefined) {
    throw new Error("当前环境不支持项目文件完整性校验");
  }
  const bytes = new TextEncoder().encode(stableStringify(serializeFiles(files)));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function toProjectVersion(version: ProjectVersionDraft): ProjectVersion {
  return {
    versionId: version.versionId,
    versionNumber: version.versionNumber,
    threadId: version.threadId,
    assistantMessageId: version.assistantMessageId,
    operation: version.operation,
    prompt: version.prompt,
    timestamp: version.timestamp,
    files: version.files === null ? null : { ...version.files },
    fileCount: version.fileCount,
    changes: version.changes === undefined ? undefined : {
      added: [...version.changes.added],
      modified: [...version.changes.modified],
      deleted: [...version.changes.deleted],
    },
    label: version.label,
    notes: version.notes,
    parentVersionId: version.parentVersionId,
    restoredFromVersionId: version.restoredFromVersionId,
  };
}

function serializeMessage(message: ChatMessage): SerializableMessage {
  if (message.id.trim().length === 0) throw new Error("消息 ID 不能为空");
  const attachments = message.attachments?.map((attachment): SerializableAttachment => ({
    type: "image",
    url: requireString(attachment.url, `消息附件：${message.id}`),
    id: attachment.id,
    name: attachment.name,
  }));
  return {
    id: message.id,
    role: message.role,
    content: requireString(message.content, `消息内容：${message.id}`),
    attachments,
  };
}

function serializeVersion(version: ProjectVersion, projectId: string): ProjectVersionDraft {
  if (!Number.isSafeInteger(version.versionNumber) || version.versionNumber < 1) {
    throw new Error(`版本号无效：${version.versionId}`);
  }
  return {
    versionId: requireId(version.versionId, "版本 ID"),
    projectId: requireId(projectId, "项目 ID"),
    versionNumber: version.versionNumber,
    threadId: requireString(version.threadId, "版本 threadId"),
    assistantMessageId: requireString(version.assistantMessageId, "版本消息 ID"),
    operation: version.operation,
    prompt: requireString(version.prompt, "版本 prompt"),
    timestamp: requireTimestamp(version.timestamp, "版本时间"),
    files: version.files === null ? null : serializeFiles(version.files),
    fileCount: version.fileCount,
    changes: version.changes === undefined ? undefined : {
      added: [...version.changes.added],
      modified: [...version.changes.modified],
      deleted: [...version.changes.deleted],
    },
    label: version.label,
    notes: version.notes,
    parentVersionId: version.parentVersionId,
    restoredFromVersionId: version.restoredFromVersionId,
  };
}

function serializeRun(generation: GenerationState, projectId: string): ProjectRunDraft | null {
  if (generation.startedAt === undefined) return null;
  const run: ProjectRunDraft = {
    runId: generation.runId ?? `${projectId}:generation:${generation.startedAt}`,
    projectId,
    kind: "generation",
    status: generation.status,
    startedAt: generation.startedAt,
    currentPhase: generation.currentPhase,
    currentStep: generation.currentStep,
    failedNode: generation.failedNode,
    error: generation.error,
  };
  if (generation.validationReport !== undefined) {
    run.validationReport = cloneValidationReport(generation.validationReport);
  }
  if (generation.mode !== undefined) run.mode = generation.mode;
  if (generation.modeForced !== undefined) run.modeForced = generation.modeForced;
  if (generation.elapsedMs !== undefined && generation.status !== "running") {
    run.endedAt = generation.startedAt + generation.elapsedMs;
  }
  return run;
}

function cloneValidationReport(report: ValidationReport): ValidationReport {
  return {
    ...report,
    layers: report.layers.map((layer) => ({ ...layer })),
    repairHistory: report.repairHistory.map((attempt) => ({ ...attempt })),
  };
}

function serializeResources(
  manifest: CaseResourceManifest | undefined,
  projectId: string,
  files: SerializableFileMap,
): ProjectResourceDraft[] {
  if (manifest === undefined) return [];
  return manifest.resources.map((resource) => ({
    resourceKey: `${projectId}:${resource.id}`,
    projectId,
    id: resource.id,
    kind: resource.kind,
    hostPath: resource.hostPath,
    sandpackPath: resource.sandpackPath,
    exportPath: resource.exportPath,
    contentType: resource.contentType,
    source: "case-manifest",
    status: files[resource.sandpackPath] === undefined ? "missing" : "available",
  }));
}

function normalizePath(path: string): string {
  if (!path.startsWith("/") || path.includes("\\") || path.includes("//")) {
    throw new Error(`文件路径无效：${path}`);
  }
  const parts = path.slice(1).split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`文件路径无效：${path}`);
  }
  return path;
}

function requireId(value: string, label: string): string {
  const id = requireString(value, label).trim();
  if (id.length === 0 || id.length > 200 || id.includes("/")) throw new Error(`${label}无效`);
  return id;
}

function requireString(value: string, label: string): string {
  if (typeof value !== "string") throw new Error(`${label}必须是文本`);
  return value;
}

function requireTimestamp(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label}无效`);
  return value;
}

function createUuid(): string {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    throw new Error("当前浏览器不支持安全的项目 ID 生成");
  }
  return crypto.randomUUID();
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(",")}}`;
}
