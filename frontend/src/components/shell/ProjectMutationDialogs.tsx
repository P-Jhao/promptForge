"use client";

export interface ProjectMutationTarget {
  projectId: string;
  name: string;
  revision: number;
}

interface RenameProjectDialogProps {
  target: ProjectMutationTarget;
  name: string;
  busy: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RenameProjectDialog({ target, name, busy, onNameChange, onCancel, onConfirm }: RenameProjectDialogProps) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="rename-project-title">
        <div className="project-modal-head"><h2 id="rename-project-title">重命名项目</h2></div>
        <p className="project-modal-note">修改“{target.name}”的项目名称，代码、聊天记录和版本历史会保持不变。</p>
        <form onSubmit={(event) => { event.preventDefault(); onConfirm(); }}>
          <label className="project-name-label" htmlFor="rename-project-name">项目名称</label>
          <input id="rename-project-name" className="project-name-input" autoFocus value={name} onChange={(event) => onNameChange(event.target.value)} />
          <div className="project-modal-actions">
            <button type="button" onClick={onCancel} disabled={busy}>取消</button>
            <button type="submit" disabled={busy || name.trim().length === 0}>保存名称</button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface DeleteProjectDialogProps {
  target: ProjectMutationTarget;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteProjectDialog({ target, busy, onCancel, onConfirm }: DeleteProjectDialogProps) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-modal project-modal-small" role="alertdialog" aria-modal="true" aria-labelledby="delete-project-title" aria-describedby="delete-project-description">
        <div className="project-modal-head"><h2 id="delete-project-title">删除本地项目？</h2></div>
        <p id="delete-project-description" className="project-modal-note">将删除“{target.name}”的本地项目、代码、聊天记录和版本历史。此操作无法从项目列表恢复。</p>
        <div className="project-modal-actions">
          <button type="button" onClick={onCancel} disabled={busy}>取消</button>
          <button type="button" onClick={onConfirm} disabled={busy}>删除项目</button>
        </div>
      </section>
    </div>
  );
}
