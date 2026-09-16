"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import { IndexedDbProjectRepository } from "@/lib/projectRepository";
import {
  createProjectDraft,
  createProjectId,
  createWorkspaceId,
  projectDraftFingerprint,
  projectDraftFingerprintWithoutVersionMetadata,
  snapshotToDraft,
  toProjectVersion,
} from "@/lib/projectSerialization";
import type { ProjectDraft, ProjectRepository, ProjectSnapshot, ProjectStorageStatus, ProjectSummary, VersionMetadata, VersionMetadataSaveMode } from "@/types/project";
import type { ProjectVersion } from "@/types/store";

export interface ProjectPersistenceApi {
  status: ProjectStorageStatus;
  dirty: boolean;
  error: string | null;
  warning: string | null;
  projects: ProjectSummary[];
  listLoading: boolean;
  saveCurrentProject: () => Promise<void>;
  saveAs: (name: string) => Promise<void>;
  openProject: (projectId: string) => Promise<void>;
  restoreVersion: (version: ProjectVersion) => Promise<void>;
  updateVersionMetadata: (versionId: string, metadata: VersionMetadata) => Promise<VersionMetadataSaveMode>;
  renameProject: (projectId: string, name: string, expectedRevision?: number) => Promise<void>;
  deleteProject: (projectId: string, expectedRevision?: number) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export function useProjectPersistence(): ProjectPersistenceApi {
  const projectId = useChatStore((state) => state.currentProjectId);
  const projectName = useChatStore((state) => state.projectName);
  const currentVersion = useChatStore((state) => state.currentVersion);
  const versions = useChatStore((state) => state.versions);
  const messages = useChatStore((state) => state.messages);
  const generation = useChatStore((state) => state.generation);
  const setCurrentProject = useChatStore((state) => state.setCurrentProject);
  const hydrateProject = useChatStore((state) => state.hydrateProject);
  const saveVersion = useChatStore((state) => state.saveVersion);
  const updateVersionMetadataInStore = useChatStore((state) => state.updateVersionMetadata);
  const incrementVersion = useChatStore((state) => state.incrementVersion);
  const getCurrentThreadId = useChatStore((state) => state.getCurrentThreadId);
  const currentFiles = useSandpackStore((state) => state.currentFiles ?? state.generatedFiles);
  const setGeneratedFiles = useSandpackStore((state) => state.setGeneratedFiles);
  const repositoryRef = useRef<ProjectRepository | null>(null);
  if (repositoryRef.current === null) repositoryRef.current = new IndexedDbProjectRepository();
  const expectedRevisionRef = useRef<number | null>(null);
  const savedFingerprintRef = useRef<string | null>(null);
  const savedDraftRef = useRef<ProjectDraft | null>(null);
  const identityRef = useRef({ projectId, createdAt: Date.now(), workspaceId: `workspace-${projectId}` });
  if (identityRef.current.projectId !== projectId) {
    identityRef.current = { projectId, createdAt: Date.now(), workspaceId: `workspace-${projectId}` };
    expectedRevisionRef.current = null;
    savedFingerprintRef.current = null;
    savedDraftRef.current = null;
  }
  const [status, setStatus] = useState<ProjectStorageStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const identity = identityRef.current;
  const draft = useMemo(() => createProjectDraft({
    projectId,
    projectName,
    createdAt: identity.createdAt,
    workspaceId: identity.workspaceId,
    currentVersion,
    versions,
    messages,
    files: currentFiles,
    generation,
    resourceManifest: typeof window === "undefined" ? undefined : window.__resourceManifest,
  }), [currentFiles, currentVersion, generation, messages, projectId, projectName, versions, identity.createdAt, identity.workspaceId]);
  const fingerprint = useMemo(() => projectDraftFingerprint(draft), [draft]);
  const hasContent = draft.files !== undefined && (
    Object.keys(draft.files).length > 0 || draft.messages.length > 0 || draft.versions.length > 0 || draft.name !== "新项目"
  );
  const dirty = savedFingerprintRef.current === null ? hasContent : savedFingerprintRef.current !== fingerprint;

  const refreshProjects = useCallback(async () => {
    setListLoading(true);
    try {
      setProjects(await repositoryRef.current!.listProjects());
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "无法读取本地项目");
    } finally {
      setListLoading(false);
    }
  }, []);

