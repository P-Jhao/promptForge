"use client";

export type PendingProjectChoice = "save" | "discard" | "saveAs" | "cancel";

interface ProjectManagerPendingDialogProps {
  busy: boolean;
  onChoose: (choice: PendingProjectChoice) => void;
}

export function ProjectManagerPendingDialog({ busy, onChoose }: ProjectManagerPendingDialogProps) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="dirty-title">
        <div className="project-modal-head"><h2 id="dirty-title">当前项目有未保存修改</h2></div>
        <p className="project-modal-note">切换项目、恢复版本或新建项目之前，请选择如何处理当前工作副本。</p>
        <div className="project-modal-actions project-modal-actions-stack">
          <button type="button" onClick={() => onChoose("save")} disabled={busy}>保存并继续</button>
          <button type="button" onClick={() => onChoose("saveAs")} disabled={busy}>另存为并继续</button>
          <button type="button" onClick={() => onChoose("discard")} disabled={busy}>放弃当前修改</button>
          <button type="button" onClick={() => onChoose("cancel")} disabled={busy}>取消</button>
        </div>
      </section>
    </div>
  );
}
