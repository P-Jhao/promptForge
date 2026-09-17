"use client";

import { X } from "lucide-react";

interface ProjectManagerSaveAsDialogProps {
  name: string;
  busy: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function ProjectManagerSaveAsDialog({ name, busy, onNameChange, onClose, onSubmit }: ProjectManagerSaveAsDialogProps) {
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-modal project-modal-small" role="dialog" aria-modal="true" aria-labelledby="save-as-title">
        <div className="project-modal-head">
          <h2 id="save-as-title">另存为新项目</h2>
          <button type="button" onClick={onClose} aria-label="关闭另存为"><X size={16} /></button>
        </div>
        <label className="project-name-label" htmlFor="save-as-name">项目名称</label>
        <input id="save-as-name" autoFocus value={name} onChange={(event) => onNameChange(event.target.value)} />
        <div className="project-modal-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" onClick={onSubmit} disabled={busy || name.trim().length === 0}>保存副本</button>
        </div>
      </section>
    </div>
  );
}
