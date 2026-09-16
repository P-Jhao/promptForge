"use client";

import { History, X } from "lucide-react";
import type { ProjectSummary } from "@/types/project";
import type { ProjectVersion } from "@/types/store";
import type { ProjectMutationTarget } from "./ProjectMutationDialogs";

interface ProjectBrowserModalProps {
  projects: ProjectSummary[];
  versions: ProjectVersion[];
  currentVersion: number;
  listLoading: boolean;
  busy: boolean;
  isLoading: boolean;
  isAssembling: boolean;
  candidatePresent: boolean;
  storageSaving: boolean;
  onClose: () => void;
  onOpen: (projectId: string) => void;
  onRestore: (version: ProjectVersion) => void;
  onRename: (target: ProjectMutationTarget) => void;
  onDelete: (target: ProjectMutationTarget) => void;
}

export function ProjectBrowserModal({ projects, versions, currentVersion, listLoading, busy, isLoading, isAssembling, candidatePresent, storageSaving, onClose, onOpen, onRestore, onRename, onDelete }: ProjectBrowserModalProps) {
  const itemDisabled = busy || isLoading || isAssembling || candidatePresent || storageSaving;
  return (
    <div className="project-modal-backdrop" role="presentation">
      <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-browser-title">
        <div className="project-modal-head">
          <h2 id="project-browser-title">打开本地项目</h2>
          <button type="button" onClick={onClose} aria-label="关闭项目列表"><X size={16} /></button>
        </div>
        {listLoading && <p className="project-modal-note">正在读取本地项目…</p>}
        {!listLoading && projects.length === 0 && <p className="project-modal-note">未找到本地项目，可能是首次访问、浏览器变化或站点数据已被清除。</p>}
        <div className="project-list">
          {projects.map((project) => {
            const target = { projectId: project.projectId, name: project.name, revision: project.revision } satisfies ProjectMutationTarget;
            return (
              <div className="project-list-item" key={project.projectId}>
                <button type="button" className="project-list-open" onClick={() => onOpen(project.projectId)} disabled={itemDisabled}>
                  <strong>{project.name}</strong>
                  <span>已接受版本 {project.currentVersion > 0 ? `v${String(project.currentVersion)}` : "尚无"} · 诊断修订 {project.revision}</span>
                </button>
                <div className="project-list-actions" aria-label={`${project.name} 操作`}>
                  <button type="button" onClick={() => onRename(target)} disabled={itemDisabled} aria-label={`重命名 ${project.name}`}>重命名</button>
                  <button type="button" onClick={() => onDelete(target)} disabled={itemDisabled} aria-label={`删除 ${project.name}`}>删除</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="project-history">
          <h3><History size={14} /> 当前项目版本历史</h3>
          {versions.length === 0 && <p className="project-modal-note">尚无已接受版本。</p>}
          {[...versions].reverse().map((version) => (
            <button type="button" key={version.versionId} className="project-history-item" disabled={version.files === null || itemDisabled} onClick={() => onRestore(version)}>
              <span>{version.versionNumber === currentVersion ? "当前版本" : "历史版本"} · {version.operation === "restore" ? "恢复产生" : "已接受"} · v{version.versionNumber}</span>
              <small>{version.files === null ? "无文件快照" : version.restoredFromVersionId === undefined ? `${version.fileCount} 个文件` : `恢复自 ${version.restoredFromVersionId} · ${version.fileCount} 个文件`}{version.label === undefined ? "" : ` · ${version.label}`}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
