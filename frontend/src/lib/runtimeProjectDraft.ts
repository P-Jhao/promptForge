import { createProjectDraft } from "@/lib/projectSerialization";
import type { ProjectDraft, ProjectResourceDraft } from "@/types/project";
import type { ChatState, SandpackStore } from "@/types/store";

export interface ProjectDraftIdentity {
  createdAt: number;
  workspaceId: string;
}

export interface ProjectDraftOverrides {
  projectId?: string;
  projectName?: string;
  createdAt?: number;
  workspaceId?: string;
}

export function createDraftFromRuntimeState(
  chatState: Pick<ChatState, "currentProjectId" | "projectName" | "currentVersion" | "versions" | "messages" | "generation">,
  sandpackState: Pick<SandpackStore, "currentFiles" | "generatedFiles">,
  identity: ProjectDraftIdentity,
  resourceRecords: readonly ProjectResourceDraft[] | undefined,
  overrides: ProjectDraftOverrides = {},
): ProjectDraft {
  const projectId = overrides.projectId ?? chatState.currentProjectId;
  const projectName = overrides.projectName ?? chatState.projectName;
  return createProjectDraft({
    projectId,
    projectName,
    createdAt: overrides.createdAt ?? identity.createdAt,
    workspaceId: overrides.workspaceId ?? identity.workspaceId,
    currentVersion: chatState.currentVersion,
    versions: chatState.versions,
    messages: chatState.messages,
    files: sandpackState.currentFiles ?? sandpackState.generatedFiles,
    generation: chatState.generation,
    resourceRecords,
  });
}
