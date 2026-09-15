"use client";

import { FolderOpen, History, Save, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { storageStatusLabel } from "@/lib/projectStorage";
import type { ProjectVersion } from "@/types/store";

type PendingAction =
  | { kind: "open"; projectId: string }
  | { kind: "restore"; version: ProjectVersion };

export function ProjectManager() {
  const projectId = useChatStore((state) => state.currentProjectId);
  const projectName = useChatStore((state) => state.projectName);
  const versions = useChatStore((state) => state.versions);
  const isLoading = useChatStore((state) => state.isLoading);
  const candidate = useChatStore((state) => state.candidate);
  const updateProjectName = useChatStore((state) => state.updateProjectName);
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
    setBusy(true);
    try {
      if (action.kind === "open") await persistence.openProject(action.projectId);
      else await persistence.restoreVersion(action.version);
      setShowBrowser(false);
      setPending(null);
    } catch {
      // Repository errors are already exposed by the persistence hook.
    } finally {
      setBusy(false);
    }
  };

  const requestAction = (action: PendingAction): void => {
    if (action.kind === "open" && action.projectId === projectId) {
      setShowBrowser(false);
      return;
    }
    if (persistence.dirty) setPending(action);
    else void execute(action);
  };

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
        <div className="project-modal-backdrop" role="presentation">
          <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-browser-title">
            <div className="project-modal-head">
              <h2 id="project-browser-title">打开本地项目</h2>
              <button type="button" onClick={() => setShowBrowser(false)} aria-label="关闭项目列表"><X size={16} /></button>
            </div>
            {persistence.listLoading && <p className="project-modal-note">正在读取本地项目…</p>}
            {!persistence.listLoading && persistence.projects.length === 0 && <p className="project-modal-note">未找到本地项目，可能是首次访问、浏览器变化或站点数据已被清除。</p>}
            <div className="project-list">
              {persistence.projects.map((project) => (
                <button type="button" key={project.projectId} className="project-list-item" onClick={() => requestAction({ kind: "open", projectId: project.projectId })}>
                  <strong>{project.name}</strong>
                  <span>版本 {project.currentVersion} · 修订 {project.revision}</span>
                </button>
              ))}
            </div>
            <div className="project-history">
              <h3><History size={14} /> 当前项目版本历史</h3>
              {versions.length === 0 && <p className="project-modal-note">尚无已接受版本。</p>}
              {[...versions].reverse().map((version) => (
                <button type="button" key={version.versionId} className="project-history-item" disabled={version.files === null || busy || isLoading || candidateBlocksSwitch} onClick={() => requestAction({ kind: "restore", version })}>
                  <span>版本 {version.versionNumber} · {version.operation === "restore" ? "恢复" : version.operation === "create" ? "创建" : "编辑"}</span>
                  <small>{version.files === null ? "无文件快照" : `${version.fileCount} 个文件`}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
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

      {pending !== null && (
        <div className="project-modal-backdrop" role="presentation">
          <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="dirty-title">
            <div className="project-modal-head"><h2 id="dirty-title">当前项目有未保存修改</h2></div>
            <p className="project-modal-note">切换项目或恢复版本前，请选择如何处理当前工作副本。</p>
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
