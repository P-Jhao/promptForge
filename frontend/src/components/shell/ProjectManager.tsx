"use client";

import { Copy, FolderOpen, Plus, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChatStore } from "@/store/chatStore";
import { useSandpackStore } from "@/store/sandpackStore";
import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { storageStatusLabel } from "@/lib/projectStorage";
import { evaluateNewProjectDecision } from "@/lib/newProjectGuard";
import type { ProjectVersion } from "@/types/store";
import { DeleteProjectDialog, RenameProjectDialog } from "./ProjectMutationDialogs";
import { ProjectBrowserModal } from "./ProjectBrowserModal";
import { useProjectManagerMutations } from "@/hooks/useProjectManagerMutations";

type PendingAction =
  | { kind: "new" }
  | { kind: "open"; projectId: string }
  | { kind: "restore"; version: ProjectVersion };

export function ProjectManager() {
  const router = useRouter();
  const projectId = useChatStore((state) => state.currentProjectId);
  const projectName = useChatStore((state) => state.projectName);
  const versions = useChatStore((state) => state.versions);
  const isLoading = useChatStore((state) => state.isLoading);
  const candidate = useChatStore((state) => state.candidate);
  const createNewProject = useChatStore((state) => state.createNewProject);
  const updateProjectName = useChatStore((state) => state.updateProjectName);
  const clearGeneratedFiles = useSandpackStore((state) => state.clearGeneratedFiles);
  const isAssembling = useSandpackStore((state) => state.isAssembling);
  const persistence = useProjectPersistence();
  const { refreshProjects } = persistence;
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState(`${projectName} 副本`);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingAfterSaveAs, setPendingAfterSaveAs] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const execute = async (action: PendingAction): Promise<void> => {
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
    if (isLoading || isAssembling || candidate !== null || busy) {
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
    storageSaving: persistence.status === "saving",
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
    void persistence.saveCurrentProject().catch(() => undefined);
  };

  const beginSaveAs = (): void => {
    setShowBrowser(false);
    setSaveAsName(`${projectName} 副本`);
    setShowSaveAs(true);
  };

  const submitSaveAs = async (): Promise<void> => {
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

  const choosePending = (choice: "save" | "discard" | "saveAs" | "cancel"): void => {
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

  const statusText = persistence.dirty ? "未保存" : storageStatusLabel(persistence.status);
  const statusClass = persistence.dirty ? "project-status dirty" : `project-status ${persistence.status}`;
  const candidateBlocksSwitch = candidate !== null;

  return (
    <>
      <div className="project-manager" aria-label="项目管理">
        <input
          aria-label="项目名称"
          value={projectName}
          onChange={(event) => updateProjectName(event.target.value.trim().length === 0 ? "新项目" : event.target.value)}
          title="项目名称"
        />
        <span className={statusClass} role="status">{statusText}</span>
        <button type="button" onClick={requestNewProject} disabled={busy || isLoading || candidateBlocksSwitch} title={isLoading ? "生成进行中，暂不能新建项目" : candidateBlocksSwitch ? "请先应用或放弃候选" : "新建空白项目"}>
          <Plus size={13} /> 新建项目
        </button>
        <button type="button" onClick={save} disabled={busy || persistence.status === "saving"} title="保存当前工作副本">
          <Save size={13} /> 保存
        </button>
        <button type="button" onClick={() => setShowBrowser(true)} disabled={busy || isLoading || candidateBlocksSwitch} title={isLoading ? "生成进行中，暂不能切换项目" : candidateBlocksSwitch ? "请先应用或放弃候选" : "打开本地项目"}>
          <FolderOpen size={13} /> 打开
        </button>
        <button type="button" onClick={beginSaveAs} disabled={busy || isLoading || candidateBlocksSwitch} title={isLoading ? "生成进行中，暂不能另存为" : candidateBlocksSwitch ? "请先应用或放弃候选" : "另存为新项目"}>
          <Copy size={13} /> 另存为
        </button>
      </div>

      {persistence.error !== null && <p className="project-storage-error" role="alert">{persistence.error}</p>}
      {persistence.warning !== null && <p className="project-storage-warning" role="status">{persistence.warning}</p>}

      {showBrowser && (
        <ProjectBrowserModal
          projects={persistence.projects}
          versions={versions}
          listLoading={persistence.listLoading}
          busy={busy}
          isLoading={isLoading}
          isAssembling={isAssembling}
          candidatePresent={candidateBlocksSwitch}
          storageSaving={persistence.status === "saving"}
          onClose={() => setShowBrowser(false)}
          onOpen={(targetProjectId) => requestAction({ kind: "open", projectId: targetProjectId })}
          onRestore={(version) => requestAction({ kind: "restore", version })}
          onRename={mutations.requestRename}
          onDelete={mutations.requestDelete}
        />
      )}

      {showSaveAs && (
        <div className="project-modal-backdrop" role="presentation">
          <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="save-as-title">
            <div className="project-modal-head">
              <h2 id="save-as-title">另存为新项目</h2>
              <button type="button" onClick={() => { setShowSaveAs(false); setPendingAfterSaveAs(null); }} aria-label="关闭另存为"><X size={16} /></button>
            </div>
            <label className="project-name-label" htmlFor="save-as-name">项目名称</label>
            <input id="save-as-name" autoFocus value={saveAsName} onChange={(event) => setSaveAsName(event.target.value)} />
            <div className="project-modal-actions">
              <button type="button" onClick={() => { setShowSaveAs(false); setPendingAfterSaveAs(null); }}>取消</button>
              <button type="button" onClick={() => void submitSaveAs()} disabled={busy || saveAsName.trim().length === 0}>保存副本</button>
            </div>
          </section>
        </div>
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
        <div className="project-modal-backdrop" role="presentation">
          <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="dirty-title">
            <div className="project-modal-head"><h2 id="dirty-title">当前项目有未保存修改</h2></div>
            <p className="project-modal-note">切换项目、恢复版本或新建项目之前，请选择如何处理当前工作副本。</p>
            <div className="project-modal-actions project-modal-actions-stack">
              <button type="button" onClick={() => choosePending("save")} disabled={busy}>保存并继续</button>
              <button type="button" onClick={() => choosePending("saveAs")} disabled={busy}>另存为并继续</button>
              <button type="button" onClick={() => choosePending("discard")} disabled={busy}>放弃当前修改</button>
              <button type="button" onClick={() => choosePending("cancel")} disabled={busy}>取消</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