  const saveCurrentProject = useCallback(async () => {
    setStatus("saving");
    setError(null);
    try {
      const result = await repositoryRef.current!.saveProject(draft, expectedRevisionRef.current);
      expectedRevisionRef.current = result.revision;
      savedFingerprintRef.current = fingerprint;
      savedDraftRef.current = draft;
      setWarning(null);
      setStatus("saved");
      await refreshProjects();
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "项目保存失败，内存内容已保留");
      throw caught;
    }
  }, [draft, fingerprint, refreshProjects]);

  const saveAs = useCallback(async (name: string) => {
    const nextName = name.trim();
    if (nextName.length === 0) throw new Error("项目名称不能为空");
    setStatus("saving");
    setError(null);
    const nextProjectId = createProjectId();
    const nextDraft = createProjectDraft({
      projectId: nextProjectId,
      projectName: nextName,
      createdAt: Date.now(),
      workspaceId: createWorkspaceId(nextProjectId),
      currentVersion,
      versions,
      messages,
      files: currentFiles,
      generation,
      resourceManifest: typeof window === "undefined" ? undefined : window.__resourceManifest,
    });
    try {
      const result = await repositoryRef.current!.saveProject(nextDraft, null);
      identityRef.current = { projectId: nextProjectId, createdAt: nextDraft.createdAt, workspaceId: nextDraft.workspaceId };
      expectedRevisionRef.current = result.revision;
      savedFingerprintRef.current = projectDraftFingerprint(nextDraft);
      savedDraftRef.current = nextDraft;
      setCurrentProject(nextProjectId, nextName);
      setWarning(null);
      setStatus("saved");
      await refreshProjects();
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "另存为失败，内存内容已保留");
      throw caught;
    }
  }, [currentFiles, currentVersion, generation, messages, refreshProjects, setCurrentProject, versions]);

  const applySnapshot = useCallback((snapshot: ProjectSnapshot): void => {
    const sortedVersions = [...snapshot.versions].sort((first, second) => first.versionNumber - second.versionNumber);
    identityRef.current = {
      projectId: snapshot.project.projectId,
      createdAt: snapshot.workspace.createdAt,
      workspaceId: snapshot.workspace.workspaceId,
    };
    hydrateProject({
      projectId: snapshot.project.projectId,
      projectName: snapshot.project.name,
      currentVersion: snapshot.project.currentVersion,
      versions: sortedVersions.map(toProjectVersion),
      messages: snapshot.project.messages,
    });
    setGeneratedFiles(snapshot.workspace.files);
    expectedRevisionRef.current = snapshot.project.revision;
    setWarning(snapshot.warnings.length === 0 ? null : snapshot.warnings.join(" "));
    setStatus("saved");
  }, [hydrateProject, setGeneratedFiles]);

  const openProject = useCallback(async (targetProjectId: string) => {
    setStatus("loading");
    setError(null);
    try {
      const snapshot = await repositoryRef.current!.loadProject(targetProjectId);
      if (snapshot === null) throw new Error("未找到本地项目，可能是首次访问、浏览器变化或站点数据已被清除。");
      applySnapshot(snapshot);
      const loadedDraft = snapshotToDraft(snapshot);
      savedFingerprintRef.current = projectDraftFingerprint(loadedDraft);
      savedDraftRef.current = loadedDraft;
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "项目打开失败，内存内容已保留");
      throw caught;
    }
  }, [applySnapshot]);

  const restoreVersion = useCallback(async (version: ProjectVersion) => {
    if (version.files === null) throw new Error("该版本没有可恢复的文件快照");
    const nextNumber = incrementVersion();
    const threadId = getCurrentThreadId();
    setGeneratedFiles(version.files);
    saveVersion({
      versionNumber: nextNumber,
      threadId,
      assistantMessageId: `restore-${Date.now()}`,
      operation: "restore",
      prompt: `恢复版本 ${version.versionNumber}`,
      timestamp: Date.now(),
      files: version.files,
      fileCount: Object.keys(version.files).length,
      parentVersionId: version.versionId,
      restoredFromVersionId: version.versionId,
    });
    setStatus("idle");
    setError(null);
  }, [getCurrentThreadId, incrementVersion, saveVersion, setGeneratedFiles]);

  const resolveRevision = useCallback((targetProjectId: string, expectedRevision?: number): number => {
    const revision = targetProjectId === projectId ? expectedRevisionRef.current ?? expectedRevision : expectedRevision;
    if (revision === undefined || revision === null) throw new Error("项目尚未保存或缺少当前修订号，无法执行此操作。请先保存或刷新项目列表。" );
    return revision;
  }, [projectId]);
  const updateVersionMetadata = useCallback(async (versionId: string, metadata: VersionMetadata) => {
    setStatus("saving");
    setError(null);
    const cleanBeforeUpdate = savedDraftRef.current !== null
      && projectDraftFingerprintWithoutVersionMetadata(draft, versionId) === projectDraftFingerprintWithoutVersionMetadata(savedDraftRef.current, versionId);
    try {
      if (expectedRevisionRef.current === null || savedDraftRef.current?.versions.some((version) => version.versionId === versionId) !== true) {
        updateVersionMetadataInStore(versionId, metadata);
        setWarning("当前项目尚未保存，版本标签和备注已暂存；保存项目后才会写入本地项目。" );
        setStatus("idle");
        return "memory";
      }
      const result = await repositoryRef.current!.updateVersionMetadata(
        projectId,
        versionId,
        metadata,
        resolveRevision(projectId),
      );
      updateVersionMetadataInStore(versionId, { label: result.version.label, notes: result.version.notes });
      const nextVersions = draft.versions.map((version) => version.versionId === versionId
        ? { ...version, label: result.version.label, notes: result.version.notes }
        : version);
      if (cleanBeforeUpdate) {
        const nextDraft = { ...draft, versions: nextVersions };
        savedFingerprintRef.current = projectDraftFingerprint(nextDraft);
        savedDraftRef.current = nextDraft;
      }
      expectedRevisionRef.current = result.revision;
      setWarning(null);
      setStatus("saved");
      await refreshProjects();
      return "saved";
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "版本元数据更新失败，当前内容已保留");
      throw caught;
    }
  }, [draft, projectId, refreshProjects, resolveRevision, updateVersionMetadataInStore]);

  const renameProject = useCallback(async (targetProjectId: string, name: string, expectedRevision?: number) => {
    setStatus("saving");
    setError(null);
    try {
      const result = await repositoryRef.current!.renameProject(targetProjectId, name, resolveRevision(targetProjectId, expectedRevision));
      if (targetProjectId === projectId) {
        setCurrentProject(result.projectId, result.name);
        expectedRevisionRef.current = result.revision;
        savedFingerprintRef.current = projectDraftFingerprint({ ...draft, name: result.name });
        savedDraftRef.current = { ...draft, name: result.name };
        setWarning(null);
      }
      setStatus(targetProjectId === projectId ? "saved" : "idle");
      await refreshProjects();
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "重命名失败，当前内容已保留");
      throw caught;
    }
  }, [draft, projectId, refreshProjects, resolveRevision, setCurrentProject]);

  const deleteProject = useCallback(async (targetProjectId: string, expectedRevision?: number) => {
    setStatus("saving");
    setError(null);
    try {
      const revision = resolveRevision(targetProjectId, expectedRevision);
      await repositoryRef.current!.deleteProject(targetProjectId, revision);
      if (targetProjectId === projectId) {
        expectedRevisionRef.current = null;
        savedFingerprintRef.current = null;
        savedDraftRef.current = null;
        setWarning(null);
        setStatus("idle");
      } else {
        setStatus("saved");
      }
      await refreshProjects();
    } catch (caught: unknown) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "删除失败，当前内容已保留");
      throw caught;
    }
  }, [projectId, refreshProjects, resolveRevision]);

  return { status, dirty, error, warning, projects, listLoading, saveCurrentProject, saveAs, openProject, restoreVersion, updateVersionMetadata, renameProject, deleteProject, refreshProjects };
}
