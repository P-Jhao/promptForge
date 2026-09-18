"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import type { ProjectPersistenceApi } from "@/hooks/useProjectPersistence";
import { storageStatusLabel } from "@/lib/projectStorage";
import { evaluateNewProjectDecision } from "@/lib/newProjectGuard";
import type { ProjectVersion } from "@/types/store";
import { DeleteProjectDialog, RenameProjectDialog } from "./ProjectMutationDialogs";
import { ProjectBrowserModal } from "./ProjectBrowserModal";
import { useProjectManagerMutations } from "@/hooks/useProjectManagerMutations";
import { ProjectManagerTopActions } from "./ProjectManagerTopActions";
import { ProjectManagerSaveAsDialog } from "./ProjectManagerSaveAsDialog";
import { ProjectManagerPendingDialog, type PendingProjectChoice } from "./ProjectManagerPendingDialog";
import { useWorkspaceSession } from "./WorkspaceSessionContext";
type PendingAction =
  | { kind: "new" }
  | { kind: "open"; projectId: string }
  | { kind: "restore"; version: ProjectVersion };

export function ProjectManager({ persistence }: { persistence: ProjectPersistenceApi }) {
  const router = useRouter();
  const workspace = useWorkspaceSession();
  const projectId = useChatStore((state) => state.currentProjectId);
  const projectName = useChatStore((state) => state.projectName);
  const versions = useChatStore((state) => state.versions);
  const acceptedVersion = versions.at(-1);
  const isLoading = useChatStore((state) => state.isLoading);
  const candidate = useChatStore((state) => state.candidate);
  const createNewProject = useChatStore((state) => state.createNewProject);
  const clearGeneratedFiles = useSandpackStore((state) => state.clearGeneratedFiles);
  const isAssembling = useSandpackStore((state) => state.isAssembling);
  const previewFiles = useSandpackStore((state) => state.previewFiles);
  const currentFiles = useSandpackStore((state) => state.currentFiles);
  const generatedFiles = useSandpackStore((state) => state.generatedFiles);
  const previewManifest = useSandpackStore((state) => state.previewManifest);
  const { refreshProjects } = persistence;
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState(`${projectName} 副本`);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingAfterSaveAs, setPendingAfterSaveAs] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const storageBusy = persistence.status === "saving" || persistence.status === "loading";
  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);
  const execute = async (action: PendingAction): Promise<void> => {
    if (persistence.status === "saving" || persistence.status === "loading") {
      toast.info("当前项目仍在读取或保存，请稍后再操作");
      return;
    }
    if (action.kind !== "new") {
      const latestChat = useChatStore.getState();
      if (latestChat.isLoading || latestChat.candidate !== null || useSandpackStore.getState().isAssembling) {
        toast.info("当前请求或校验仍在进行，请完成后再切换项目");
        return;
      }
    }
    if (action.kind === "new") {
      const decision = evaluateNewProjectDecision({
        dirty: false,
        isLoading: useChatStore.getState().isLoading,
        candidatePresent: useChatStore.getState().candidate !== null,
      });
      if (decision !== "allow" || useSandpackStore.getState().isAssembling) {
        toast.info(decision === "blocked-loading" ? "当前请求仍在进行，请稍后再新建项目" : "请先应用或放弃当前候选");
        return;
      }
    }
    setBusy(true);
    try {
      if (action.kind === "new") {
        createNewProject();
        clearGeneratedFiles();
        router.replace("/workspace");
      } else if (action.kind === "open") {
        await persistence.openProject(action.projectId);
      } else {
        await persistence.restoreVersion(action.version);
      }
      setShowBrowser(false);
      setPending(null);
    } catch {
      // Repository errors are already exposed by the persistence hook.
    } finally {
      setBusy(false);
    }
  };
  const requestNewProject = (): void => {
    if (storageBusy) {
      toast.info("当前项目仍在读取或保存，请稍后再新建项目");
      return;
    }
    if (isAssembling) {
      toast.info("当前项目仍在写入预览，请稍后再新建项目");
      return;
    }
    const decision = evaluateNewProjectDecision({
      dirty: persistence.dirty,
      isLoading,
      candidatePresent: candidate !== null,
    });
    if (decision === "allow") {
      void execute({ kind: "new" });
      return;
    }
    if (decision === "confirm-dirty") {
      setPending({ kind: "new" });
      return;
    }
    toast.info(decision === "blocked-loading" ? "当前请求仍在进行，请稍后再新建项目" : "请先应用或放弃当前候选");
  };
  const requestAction = (action: PendingAction): void => {
    if (action.kind === "open" && action.projectId === projectId) {
      setShowBrowser(false);
      return;
    }
    if (storageBusy || isLoading || isAssembling || candidate !== null || busy) {
      toast.info("当前请求或校验仍在进行，请完成后再切换项目");
      return;
    }
    if (persistence.dirty) setPending(action);
    else void execute(action);
  };
  const mutations = useProjectManagerMutations({
    projectId,
    isLoading,
    isAssembling,
    candidatePresent: candidate !== null,
    dirty: persistence.dirty,
    storageBusy,
    busy,
    setBusy,
    setShowBrowser,
    persistence,
    onCurrentProjectDeleted: () => {
      createNewProject();
      clearGeneratedFiles();
      setShowBrowser(false);
      router.replace("/workspace");
    },
  });
  const save = (): void => {
    if (storageBusy) {
      toast.info("当前项目仍在读取或保存，请稍后再保存");
      return;
    }
    void persistence.saveCurrentProject().catch(() => undefined);
  };

  const beginSaveAs = (): void => {
    setShowBrowser(false);
    setSaveAsName(`${projectName} 副本`);
    setShowSaveAs(true);
  };

  const submitSaveAs = async (): Promise<void> => {
    if (persistence.status === "saving" || persistence.status === "loading") {
      toast.info("当前项目仍在读取或保存，请稍后再另存为");
      return;
    }
    setBusy(true);
    try {
      await persistence.saveAs(saveAsName);
      setShowSaveAs(false);
      const continuation = pendingAfterSaveAs;
      setPendingAfterSaveAs(null);
      setPending(null);
      if (continuation !== null) await execute(continuation);
    } catch {
      // Repository errors are already exposed by the persistence hook.
    } finally {
      setBusy(false);
    }
  };

  const choosePending = (choice: PendingProjectChoice): void => {
    const action = pending;
    if (action === null || choice === "cancel") {
      setPending(null);
      return;
    }
    if (choice === "saveAs") {
      setPendingAfterSaveAs(action);
      setPending(null);
      beginSaveAs();
      return;
    }
    if (choice === "discard") {
      setPending(null);
      void execute(action);
      return;
    }
    setPending(null);
    void (async () => {
      try {
        await persistence.saveCurrentProject();
        await execute(action);
      } catch {
        // Keep the current in-memory files when saving fails.
      }
    })();
  };

  const statusText = persistence.dirty
    ? "未保存"
    : workspace.autoSaved
      ? "✓ 已自动保存"
      : storageStatusLabel(persistence.status);
  const candidateBlocksSwitch = candidate !== null;

  return (
    <>
      <ProjectManagerTopActions
        projectName={projectName}
        statusText={statusText}
        isExample={workspace.surface === "example"}
        isChooser={workspace.surface === "chooser"}
        caseTitle={workspace.caseContext?.descriptor.title}
        dirty={persistence.dirty}
        busy={busy}
        storageBusy={storageBusy}
        isLoading={isLoading}
        candidatePresent={candidateBlocksSwitch}
        previewFiles={previewFiles}
        currentFiles={currentFiles}
        generatedFiles={generatedFiles}
        previewManifest={previewManifest}
        onOpenProjects={() => setShowBrowser(true)}
        onSave={save}
        onNewProject={requestNewProject}
        onSaveAs={beginSaveAs}
        onOpenCaseChooser={workspace.openCaseChooser}
      />

      {persistence.error !== null && <p className="project-storage-error" role="alert">{persistence.error}</p>}
      {persistence.warning !== null && <p className="project-storage-warning" role="status">{persistence.warning}</p>}

      {showBrowser && (
        <ProjectBrowserModal
          projects={persistence.projects}
          versions={versions}
          currentVersion={acceptedVersion?.versionNumber ?? 0}
          listLoading={persistence.listLoading}
          busy={busy}
          isLoading={isLoading}
          isAssembling={isAssembling}
          candidatePresent={candidateBlocksSwitch}
          storageBusy={storageBusy}
          onClose={() => setShowBrowser(false)}
          onOpen={(targetProjectId) => requestAction({ kind: "open", projectId: targetProjectId })}
          onRestore={(version) => requestAction({ kind: "restore", version })}
          onRename={mutations.requestRename}
          onDelete={mutations.requestDelete}
        />
      )}

      {showSaveAs && (
        <ProjectManagerSaveAsDialog
          name={saveAsName}
          busy={busy}
          onNameChange={setSaveAsName}
          onClose={() => { setShowSaveAs(false); setPendingAfterSaveAs(null); }}
          onSubmit={() => void submitSaveAs()}
        />
      )}

      {mutations.renameTarget !== null && (
        <RenameProjectDialog
          target={mutations.renameTarget}
          name={mutations.renameName}
          busy={busy}
          onNameChange={mutations.setRenameName}
          onCancel={() => mutations.setRenameTarget(null)}
          onConfirm={() => void mutations.confirmRename()}
        />
      )}

      {mutations.deleteTarget !== null && (
        <DeleteProjectDialog
          target={mutations.deleteTarget}
          busy={busy}
          onCancel={() => mutations.setDeleteTarget(null)}
          onConfirm={() => void mutations.confirmDelete()}
        />
      )}

      {pending !== null && (
        <ProjectManagerPendingDialog busy={busy} onChoose={choosePending} />
      )}
    </>
  );
}
